# Rippling

[![Coverage Status](https://coveralls.io/repos/github/e7h4n/rippling/badge.svg?branch=main)](https://coveralls.io/github/e7h4n/rippling?branch=main)
![NPM Type Definitions](https://img.shields.io/npm/types/rippling)
![NPM Version](https://img.shields.io/npm/v/rippling)
![npm package minimized gzipped size](https://img.shields.io/bundlejs/size/rippling)
[![CI](https://github.com/e7h4n/rippling/actions/workflows/ci.yaml/badge.svg)](https://github.com/e7h4n/rippling/actions/workflows/ci.yaml)
[![CodSpeed Badge](https://img.shields.io/endpoint?url=https://codspeed.io/badge.json)](https://codspeed.io/e7h4n/rippling)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Rippling is a semantic, strict, and flexible state management library suitable for medium to large single-page applications with complex state management needs.

## Quick Features

- Simple API design with only 3 data types and 2 data operations
- Strict test coverage with 100% branch coverage
- Zero dependencies
- Not bound to any UI library - can be used with React or Vanilla JS
- High Performance

## Getting Started

### Installation

```bash
# npm
npm i rippling

# pnpm
pnpm add rippling

# yarn
yarn add rippling
```

### Create Atoms

Use `$value` to create a simple value unit, and use `$computed` to create a derived computation logic:

```ts
// atom.js
import { $value, $computed } from 'rippling/core';

export const userId$ = $value('');

export const user$ = $computed(async (get) => {
  const userId = get(userId$);
  if (!userId) return null;

  const resp = await fetch(`https://api.github.com/users/${userId}`);
  return resp.json();
});
```

### Use Atoms in React

Use `useGet` and `useSet` hooks in React to get/set atoms, and use `useResolved` to get Promise value.

```jsx
// App.js
import { useGet, useSet, useResolved } from 'rippling/react';
import { userId$, user$ } from './atom';

export default function App() {
  const userId = useGet(userId$);
  const setUserId = useSet(userId$);
  const user = useResolved(user$);

  return (
    <div>
      <div>
        <input type="text" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="github username" />
      </div>
      <div>
        <img src={user?.avatar_url} width="48" />
        <div>
          {user?.name}
          {user?.company}
        </div>
      </div>
    </div>
  );
}
```

Use `createStore` and `StoreProvider` to provide a Rippling store to React, all states and computations will only affect this isolated store.

```tsx
// main.jsx
import { createStore } from 'rippling/core';
import { StoreProvider } from 'rippling/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

const store = createStore();
root.render(
  <StrictMode>
    <StoreProvider value={store}>
      <App />
    </StoreProvider>
  </StrictMode>,
);
```

That's it! [Click here to see the full example](https://codesandbox.io/p/sandbox/cr3xg6).

Through these examples, you should have understood the basic usage of Rippling. Next, you can read [Basic](docs/basic.md) to learn about Rippling's core APIs.

## Documentation

- [Basic](docs/basic.md)
- [Using in React](docs/react.md)
- (TBD) [Debug Rippling](docs/devtools.md)
- [Testing](docs/testing.md)
- [Concept behind Rippling](docs/concept.md)

## Changelog & TODO

[Changelog](packages/rippling/CHANGELOG.md)

Here are some new ideas:

- Integration with svelte / solid.js
- Enhance devtools
  - Support viewing current subscription graph and related atom values
  - Enable logging and breakpoints for specific atoms in devtools
- Performance improvements
  - Mount atomState directly on atoms when there's only one store in the application to reduce WeakMap lookup overhead
  - Support static declaration of upstream dependencies for Computed to improve performance by disabling runtime dependency analysis

## Contributing

Rippling welcomes any suggestions and Pull Requests. If you're interested in improving Rippling, here are some basic steps to help you set up a Rippling development environment.

```bash
pnpm install
pnpm husky # setup commit hooks to verify commit
pnpm vitest # to run all tests
pnpm lint # check code style & typing
```

## Special Thanks

Thanks [Jotai](https://github.com/pmndrs/jotai) for the inspiration and some code snippets, especially the test cases. Without their work, this project would not exist.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
