import { transformSync } from '@babel/core';
import { expect, it } from 'vitest';
import plugin from '../plugin-debug-label';

const transform = (code: string, filename?: string, customAtomNames?: string[], projectRoot?: string) =>
  transformSync(code, {
    babelrc: false,
    configFile: false,
    filename,
    plugins: [[plugin, { customAtomNames, projectRoot }]],
  })?.code;

it('Should add a debugLabel to an atom', () => {
  expect(transform(`const count$ = $value(0);`)).toMatchInlineSnapshot(`
    "const count$ = $value(0, {
      debugLabel: "count$"
    });"
  `);
});

it('Should handle a atom from a default export', () => {
  expect(transform(`const count$ = rippling.$value(0);`)).toMatchInlineSnapshot(`
    "const count$ = rippling.$value(0, {
      debugLabel: "count$"
    });"
  `);
});

it('Should not replace existed debugLabel', () => {
  expect(transform(`const count$ = rippling.$value(0, { debugLabel: 'count' });`)).toMatchInlineSnapshot(`
    "const count$ = rippling.$value(0, {
      debugLabel: 'count'
    });"
  `);
});

it('Should add property to existed options', () => {
  expect(transform(`const count$ = rippling.$value(0, { foo: 'bar' });`)).toMatchInlineSnapshot(`
    "const count$ = rippling.$value(0, {
      foo: 'bar',
      debugLabel: "count$"
    });"
  `);
});

it('Should handle a atom being exported', () => {
  expect(transform(`export const count$ = $value(0);`)).toMatchInlineSnapshot(`
    "export const count$ = $value(0, {
      debugLabel: "count$"
    });"
  `);
});

it('Should handle a default exported atom', () => {
  expect(transform(`export default $value(0);`, 'countAtom.ts')).toMatchInlineSnapshot(`
      "const countAtom = $value(0, {
        debugLabel: "countAtom"
      });
      export default countAtom;"
    `);
});

it('Should handle a default exported atom even if no filename is provided', () => {
  expect(transform(`export default $value(0);`)).toMatchInlineSnapshot(`
      "const unknownDefaultExportAtom = $value(0, {
        debugLabel: "unknownDefaultExportAtom"
      });
      export default unknownDefaultExportAtom;"
    `);
});

it('Should handle a default exported by index.ts', () => {
  expect(transform(`export default $value(0);`, 'atoms/index.ts')).toMatchInlineSnapshot(`
      "const atoms = $value(0, {
        debugLabel: "atoms"
      });
      export default atoms;"
    `);
});

it('Should filter out projectRoot from the debugLabel', () => {
  expect(
    transform(
      `export default $value(0);`,
      '/users/username/project/src/atoms/countAtom.ts',
      [],
      '/users/username/project/src/atoms/',
    ),
  ).toMatchInlineSnapshot(`
      "const countAtom = $value(0, {
        debugLabel: "countAtom"
      });
      export default countAtom;"
    `);
});

it('Should handle a default exported atom in a barrel file', () => {
  expect(transform(`export default $value(0);`, 'atoms/index.ts')).toMatchInlineSnapshot(`
      "const atoms = $value(0, {
        debugLabel: "atoms"
      });
      export default atoms;"
    `);
});

it('Should handle all types of exports', () => {
  expect(
    transform(
      `
      export const countAtom = $value(0);
      export default $value(0);
    `,
      'atoms/index.ts',
    ),
  ).toMatchInlineSnapshot(`
    "export const countAtom = $value(0, {
      debugLabel: "countAtom"
    });
    const atoms = $value(0, {
      debugLabel: "atoms"
    });
    export default atoms;"
  `);
});

it('Should handle computed atoms', () => {
  expect(transform(`const double$ = $computed((get) => get(count$));`)).toMatchInlineSnapshot(`
    "const double$ = $computed(get => get(count$), {
      debugLabel: "double$"
    });"
  `);
});

it('Should handle $func atoms', () => {
  expect(
    transform(`const updateDouble$ = $func(({get, set}, value) => {
      set(double$, get(count$) + value)
    });`),
  ).toMatchInlineSnapshot(`
    "const updateDouble$ = $func(({
      get,
      set
    }, value) => {
      set(double$, get(count$) + value);
    }, {
      debugLabel: "updateDouble$"
    });"
  `);
});

it('Handles custom atom names a debugLabel to an atom', () => {
  expect(transform(`const mySpecialThing = myCustomAtom(0);`, undefined, ['myCustomAtom'])).toMatchInlineSnapshot(`
    "const mySpecialThing = myCustomAtom(0, {
      debugLabel: "mySpecialThing"
    });"
  `);
});

it('handles function return values', () => {
  expect(
    transform(`
    function createAtomPair(init) {
      const internal = $value(init);
      return [
        $computed(get => get(internal)),
        $func(({get, set}, value) => {
          set(internal, value)
        }),
      ]
    }
    `),
  ).toMatchInlineSnapshot(`
    "function createAtomPair(init) {
      const internal = $value(init, {
        debugLabel: "internal"
      });
      return [$computed(get => get(internal)), $func(({
        get,
        set
      }, value) => {
        set(internal, value);
      })];
    }"
  `);
});
