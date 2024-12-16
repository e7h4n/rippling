# Using Rippling in React

To begin using Rippling in a React application, you must utilize the `StoreProvider` to provide a store for the hooks.

```jsx
// main.tsx
import { createStore, StoreProvider } from 'rippling';
import { App } from './App';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const store = createStore();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StoreProvider value={store}>
      <App />
    </StoreProvider>
  </StrictMode>,
);
```

All descendant components within the `StoreProvider` will use the provided store as the caller for `get` and `set` operations.

You can place the `StoreProvider` inside or outside of `StrictMode`; the functionality is the same.

## Retrieving Atom Values

The most basic usage is to use `useGet` to retrieve the value of an Atom.

```jsx
// atoms/count.ts
import { $value } from 'rippling';
export const count$ = $value(0);

// App.tsx
import { useGet } from 'rippling';
import { count$ } from './atoms/count';

function App() {
  const count = useGet(count$);
  return <div>{count}</div>;
}
```

`useGet` returns a `Value` or a `Computed` value, and when the value changes, `useGet` triggers a re-render of the component.

`useGet` does not do anything special with `Promise` values. In fact, `useGet` is equivalent to a single `store.get` call, plus a `store.sub` to ensure reactive updates to the React component.

Two other useful hooks are available when dealing with `Promise` values. First, we introduce `useLoadable`.

```jsx
// atoms/user.ts
import { $computed } from 'rippling';

export const user$ = $computed(async () => {
  return fetch('/api/users/current').then((res) => res.json());
});

// App.tsx
import { useLoadable } from 'rippling';
import { user$ } from './atoms/user';

function App() {
  const user_ = useLoadable(user$);
  if (user_.state === 'loading') return <div>Loading...</div>;
  if (user_.state === 'error') return <div>Error: {user_.error.message}</div>;

  return <div>{user_.data.name}</div>;
}
```

`useLoadable` accepts an Atom that returns a `Promise` and wraps the result in a `Loadable` structure.

```typescript
type Loadable<T> =
  | {
      state: 'loading';
    }
  | {
      state: 'hasData';
      data: T;
    }
  | {
      state: 'hasError';
      error: unknown;
    };
```

This allows you to render loading and error states in JSX based on the state. `useLoadable` suppresses exceptions, so it will not trigger an `ErrorBoundary`.

Another useful hook is `useResolved`, which always returns the resolved value of a `Promise`.

```jsx
// App.tsx
import { useResolved } from 'rippling';
import { user$ } from './atoms/user';

function App() {
  const user = useResolved(user$);
  return <div>{user?.name}</div>;
}
```

`useResolved` only returns the parameter passed to the resolve function so that it will return `undefined` during loading and when encountering error values. Like `useLoadable`, `useResolved` also suppresses exceptions. In fact, `useResolved` is a simple wrapper around `useLoadable`.

```typescript
// useResolved.ts
import { useLoadable } from './useLoadable';
import type { Computed, Value } from '../core';

export function useResolved<T>(atom: Value<Promise<T>> | Computed<Promise<T>>): T | undefined {
  const loadable = useLoadable(atom);
  return loadable.state === 'hasData' ? loadable.data : undefined;
}
```

## useLastLoadable & useLastResolved

In some scenarios, we want a refreshable Promise Atom to maintain its previous result during the refresh process instead of showing a loading state. Rippling provides `useLastLoadable` and `useLastResolved` to achieve this functionality.

```jsx
import { useLoadable } from 'rippling';
import { user$ } from './atoms/user';

function App() {
  const user_ = useLastLoadable(user$); // Keep the previous result during new user$ request, without triggering loading state
  if (user_.state === 'loading') return <div>Loading...</div>;
  if (user_.state === 'error') return <div>Error: {user_.error.message}</div>;

  return <div>{user_.data.name}</div>;
}
```

`useLastResolved` behaves similarly - it always returns the last resolved value from a Promise Atom and won't reset to `undefined` when a new Promise is generated.

## Updating Atom Values / Triggering Funcs

The `useSet` hook can be used to update the value of an Atom. It returns a function equivalent to `store.set` when called.

```jsx
// App.tsx
import { useSet } from 'rippling';
import { count$ } from './atoms/count';

function App() {
  const setCount = useSet(count$);
  // setCount(x => x + 1) is equivalent to store.set(count$, x => x + 1)
  return <button onClick={() => setCount((x) => x + 1)}>Increment</button>;
}
```
