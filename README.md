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
import { $value, $computed } from 'rippling';

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
import { useGet, useSet, useResolved } from 'rippling';
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
import { createStore, StoreProvider } from 'rippling';
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

Through these examples, you should have understood the basic usage of Rippling. Next, you can read to learn about Rippling's core APIs.

## Core APIs

Rippling is an atomic state management library that provides several simple concepts to help developers better manage application states. And it can be used as an external store to drive UI frameworks like React.

### Value

`Value` is the most basic state storage unit in Rippling. A `Value` can store any type of value, which can be accessed or modified through the store's `get`/`set` methods. Before explaining why it's designed this way, let's first look at the basic capabilities of `Value`.

```typescript
import { store, $value } from 'rippling';

const store = createStore();

const userId$ = $value(0);
store.get(userId$); // 0
store.set(userId$, 100);
store.get(userId$); // 100

const callback$ = $value<(() => void) | undefined>(undefined);
store.set(callback$, () => {
  console.log('awesome rippling');
});
store.get(callback$)(); // console log 'awesome rippling'
```

These examples should be very easy to understand. You might notice a detail in the examples: all variables returned by `$value` have a `$` suffix. This is a naming convention used to distinguish an Atom type from other regular types. Atom types must be accessed through the store's get/set methods, and since it's common to convert an Atom type to a regular type using get, the `$` suffix helps avoid naming conflicts.

### Store

In Rippling, declaring a `Value` doesn't mean the value will be stored within the `Value` itself. In fact, a `Value` acts like a key in a Map, and Rippling needs to create a Map to store the corresponding value for each `Value` - this Map is the `Store`.

```typescript
const count$ = $value(0); // count$: { init: 0 }

const store = createStore(); // imagine this as new Map()
store.set(count$, 10); // simply imagine as map[count$] = 10

const otherStore = createStore(); // another new Map()
otherStore.get(count$); // anotherMap[$count] ?? $count.init, returns 0
```

This should be easy to understand. If `Store` only needed to support `Value` types, a simple Map would be sufficient. However, Rippling needs to support two additional atomic types. Next, let's introduce `Computed`, Rippling's reactive computation unit.

### Computed

`Computed` is Rippling's reactive computation unit. You can write derived computation logic in `Computed`, such as sending HTTP requests, data transformation, data aggregation, etc.

```typescript
import { $computed, createStore } from 'rippling';

const userId$ = $value(0);
const user$ = $computed(async (get) => {
  const userId = get(userId$);
  const resp = await fetch('/api/users/' + userId);
  return resp.json();
});

const store = createStore();
const user = await store.get(user$);
```

Does this example seem less intuitive than `Value`? Here's a mental model that might help you better understand what's happening:

- `$computed(fn)` returns an object `{read: fn}`, which is assigned to `user$`
- When `store.get(user$)` encounters an object which has a read function, it calls that function: `user$.read(store.get)`

This way, `Computed` receives a get accessor that can access other data in the store. This get accessor is similar to `store.get` and can be used to read both `Value` and `Computed`. The reason Rippling specifically passes a get method to `Computed`, rather than allowing direct access to the store within `Computed`, is to shield the logic within `Computed` from other store methods like `store.set`. The key characteristic of `Computed` is that it can only read states from the store but cannot modify them. In other words, `Computed` is side-effect free.

In most cases, side-effect free computation logic is extremely useful. They can be executed any number of times and have few requirements regarding execution timing. `Computed` is one of the most powerful features in Rippling, and you should try to write your logic as `Computed` whenever possible, unless you need to perform set operations on the `Store`.

### Func

`Func` is Rippling's logic unit for organizing side effects. It has both `set` and `get` accessors from the store, allowing it to not only read other Atom values but also modify `Value` or call other `Func`.

```typescript
import { $func, createStore } from 'rippling';

const user$ = $value<UserInfo | undefined>(undefined);
const updateUser$ = $func(async ({ set }, userId) => {
  const user = await fetch('/api/users/' + userId).then((resp) => resp.json());
  set(user$, user);
});

const store = createStore();
store.set(updateUser$, 10); // fetchUserInfo(userId=10) and set to user$
```

Similarly, we can imagine the set operation like this:

