import { expect, test, vi } from 'vitest';
import { $value, createStore, $computed, $func } from '..';
import type { Computed, Func, Value } from '..';
import { createDebugStore } from '../../debug';

test('should work', () => {
  const store = createStore();
  const anAtom = $value(1);

  expect(store.get(anAtom)).toBe(1);

  store.set(anAtom, 2);
  expect(store.get(anAtom)).toBe(2);

  const store2 = createStore();
  expect(store2.get(anAtom)).toBe(1);
});

test('computed value should work', () => {
  const store = createStore();
  const base = $value(1);
  const derived = $computed(
    (get) => {
      const num = get(base);
      return num * 2;
    },
    {
      debugLabel: 'derived',
    },
  );

  expect(store.get(derived)).toBe(2);
});

test('computed value should not writable', () => {
  const store = createStore();
  const anAtom = $value(1);
  const doubleCmpt = $computed((get) => {
    return get(anAtom) * 2;
  });

  store.set(doubleCmpt as unknown as Value<number>, 3);
  expect(store.get(doubleCmpt)).toBe(2);
});

test('async value should works like sync value', async () => {
  const store = createStore();
  const anAtom = $value(1);
  const asyncCmpt: Computed<Promise<number>> = $computed(async (get) => {
    await Promise.resolve();
    return get(anAtom) * 2;
  });

  expect(await store.get(asyncCmpt)).toBe(2);
});

test('async computed should not follow old value', async () => {
  const store = createStore();
  const base = $value('foo', {
    debugLabel: 'base',
  });
  const cmpt = $computed(
    (get) => {
      return Promise.resolve(get(base) + get(base));
    },
    {
      debugLabel: 'cmpt',
    },
  );
  const derivedCmpt = $computed(
    async (get) => {
      return get(base) + (await get(cmpt));
    },
    {
      debugLabel: 'derivedCmpt',
    },
  );

  const ret1 = store.get(derivedCmpt);
  store.set(base, 'bar');
  const ret2 = store.get(derivedCmpt);

  expect(await ret1).toBe('foofoofoo');
  expect(await ret2).toBe('barbarbar');
});

test('func can set other value', () => {
  const store = createStore();
  const base$ = $value(1);
  const double$ = $value(0);
  const setDouble$ = $func(({ get, set }, num) => {
    set(base$, num);
    set(double$, get(base$) * 2);
  });
  store.set(setDouble$, 2);
  expect(store.get(base$)).toBe(2);
  expect(store.get(double$)).toBe(4);
});

test('set an atom should trigger subscribe', () => {
  const store = createStore();
  const base$ = $value(1, {
    debugLabel: 'base',
  });
  const trace = vi.fn();
  store.sub(
    base$,
    $func(
      () => {
        trace();
      },
      {
        debugLabel: 'func',
      },
    ),
  );
  store.set(base$, 2);
  expect(trace).toBeCalledTimes(1);
});

test('set an atom in func should trigger multiple times', () => {
  const store = createStore();
  const base$ = $value(1);
  const trace = vi.fn();
  store.sub(
    base$,
    $func(() => {
      trace();
    }),
  );
  store.set(
    $func(({ set }) => {
      set(base$, 2);
      set(base$, 3);
      set(base$, 4);
    }),
  );
  expect(trace).toBeCalledTimes(3);
});

test('sub multiple atoms', () => {
  const store = createStore();
  const state1$ = $value(1, {
    debugLabel: 'state1',
  });
  const state2$ = $value(2, {
    debugLabel: 'state2',
  });

  const trace = vi.fn();
  const unsub = store.sub(
    $computed(
      (get) => {
        get(state1$);
        get(state2$);
      },
      {
        debugLabel: 'cmpt',
      },
    ),
    $func(
      () => {
        trace();
      },
      {
        debugLabel: 'func',
      },
    ),
  );
  store.set(state1$, (x) => x + 1);
  store.set(state2$, (x) => x + 1);
  expect(trace).toBeCalled();
  unsub();
});

test('sub computed atom', () => {
  const store = createStore();
  const base$ = $value(1, {
    debugLabel: 'base',
  });
  const derived$ = $computed(
    (get) => {
      return get(base$) * 2;
    },
    {
      debugLabel: 'cmpt',
    },
  );

  const trace = vi.fn();
  store.sub(
    derived$,
    $func(() => {
      trace();
    }),
  );
  expect(trace).not.toBeCalled();
  store.set(base$, 2);
  expect(trace).toBeCalledTimes(1);
});

