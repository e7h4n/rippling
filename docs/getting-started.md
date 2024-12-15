# Getting Started

After read this document, you will:

- Take a walk through of using Rippling in React

## Installation

```bash
# npm
npm i rippling

# pnpm
pnpm add rippling

# yarn
yarn add rippling
```

## Create Atoms

Use `$value` to create a simple value unit:

```ts
// atoms.ts
import { $value } from 'rippling';

export const count$ = $value(0); // 0 for initial value
```

Use `$computed` to create a derived computation logic:

```ts
// atoms.ts
import { $value, $computed } from 'rippling';

export const count$ = $value(0); // 0 for initial value
export const double$ = $computed((get) => get(count$) * 2);
```

## Use Atoms in React

Use `useGet` and `useSet` hooks in React to get/set atoms:

```tsx
// App.tsx
import { useGet, useSet } from 'rippling'
import { count$, double$ } from './atoms'

export function App() {
    const double = useGet(double$)
    const setCount = useSet(count$)

    return <div>
        <p>double count: {double}</p>
        <button onClick={() => {
            setCount(x => x + 1)
        }}>
    </div>
}
```

Use `createStore` and `StoreProvider` to provide a Rippling store to React, all states and computations will only affect this isolated store.

```tsx
// main.tsx
import { App } from './App';
import { createRoot } from 'react';

const rootElement = document.getElementById('root')!;
const root = createRoot(rootElement);
const store = createStore();

root.render(
  <StoreProvider value={store}>
    <App />
  </StoreProvider>,
);
```

That's it! Through these examples, you should have understood the basic usage of Rippling. Next, you can read [Basic](basic.md) to learn about Rippling's core APIs.
