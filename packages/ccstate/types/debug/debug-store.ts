import type { Computed, Value } from '../core/atom';
import type { Store } from '../core/store';
import type { NestedAtom } from './util';

export interface DebugStore extends Store {
  getReadDependencies: (atom: Computed<unknown>) => NestedAtom;
  getReadDependents: (atom: Value<unknown> | Computed<unknown>) => NestedAtom;
  isMounted: (atom: Value<unknown> | Computed<unknown>) => boolean;
  getSubscribeGraph: () => NestedAtom;
}