test('get read deps', () => {
  const store = createDebugStore();
  const base$ = $value({ a: 1 });
  const derived$ = $computed((get) => {
    return Object.assign(get(base$), { b: 1 });
  });
  expect(store.getReadDependencies(derived$)).toEqual([derived$, [base$]]);
});

test('get should return value directly', () => {
  const store = createStore();
  const base$ = $value({ a: 1 });
  const derived$ = $computed((get) => {
    return Object.assign(get(base$), { b: 1 });
  });

  const b = store.get(derived$);
  store.set(base$, { a: 2 });
  expect(b).toEqual({ a: 1, b: 1 });

  b.b = 2;
  expect(store.get(derived$)).property('a', 2);
  expect(store.get(derived$)).property('b', 1);
});

test('derived atom should trigger when deps changed', () => {
  const store = createStore();
  const stateA$ = $value(0);
  const stateB$ = $value(0);
  const stateC$ = $value(0);
  const traceB = vi.fn();
  const traceC = vi.fn();
  const derived$ = $computed((get) => {
    if (get(stateA$) == 0) {
      traceB();
      return get(stateB$);
    } else {
      traceC();
      return get(stateC$);
    }
  });
  expect(store.get(derived$)).toBe(0);

  store.set(stateC$, 1);
  expect(traceC).not.toBeCalled();

  store.get(derived$);
  expect(traceC).not.toBeCalled();

  store.set(stateB$, 100);
  store.get(derived$);
  expect(traceC).not.toBeCalled();

  traceB.mockClear();
  store.set(stateA$, 1);
  expect(traceB).not.toBeCalled();
  expect(traceC).not.toBeCalled();

  store.get(derived$);
  expect(traceB).not.toBeCalled();
  expect(traceC).toBeCalled();
});

test('outdated deps should not trigger sub', async () => {
  const store = createStore();
  const branch$ = $value('A', {
    debugLabel: 'branch',
  });
  const refresh$ = $value(0, {
    debugLabel: 'refresh',
  });
  const derived$ = $computed(
    (get) => {
      if (get(branch$) == 'A') {
        return Promise.resolve().then(() => {
          get(refresh$);
          return 'A';
        });
      }
      return 'B';
    },
    {
      debugLabel: 'derived',
    },
  );

  const traceSub = vi.fn();
  store.sub(
    derived$,
    $func(
      () => {
        traceSub();
      },
      {
        debugLabel: 'func',
      },
    ),
  );
  await expect(store.get(derived$)).resolves.toBe('A');

  store.set(branch$, 'B');
  const derivedRet = store.get(derived$);
  expect(traceSub).toBeCalled();
  expect(await derivedRet).toBe('B');

  store.set(refresh$, (x) => x + 1);
  traceSub.mockClear();
  expect(traceSub).not.toBeCalled();
});

test('computed should only compute once if no deps changed', () => {
  const store = createStore();
  const base$ = $value(1);
  const trace = vi.fn();
  const derived$ = $computed((get) => {
    trace();
    return get(base$) * 2;
  });
  store.get(derived$);
  store.get(derived$);
  expect(trace).toBeCalledTimes(1);
});

test('an observable func process', async () => {
  function observableFunc<T, Args extends unknown[]>(func$: Func<T, Args>): [Computed<T | null>, Func<T, Args>] {
    const lastResult = $value<T | null>(null);
    return [
      $computed((get) => get(lastResult)),

      $func(({ set }, ...args: Args) => {
        const result = set(func$, ...args);
        set(lastResult, result);
        return result;
      }),
    ];
  }

  const [result$, setup$] = observableFunc(
    $func(async () => {
      await Promise.resolve();
      return 'ok';
    }),
  );
  const store = createStore();
  expect(store.get(result$)).toBeNull();
  const ret = store.set(setup$);
  expect(ret).toBeInstanceOf(Promise);
  await expect(ret).resolves.toBe('ok');
});

test('generator in func', () => {
  const step = $value(0);
  const generator$ = $func(function* ({ set }) {
    set(step, 1);
    yield;
    set(step, 2);
    yield;
    set(step, 3);
    return 3;
  });

  const store = createStore();
  const ret = store.set(generator$);
  ret.next();
  expect(store.get(step)).toBe(1);
  ret.next();
  expect(store.get(step)).toBe(2);
  ret.next();
  expect(store.get(step)).toBe(3);
});
