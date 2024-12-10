import babel from '@babel/core';
import type { PluginObj } from '@babel/core';
import { isAtom } from './utils';
import type { PluginOptions } from './utils';
import { templateBuilder } from './template';

const buildExport = templateBuilder(`
    const %%atomIdentifier%% = %%atom%%;
    export default %%atomIdentifier%%
`);

export default function debugLabelPlugin({ types: t }: typeof babel, options?: PluginOptions): PluginObj {
  return {
    visitor: {
      ExportDefaultDeclaration(
        nodePath: babel.NodePath<babel.types.ExportDefaultDeclaration>,
        state: babel.PluginPass,
      ) {
        const { node } = nodePath;
        if (t.isCallExpression(node.declaration) && isAtom(t, node.declaration.callee, options?.customAtomNames)) {
          const filename = (
            state.filename?.replace(options?.projectRoot ?? '', '') ?? 'unknownDefaultExportAtom'
          ).replace(/\.\w+$/, '');

          let displayName = filename.substring(filename.lastIndexOf('/') + 1);

          // ./{module name}/index.js
          if (displayName === 'index') {
            const name = filename.slice(0, -'/index'.length);
            displayName = name.substring(name.lastIndexOf('/') + 1);
          }
          // Relies on visiting the variable declaration to add the debugLabel

          const ast = buildExport({
            atomIdentifier: t.identifier(displayName),
            atom: node.declaration,
          });
          nodePath.replaceWithMultiple(ast as babel.Node[]);
        }
      },
      VariableDeclarator(path: babel.NodePath<babel.types.VariableDeclarator>) {
        if (
          t.isIdentifier(path.node.id) &&
          t.isCallExpression(path.node.init) &&
          isAtom(t, path.node.init.callee, options?.customAtomNames)
        ) {
          const debugLabel = t.objectProperty(t.identifier('debugLabel'), t.stringLiteral(path.node.id.name));

          if (path.node.init.arguments.length === 1) {
            path.node.init.arguments.push(t.objectExpression([debugLabel]));
          } else if (path.node.init.arguments.length > 1) {
            const existingOptions = path.node.init.arguments[1];
            if (t.isObjectExpression(existingOptions)) {
              const hasDebugLabel = existingOptions.properties.some(
                (prop: babel.types.ObjectMethod | babel.types.ObjectProperty | babel.types.SpreadElement) =>
                  t.isObjectProperty(prop) && t.isIdentifier(prop.key) && prop.key.name === 'debugLabel',
              );
              if (hasDebugLabel) return;
              existingOptions.properties.push(debugLabel);
            }
          }
        }
      },
    },
  };
}
