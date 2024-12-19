import type { Computed, Func, Value } from '../core/atom';

export type NestedAtom = (Value<unknown> | Computed<unknown> | Func<unknown, unknown[]> | NestedAtom)[];
export type NestedString = (string | NestedString)[];
