import type { Computed, State } from '../core/atom';
import type { Store } from '../core/store';
import type { NestedAtom } from './util';

export interface DebugStore extends Store {
  getReadDependencies: (atom: Computed<unknown>) => NestedAtom;
  getReadDependents: (atom: State<unknown> | Computed<unknown>) => NestedAtom;
  isMounted: (atom: State<unknown> | Computed<unknown>) => boolean;
  getSubscribeGraph: () => NestedAtom;
}
