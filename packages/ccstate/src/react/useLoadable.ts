import { useEffect, useState } from 'react';
import { useGet } from './useGet';
import type { Computed, State } from '../core';

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

const LOADABLE_ABORT_ERROR = new Error('LoadableAbortError');

function useLoadableInternal<T>(
  atom: State<Promise<T>> | Computed<Promise<T>>,
  keepLastResolved: boolean,
): Loadable<T> {
  const promise = useGet(atom);
  const [promiseResult, setPromiseResult] = useState<Loadable<T>>({
    state: 'loading',
  });

  useEffect(() => {
    let abort: () => void;
    const abortSignal = new Promise<never>((_, reject) => {
      abort = () => {
        reject(LOADABLE_ABORT_ERROR);
      };
    });

    if (!keepLastResolved) {
      setPromiseResult({
        state: 'loading',
      });
    }

    void Promise.race([promise, abortSignal])
      .then((ret) => {
        setPromiseResult({
          state: 'hasData',
          data: ret,
        });
      })
      .catch((error: unknown) => {
        if (error === LOADABLE_ABORT_ERROR) return;

        setPromiseResult({
          state: 'hasError',
          error,
        });
      });

    return () => {
      abort();
    };
  }, [promise]);

  return promiseResult;
}

export function useLoadable<T>(atom: State<Promise<T>> | Computed<Promise<T>>): Loadable<T> {
  return useLoadableInternal(atom, false);
}

export function useLastLoadable<T>(atom: State<Promise<T>> | Computed<Promise<T>>): Loadable<T> {
  return useLoadableInternal(atom, true);
}
