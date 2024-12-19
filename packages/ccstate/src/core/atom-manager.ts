import type { ReadableAtom, Command, Getter, Computed, State, Updater } from '../../types/core/atom';
import type { StoreOptions } from '../../types/core/store';

type DataWithCalledState<T> =
  | {
      called: false;
    }
  | {
      called: true;
      data: T;
    };

export interface StateState<T> {
  mounted?: Mounted;
  val: T;
  epoch: number;
}

export interface ComputedState<T> {
  mounted?: Mounted;
  val: T;
  dependencies: Map<ReadableAtom<unknown>, number>;
  epoch: number;
  abortController?: AbortController;
}

type CommonReadableState<T> = StateState<T> | ComputedState<T>;

type AtomState<T> = StateState<T> | ComputedState<T>;

interface Mounted {
  listeners: Set<Command<unknown, []>>;
  readDepts: Set<ReadableAtom<unknown>>;
}

function canReadAsCompute<T>(atom: ReadableAtom<T>): atom is Computed<T> {
  return 'read' in atom;
}

export class AtomManager {
  private atomStateMap = new WeakMap<ReadableAtom<unknown>, AtomState<unknown>>();

  private readonly stateAtomManager: StateAtomManager;
  private readonly computedManager: ComputedManager;

  constructor(options?: StoreOptions) {
    this.stateAtomManager = new StateAtomManager(this.atomStateMap, options);
    this.computedManager = new ComputedManager(this.atomStateMap, this, options);
  }

  public readAtomState<T>(atom: State<T>, ignoreMounted?: boolean): StateState<T>;
  public readAtomState<T>(atom: Computed<T>, ignoreMounted?: boolean): ComputedState<T>;
  public readAtomState<T>(atom: State<T> | Computed<T>, ignoreMounted?: boolean): CommonReadableState<T>;
  public readAtomState<T>(
    atom: State<T> | Computed<T>,
    ignoreMounted = false,
  ): StateState<T> | ComputedState<T> | CommonReadableState<T> {
    if (canReadAsCompute(atom)) {
      return this.computedManager.readAtomState(atom, ignoreMounted);
    }

    return this.stateAtomManager.readAtomState(atom);
  }

  public setAtomState<T>(atom: State<T>, value: T | Updater<T>): void {
    const newValue = typeof value === 'function' ? (value as Updater<T>)(this.readAtomState(atom).val) : value;

    if (!this.atomStateMap.has(atom)) {
      this.stateAtomManager.readAtomState(atom).val = newValue;
      return;
    }

    const atomState = this.stateAtomManager.readAtomState(atom);
    atomState.val = newValue;
    atomState.epoch += 1;
  }

  public mount<T>(atom: ReadableAtom<T>): Mounted {
    if (!canReadAsCompute(atom)) {
      return this.stateAtomManager.mount(atom);
    }
    return this.computedManager.mount(atom);
  }

  public unmount<T>(atom: ReadableAtom<T>): void {
    if (!canReadAsCompute(atom)) {
      this.stateAtomManager.tryUnmount(atom);
      return;
    }

    this.computedManager.tryUnmount(atom);
  }
}

class StateAtomManager {
  private readonly mountManager: MountManager;
  constructor(
    private readonly atomStateMap: WeakMap<ReadableAtom<unknown>, AtomState<unknown>>,
    private readonly options?: StoreOptions,
  ) {
    this.mountManager = new MountManager(this.atomStateMap, this.options);
  }

  public readAtomState<T>(atom: State<T>): StateState<T> {
    const atomState = this.atomStateMap.get(atom);
    if (!atomState) {
      const initState = {
        val: atom.init,
        epoch: 0,
      };
      this.atomStateMap.set(atom, initState);
      return initState as StateState<T>;
    }

    return atomState as StateState<T>;
  }

  public mount<T>(atom: State<T>): Mounted {
    return this.mountManager.mount(atom, () => this.readAtomState(atom));
  }

  public tryUnmount<T>(atom: ReadableAtom<T>): void {
    this.mountManager.umount(atom);
  }
}

export class ComputedManager {
  private readonly mountManager: MountManager;

  constructor(
    private readonly atomStateMap: WeakMap<ReadableAtom<unknown>, AtomState<unknown>>,
    private readonly atomManager: AtomManager,
    private readonly options?: StoreOptions,
  ) {
    this.mountManager = new MountManager(this.atomStateMap, this.options);
  }

  private tryGetCachedState = <T>(atom: Computed<T>, ignoreMounted: boolean): ComputedState<T> | undefined => {
    const atomState = this.atomStateMap.get(atom) as ComputedState<T> | undefined;
    if (!atomState) {
      return undefined;
    }

    if (atomState.mounted && !ignoreMounted) {
      return atomState;
    }

    for (const [dep, epoch] of atomState.dependencies.entries()) {
      const depState = this.atomManager.readAtomState(dep);
      if (depState.epoch !== epoch) {
        return undefined;
      }
    }

    return atomState;
  };

  public readAtomState<T>(atom: Computed<T>, ignoreMounted = false): ComputedState<T> {
    const cachedState = this.tryGetCachedState(atom, ignoreMounted);
    if (cachedState) {
      return cachedState;
    }

    const computedInterceptor = this.options?.interceptor?.computed;
    if (!computedInterceptor) {
      return this.computeComputedAtom(atom);
    }

    let result: DataWithCalledState<ComputedState<T>> = {
      called: false,
    } as DataWithCalledState<ComputedState<T>>;

    computedInterceptor(atom, () => {
      result = {
        called: true,
        data: this.computeComputedAtom(atom),
      };

      return result.data.val;
    });

    if (!result.called) {
      throw new Error('interceptor must call fn sync');
    }

    return result.data;
  }