- `$func(fn)` returns an object `{write: fn}` which is assigned to `updateUser$`
- When `store.set(updateUser$)` encounters an object which has a `write` function, it calls that function: `updateUser$.write({set: store.set, get: store.get}, userId)`

Since `Func` can call the `set` method, it produces side effects on the `Store`. Therefore, its execution timing must be explicitly specified through one of these ways:

- Calling a `Func` through `store.set`
- Being called by the `set` method within other `Func`s
- Being triggered by subscription relationships established through `store.sub`

### Subscribing to Changes

Rippling provides a `sub` method on the store to establish subscription relationships.

```typescript
import { createStore, $value, $computed, $func } from 'rippling';

const base$ = $value(0);
const double$ = $computed((get) => get(base$) * 2);

const store = createStore();
store.sub(
  double$,
  $func(({ get }) => {
    console.log('double', get(double$));
  }),
);

store.set(base$, 10); // will log to console 'double 20'
```

There are two ways to unsubscribe:

1. Using the `unsub` function returned by `store.sub`
2. Using an AbortSignal to control the subscription

The `sub` method is powerful but should be used carefully. In most cases, `Computed` is a better choice than `sub` because `Computed` doesn't generate new `set` operations.

```typescript
// 🙅 use sub
const user$ = $value(undefined);
const userId$ = $value(0);
store.sub(
  userId$,
  $func(({ set, get }) => {
    const userId = get(userId$);
    const user = fetch('/api/users/' + userId).then((resp) => resp.json());
    set(user$, user);
  }),
);

// ✅ use $computed
const userId$ = $value(0);
const user$ = $computed(async (get) => {
  return await fetch('/api/users/' + get(userId$)).then((resp) => resp.json());
});
```

Using `Computed` to write reactive logic has several advantages:

- No need to manage unsubscription
- No need to worry about it modifying other `Value`s or calling other `Func`

Here's a simple rule of thumb:

> if some logic can be written as a `Computed`, it should be written as a `Computed`.

### Comprasion

| Type     | get | set | sub target | sub callback |
| -------- | --- | --- | ---------- | ------------ |
| Value    | ✅  | ✅  | ✅         | ❌           |
| Computed | ✅  | ❌  | ✅         | ❌           |
| Func     | ❌  | ✅  | ❌         | ✅           |

That's it! Next, you can learn how to use Rippling in React.

## Using in React

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

### Retrieving Atom Values

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

### useLastLoadable & useLastResolved

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

### Updating Atom Values / Triggering Funcs

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

### Testing & Debugg

Testing Atoms should be as simple as testing a Map.

```typescript
// counter.test.ts
import { test } from 'vitest';
import { createStore, $value } from 'rippling';

test('test counter', () => {
  const store = createStore();
  const count$ = $value(0);
  store.set(count$, 10);
  expect(store.get(count$)).toBe(10);
});
```

Here are some tips to help you better debug during testing.

### ConsoleInterceptor

Use `ConsoleInterceptor` to log most store behaviors to the console during testing:

```typescript
import { ConsoleInterceptor, createDebugStore, $value, $computed, $func } from 'rippling';

const base$ = $value(1, { debugLabel: 'base$' });
const derived$ = $computed((get) => get(base$) * 2);

const interceptor = new ConsoleInterceptor([
  {
    target: base$,
    actions: new Set(['set']), // will only log set actions
  },
  {
    target: derived$, // will log all actions
  },
]);

const store = createDebugStore(interceptor);
store.set(base$, 1); // console: SET [V0:base$] 1
store.sub(
  derived$,
  $func(() => void 0),
); // console: SUB [V0:derived$]
```

## Concept behind Rippling

Rippling is inspired by Jotai. While Jotai is a great state management solution that has benefited the Motiff project significantly, as our project grew larger, especially with the increasing number of states (10k~100k atoms), we felt that some of Jotai's design choices needed adjustments, mainly in these aspects:

- Too many combinations of atom init/setter/getter methods, need simplification to reduce team's mental overhead
- Should reduce reactive capabilities, especially the `onMount` capability - the framework shouldn't provide this ability
- Some implicit magic operations, especially Promise wrapping, make the application execution process less transparent

To address these issues, I created Rippling to express my thoughts on state management. Before detailing the differences from Jotai, we need to understand Rippling's Atom types and subscription system.

### More Semantic Atom Types

