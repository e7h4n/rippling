import type { NestedAtom, NestedString } from '../../types/debug/util';

export function nestedAtomToString(atoms: NestedAtom): NestedString {
  return atoms.map((atom) => {
    if (Array.isArray(atom)) {
      return nestedAtomToString(atom);
    }
    return atom.debugLabel ?? 'anonymous';
  });
}
