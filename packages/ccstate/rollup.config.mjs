// @ts-check
import * as fs from 'node:fs';
import * as path from 'node:path';
import { babel } from '@rollup/plugin-babel';
import { dts } from 'rollup-plugin-dts';
import { nodeResolve } from '@rollup/plugin-node-resolve';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const projectRootDir = path.resolve(__dirname);

/** @type {import('./package.json')} */
const pkg = JSON.parse(fs.readFileSync('./package.json', { encoding: 'utf-8' }));

function generateTarget({ input, targetCJS, targetES, external }) {
  return [
    {
      input,
      onwarn: (warning) => {
        throw new Error(warning?.message);
      },
      external,
      plugins: [
        nodeResolve({
          extensions: ['.ts'],
        }),
        babel({
          exclude: 'node_modules/**',
          extensions: ['.ts'],
          babelHelpers: 'bundled',
          configFile: path.resolve(projectRootDir, './babel.config.json'),
        }),
      ],
      output: [
        {
          file: targetCJS,
          format: 'cjs',
        },
        {
          file: targetES,
          format: 'es',
        },
      ],
    },
    {
      input,
      onwarn: (warning) => {
        throw new Error(warning?.message);
      },
      external,
      plugins: [
        dts({
          respectExternal: true,
          tsconfig: path.resolve(projectRootDir, './tsconfig.json'),
        }),
      ],
      output: [
        {
          file: targetCJS.replace(/\.cjs$/, '.d.cts'),
        },
        {
          file: targetES.replace(/\.js$/, '.d.ts'),
        },
      ],
    },
  ];
}

/** @type { Array<import('rollup').RollupOptions> } */
export default [
  ...generateTarget({
    input: './src/index.ts',
    targetCJS: './dist/index.cjs',
    targetES: './dist/index.js',
    external: ['react'],
  }),

  ...generateTarget({
    input: './src/core/index.ts',
    targetCJS: './dist/core/index.cjs',
    targetES: './dist/core/index.js',
    external: [],
  }),

  ...generateTarget({
    input: './src/react/index.ts',
    targetCJS: './dist/react/index.cjs',
    targetES: './dist/react/index.js',
    external: [...Object.keys(pkg.peerDependencies)],
  }),

  ...generateTarget({
    input: './src/debug/index.ts',
    targetCJS: './dist/debug/index.cjs',
    targetES: './dist/debug/index.js',
    external: [],
  }),
];
