// inspired by https://github.com/pmndrs/jotai/blob/main/src/babel/utils.ts
import { types } from '@babel/core';

export interface PluginOptions {
  customAtomNames?: string[];
  projectRoot?: string;
}

export function isAtom(
  t: typeof types,
  callee: babel.types.Expression | babel.types.V8IntrinsicIdentifier,
  customAtomNames: PluginOptions['customAtomNames'] = [],
): boolean {
  const atomNames = [...atomFunctionNames, ...customAtomNames];
  if (t.isIdentifier(callee) && atomNames.includes(callee.name)) {
    return true;
  }

  if (t.isMemberExpression(callee)) {
    const { property } = callee;
    if (t.isIdentifier(property) && atomNames.includes(property.name)) {
      return true;
    }
  }
  return false;
}

const atomFunctionNames = [
  // Core
  'state',
  'computed',
  'command',
];
