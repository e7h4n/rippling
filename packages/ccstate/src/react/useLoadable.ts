import { useEffect, useState } from 'react';
import { useGet } from './useGet';
import type { Computed, Value } from '../core';

type Loadable<T> =
  | {
      state: 'loading';
    }
  | {
      state: 'hasData';
      data: T;
    }
  | {
      state: 'hasError';
      error: unknown;
    };

export function useLoadable<T>(atom: Value<Promise<T>> | Computed<Promise<T>>): Loadable<T> {
  const promise = useGet(atom);
  const [promiseResult, setPromiseResult] = useState<Loadable<T>>({
    state: 'loading',
  });

  useEffect(() => {
    const ctrl = new AbortController();
    const signal = ctrl.signal;

    setPromiseResult({
      state: 'loading',
    });
    void promise
      .then((ret) => {
        if (signal.aborted) return;

        setPromiseResult({
          state: 'hasData',
          data: ret,
        });
      })
      .catch((error: unknown) => {
        if (signal.aborted) return;

        setPromiseResult({
          state: 'hasError',
          error,
        });
      });

    return () => {
      ctrl.abort();
    };
  }, [promise]);

  return promiseResult;
}

export function useLastLoadable<T>(atom: Value<Promise<T>> | Computed<Promise<T>>): Loadable<T> {
  const promise = useGet(atom);
  const [promiseResult, setPromiseResult] = useState<Loadable<T>>({
    state: 'loading',
  });

  useEffect(() => {
    const ctrl = new AbortController();
    const signal = ctrl.signal;

    void promise
      .then((ret) => {
        if (signal.aborted) return;

        setPromiseResult({
          state: 'hasData',
          data: ret,
        });
      })
      .catch((error: unknown) => {
        if (signal.aborted) return;

        setPromiseResult({
          state: 'hasError',
          error,
        });
      });

    return () => {
      ctrl.abort();
    };
  }, [promise]);

  return promiseResult;
}
