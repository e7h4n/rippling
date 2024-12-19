import type { Computed, Command, State } from '../core/atom';

export type NestedAtom = (State<unknown> | Computed<unknown> | Command<unknown, unknown[]> | NestedAtom)[];
export type NestedString = (string | NestedString)[];