Like Jotai, Rippling is also an Atom State solution. However, unlike Jotai, Rippling doesn't expose Raw Atom, instead dividing Atoms into three types:

- `Value` (equivalent to "Primitive Atom" in Jotai): `Value` is a readable and writable "variable", similar to a Primitive Atom in Jotai. Reading a `Value` involves no computation process, and writing to a `Value` just like a map.set.
- `Computed` (equivalent to "Read-only Atom" in Jotai): `Computed` is a readable computed variable whose calculation process should be side-effect free. As long as its dependent Atoms don't change, repeatedly reading the value of a `Computed` should yield identical results. `Computed` is similar to a Read-only Atom in Jotai.
- `Func` (equivalent to "Write-only Atom" in Jotai): `Func` is used to encapsulate a process code block. The code inside an Func only executes when an external `set` call is made on it. `Func` is also the only type in rippling that can modify value without relying on a store.

### Subscription System

Rippling's subscription system is different from Jotai's. First, Rippling's subscription callback must be an `Func`.

```typescript
export const userId$ = $value(1);

export const userIdChange$ = $func(({ get, set }) => {
  const userId = get(userId$);
  // ...
});

// ...
import { userId$, userIdChange$ } from './atoms';

function setupPage() {
  const store = createStore();
  // ...
  store.sub(userId$, userIdChange$);
  // ...
}
```

The consideration here is to avoid having callbacks depend on the Store object, which was a key design consideration when creating Rippling. In Rippling, `sub` is the only API with reactive capabilities, and Rippling reduces the complexity of reactive computations by limiting Store usage.

Rippling does not have APIs like `onMount`. This is because Rippling considers `onMount` to be fundamentally an effect, and providing APIs like `onMount` in `computed` would make the computation process non-idempotent.

### Avoid `useEffect` in React

While Reactive Programming like `useEffect` has natural advantages in decoupling View Components, it causes many complications for editor applications like [Motiff](https://motiff.com).

Regardless of the original design semantics of `useEffect`, in the current environment, `useEffect`'s semantics are deeply bound to React's rendering behavior. When engineers use `useEffect`, they subconsciously think "callback me when these things change", especially "callback me when some async process is done". While it's easy to write such waiting code using `async/await`, it feels unnatural in React.

```jsx
// App.jsx
// Reactive Programming in React
export function App() {
  const userId = useUserId(); // an common hook to takeout userId from current location search params
  const [user, setUser] = useState();
  const [loading, setLoading] = useState();

  useEffect(() => {
    setLoading(true);
    fetch('/api/users/' + userId)
      .then((resp) => resp.json())
      .then((u) => {
        setLoading(false);
        setUser(u);
      });
  }, [userId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <>{user?.name}</>;
}
```

When designing Rippling, we wanted the trigger points for value changes to be completely detached from React's Mount/Unmount lifecycle and completely decoupled from React's rendering behavior.

```jsx
// atoms.js
export const userId$ = $value(0)
export const init$ = $func(({set}) => {
  const userId = // ... parse userId from location search
  set(userId$, userId)
})

export const user$ = $computed(get => {
  const userId = get(userId$)
  return fetch('/api/users/' + userId).then(resp => resp.json())
})

// App.jsx
export function App() {
  const user = useLastResolved(user$);
  return <>{user?.name}</>;
}

// main.jsx
const store = createStore();
store.set(init$)

const rootElement = document.getElementById('root')!;
const root = createRoot(rootElement);
root.render(
  <StoreProvider value={store}>
    <App />
  </StoreProvider>,
);
```

## Practices

### Naming

Add the suffix `$` to atoms. Since we often need to get values from Atoms in many scenarios, adding the suffix after Atom can avoid naming conflicts.

```typescript
const count$ = $value(0);
const double$ = $computed((get) => get(count$) * 2);
const updateCount$ = $func(({ get, set }, val) => {
  set(count$, val);
});

// ...
const count = get(count$) // will not conflict with normal value

// in react component
const updateCount = useSet(updateCount$) // Func suffix is useful for this

return <button onClick={() => updateCount(10)}>update</button>
```

### Internal Atom

Feel free to create internal Atom. Atom is very lightweight. Creating an Atom should be just like creating a variable. Atoms don't necessarily need to be persisted or defined in the top-level scope - it's perfectly fine to create Atoms inside closures or pass new Atoms through containers.

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