  private computeComputedAtom<T>(atom: Computed<T>): ComputedState<T> {
    const self: Computed<T> = atom;
    let atomState: ComputedState<T> | undefined = this.atomStateMap.get(self) as ComputedState<T> | undefined;
    if (!atomState) {
      atomState = {
        dependencies: new Map<ReadableAtom<unknown>, number>(),
        epoch: -1,
      } as ComputedState<T>;
      this.atomStateMap.set(self, atomState);
    }

    const lastDeps = atomState.dependencies;
    const readDeps = new Map<ReadableAtom<unknown>, number>();
    atomState.dependencies = readDeps;
    const wrappedGet: Getter = (depAtom) => {
      const depState = this.atomManager.readAtomState(depAtom);

      // get 可能发生在异步过程中，当重复调用时，只有最新的 get 过程会修改 deps
      if (atomState.dependencies === readDeps) {
        readDeps.set(depAtom, depState.epoch);

        const selfMounted = !!atomState.mounted;
        if (selfMounted && !depState.mounted) {
          this.atomManager.mount(depAtom).readDepts.add(self);
        } else if (selfMounted && depState.mounted) {
          depState.mounted.readDepts.add(self);
        }
      }

      return depState.val;
    };

    const getInterceptor = this.options?.interceptor?.get;
    const ret = self.read(
      function <U>(depAtom: ReadableAtom<U>) {
        if (!getInterceptor) {
          return wrappedGet(depAtom);
        }

        let result: DataWithCalledState<U> = {
          called: false,
        } as DataWithCalledState<U>;

        const fn = () => {
          result = {
            called: true,
            data: wrappedGet(depAtom),
          };

          return result.data;
        };

        getInterceptor(depAtom, fn);

        if (!result.called) {
          throw new Error('interceptor must call fn sync');
        }
        return result.data;
      },
      {
        get signal() {
          atomState.abortController?.abort(`abort ${self.debugLabel ?? 'anonymous'} atom`);
          atomState.abortController = new AbortController();
          return atomState.abortController.signal;
        },
      },
    );

    if (atomState.val !== ret) {
      atomState.val = ret;
      atomState.epoch += 1;
    }

    for (const key of lastDeps.keys()) {
      if (!readDeps.has(key)) {
        const depState = this.atomStateMap.get(key);
        if (depState?.mounted) {
          depState.mounted.readDepts.delete(self);
          this.atomManager.unmount(key);
        }
      }
    }

    return atomState;
  }

  public mount<T>(atom: Computed<T>): Mounted {
    return this.mountManager.mount(
      atom,
      () => this.readAtomState(atom),
      (atomState) => {
        for (const [dep] of Array.from((atomState as ComputedState<T>).dependencies)) {
          const mounted = this.atomManager.mount(dep);
          mounted.readDepts.add(atom);
        }
      },
    );
  }

  public tryUnmount<T>(atom: Computed<T>): void {
    this.mountManager.umount(atom, (atomState) => {
      for (const [dep] of Array.from((atomState as ComputedState<T>).dependencies)) {
        const depState = this.atomManager.readAtomState(dep);
        depState.mounted?.readDepts.delete(atom);
        this.atomManager.unmount(dep);
      }
    });
  }
}

export class ListenerManager {
  private pendingListeners = new Set<Command<unknown, []>>();

  markPendingListeners(atomManager: AtomManager, atom: ReadableAtom<unknown>) {
    let queue: ReadableAtom<unknown>[] = [atom];
    while (queue.length > 0) {
      const nextQueue: ReadableAtom<unknown>[] = [];
      for (const atom of queue) {
        const atomState = atomManager.readAtomState(atom, true);

        if (atomState.mounted?.listeners) {
          for (const listener of atomState.mounted.listeners) {
            this.pendingListeners.add(listener);
          }
        }

        const readDepts = atomState.mounted?.readDepts;
        if (readDepts) {
          for (const dep of Array.from(readDepts)) {
            nextQueue.push(dep);
          }
        }
      }

      queue = nextQueue;
    }
  }

  *notify(): Generator<Command<unknown, []>, void, unknown> {
    const pendingListeners = this.pendingListeners;
    this.pendingListeners = new Set();

    for (const listener of pendingListeners) {
      yield listener;
    }
  }
}

class MountManager {
  constructor(
    private readonly atomStateMap: WeakMap<ReadableAtom<unknown>, AtomState<unknown>>,
    private readonly options?: StoreOptions,
  ) {}

  private createMounted(): Mounted {
    return {
      listeners: new Set(),
      readDepts: new Set(),
    };
  }

  public mount<T>(
    atom: ReadableAtom<T>,
    readAtomState: () => AtomState<T>,
    onMount?: (atomState: AtomState<T>) => void,
  ): Mounted {
    const mounted = this.atomStateMap.get(atom)?.mounted;
    if (mounted) {
      return mounted;
    }

    this.options?.interceptor?.mount?.(atom);

    const atomState = readAtomState();
    atomState.mounted = atomState.mounted ?? this.createMounted();

    onMount?.(atomState);

    return atomState.mounted;
  }

  public umount<T>(atom: ReadableAtom<T>, onUnmount?: (atomState: AtomState<T>) => void): void {
    const atomState = this.atomStateMap.get(atom) as AtomState<T> | undefined;
    if (!atomState?.mounted || atomState.mounted.listeners.size || atomState.mounted.readDepts.size) {
      return;
    }

    this.options?.interceptor?.unmount?.(atom);

    onUnmount?.(atomState);

    atomState.mounted = undefined;
  }
}
