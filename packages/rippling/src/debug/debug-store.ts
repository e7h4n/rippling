import type { StoreInterceptor, SubscribeOptions } from '../../types/core/store';
import type { DebugStore } from '../../types/debug/debug-store';
import type { NestedAtom } from '../../types/debug/util';
import type { Computed, Func, Subscribe, Value } from '../core';
import { AtomManager, ListenerManager } from '../core/atom-manager';
import type { ComputedState } from '../core/atom-manager';
import { StoreImpl } from '../core/store';

class DebugStoreImpl extends StoreImpl implements DebugStore {
  private readonly mountedAtomListenersCount = new Map<Value<unknown> | Computed<unknown>, number>();

  override sub: Subscribe = (
    atoms: (Value<unknown> | Computed<unknown>)[] | (Value<unknown> | Computed<unknown>),
    cb: Func<unknown, unknown[]>,
    options?: SubscribeOptions,
  ): (() => void) => {
    const atomList = Array.isArray(atoms) ? atoms : [atoms];

    atomList.forEach((atom) => {
      this.mountedAtomListenersCount.set(atom, (this.mountedAtomListenersCount.get(atom) ?? 0) + 1);
    });

    const unsub = super.sub(atoms, cb, options);
    const decount = () => {
      atomList.forEach((atom) => {
        const count = this.mountedAtomListenersCount.get(atom) ?? 0;
        if (count === 0) {
          return;
        }

        this.mountedAtomListenersCount.set(atom, count - 1);
        if (count === 1) {
          this.mountedAtomListenersCount.delete(atom);
        }
      });
    };
    options?.signal?.addEventListener('abort', decount);
    return () => {
      unsub();
      decount();
    };
  };

  getReadDependencies = (atom: Value<unknown> | Computed<unknown>): NestedAtom => {
    const atomState = this.atomManager.readAtomState(atom);

    if (!('dependencies' in atomState)) {
      return [atom];
    }

    return [
      atom,
      ...Array.from((atomState as ComputedState<unknown>).dependencies).map(([key]) => {
        return this.getReadDependencies(key);
      }),
    ] as NestedAtom;
  };

  getReadDependents = (atom: Value<unknown> | Computed<unknown>): NestedAtom => {
    const atomState = this.atomManager.readAtomState(atom);
    return [
      atom,
      ...Array.from(atomState.mounted?.readDepts ?? []).map((key) => this.getReadDependents(key)),
    ] as NestedAtom;
  };

  getSubscribeGraph = (): NestedAtom => {
    const subscribedAtoms = Array.from(this.mountedAtomListenersCount.keys());
    return subscribedAtoms.map((atom) => {
      const atomState = this.atomManager.readAtomState(atom);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we know it's mounted
      const listeners = Array.from(atomState.mounted!.listeners);
      return [atom, ...listeners];
    });
  };
}

export function createDebugStore(interceptor?: StoreInterceptor): DebugStore {
  const atomManager = new AtomManager({
    interceptor: interceptor,
  });
  const listenerManager = new ListenerManager();

  return new DebugStoreImpl(atomManager, listenerManager, {
    interceptor: interceptor,
  });
}
