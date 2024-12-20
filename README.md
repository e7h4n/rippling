<img src="https://github.com/user-attachments/assets/590797c8-6edf-45cc-8eae-028aef0b2cb3"  width="240" >

---

[![Coverage Status](https://coveralls.io/repos/github/e7h4n/ccstate/badge.svg?branch=main)](https://coveralls.io/github/e7h4n/ccstate?branch=main)
![NPM Type Definitions](https://img.shields.io/npm/types/ccstate)
![NPM Version](https://img.shields.io/npm/v/ccstate)
![npm package minimized gzipped size](https://img.shields.io/bundlejs/size/ccstate)
[![CI](https://github.com/e7h4n/ccstate/actions/workflows/ci.yaml/badge.svg)](https://github.com/e7h4n/ccstate/actions/workflows/ci.yaml)
[![CodSpeed Badge](https://img.shields.io/endpoint?url=https://codspeed.io/badge.json)](https://codspeed.io/e7h4n/ccstate)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

English | [中文](README-zh.md)

CCState is a semantic, strict, and flexible state management library suitable for medium to large single-page applications with complex state management needs.

The name of CCState comes from three basic data types: computed, command, and state.

## Quick Features

- 💯 Simple & Intuitive: Crystal-clear API design with just 3 data types and 2 operations
- ✅ Rock-solid Reliability: Comprehensive test coverage reaching 100% branch coverage
- 🪶 Ultra-lightweight: Zero dependencies, only 500 lines of core code
- 💡 Framework Agnostic: Seamlessly works with React, Vanilla JS, or any UI framework
- 🚀 Blazing Fast: Optimized performance from day one, 2x-7x faster than Jotai across scenarios

## Getting Started

### Installation

```bash
# npm
npm i ccstate

# pnpm
pnpm add ccstate

# yarn
yarn add ccstate
```

### Create Data

Use `state` to store a simple value unit, and use `computed` to create a derived computation logic:

```ts
// data.js
import { state, computed } from 'ccstate';

export const userId$ = state('');

export const user$ = computed(async (get) => {
  const userId = get(userId$);
  if (!userId) return null;

  const resp = await fetch(`https://api.github.com/users/${userId}`);
  return resp.json();
});
```

### Use data in React

Use `useGet` and `useSet` hooks in React to get/set data, and use `useResolved` to get Promise value.

```jsx
// App.js
import { useGet, useSet, useResolved } from 'ccstate';
import { userId$, user$ } from './data';

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

Use `createStore` and `StoreProvider` to provide a CCState store to React, all states and computations will only affect this isolated store.

```tsx
// main.jsx
import { createStore, StoreProvider } from 'ccstate';
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

Through these examples, you should have understood the basic usage of CCState. Next, you can read to learn about CCState's core APIs.

## Core APIs

CCState provides several simple concepts to help developers better manage application states. And it can be used as an external store to drive UI frameworks like React.

### State

`State` is the most basic value unit in CCState. A `State` can store any type of value, which can be accessed or modified through the store's `get`/`set` methods. Before explaining why it's designed this way, let's first look at the basic capabilities of `State`.

```typescript
import { store, state } from 'ccstate';

const store = createStore();

const userId$ = state(0);
store.get(userId$); // 0
store.set(userId$, 100);
store.get(userId$); // 100

const callback$ = state<(() => void) | undefined>(undefined);
store.set(callback$, () => {
  console.log('awesome ccstate');
});
store.get(callback$)(); // console log 'awesome ccstate'
```

These examples should be very easy to understand. You might notice a detail in the examples: all variables returned by `state` have a `$` suffix. This is a naming convention used to distinguish an CCState data type from other regular types. CCState data types must be accessed through the store's get/set methods, and since it's common to convert an CCState data type to a regular type using get, the `$` suffix helps avoid naming conflicts.

### Store

In CCState, declaring a `State` doesn't mean the value will be stored within the `State` itself. In fact, a `State` acts like a key in a Map, and CCState needs to create a Map to store the corresponding value for each `State` - this Map is the `Store`.

```typescript
const count$ = state(0); // count$: { init: 0 }

const store = createStore(); // imagine this as new Map()
store.set(count$, 10); // simply imagine as map[count$] = 10

const otherStore = createStore(); // another new Map()
otherStore.get(count$); // anotherMap[$count] ?? $count.init, returns 0
```

This should be easy to understand. If `Store` only needed to support `State` types, a simple Map would be sufficient. However, CCState needs to support two additional data types. Next, let's introduce `Computed`, CCState's reactive computation unit.

### Computed

`Computed` is CCState's reactive computation unit. You can write derived computation logic in `Computed`, such as sending HTTP requests, data transformation, data aggregation, etc.

```typescript
import { computed, createStore } from 'ccstate';

const userId$ = state(0);
const user$ = computed(async (get) => {
  const userId = get(userId$);
  const resp = await fetch('/api/users/' + userId);
  return resp.json();
});

const store = createStore();
const user = await store.get(user$);
```

Does this example seem less intuitive than `State`? Here's a mental model that might help you better understand what's happening:

- `computed(fn)` returns an object `{read: fn}`, which is assigned to `user$`
- When `store.get(user$)` encounters an object which has a read function, it calls that function: `user$.read(store.get)`

This way, `Computed` receives a get accessor that can access other data in the store. This get accessor is similar to `store.get` and can be used to read both `State` and `Computed`. The reason CCState specifically passes a get method to `Computed`, rather than allowing direct access to the store within `Computed`, is to shield the logic within `Computed` from other store methods like `store.set`. The key characteristic of `Computed` is that it can only read states from the store but cannot modify them. In other words, `Computed` is side-effect free.

In most cases, side-effect free computation logic is extremely useful. They can be executed any number of times and have few requirements regarding execution timing. `Computed` is one of the most powerful features in CCState, and you should try to write your logic as `Computed` whenever possible, unless you need to perform set operations on the `Store`.

### Command

`Command` is CCState's logic unit for organizing side effects. It has both `set` and `get` accessors from the store, allowing it to not only read other data types but also modify `State` or call other `Command`.

```typescript
import { command, createStore } from 'ccstate';

const user$ = state<UserInfo | undefined>(undefined);
const updateUser$ = command(async ({ set }, userId) => {
  const user = await fetch('/api/users/' + userId).then((resp) => resp.json());
  set(user$, user);
});

const store = createStore();
store.set(updateUser$, 10); // fetchUserInfo(userId=10) and set to user$
```

Similarly, we can imagine the set operation like this:

- `command(fn)` returns an object `{write: fn}` which is assigned to `updateUser$`
- When `store.set(updateUser$)` encounters an object which has a `write` function, it calls that function: `updateUser$.write({set: store.set, get: store.get}, userId)`

Since `Command` can call the `set` method, it produces side effects on the `Store`. Therefore, its execution timing must be explicitly specified through one of these ways:

- Calling a `Command` through `store.set`
- Being called by the `set` method within other `Command`s
- Being triggered by subscription relationships established through `store.sub`

### Subscribing to Changes

CCState provides a `sub` method on the store to establish subscription relationships.

```typescript
import { createStore, state, computed, command } from 'ccstate';

const base$ = state(0);
const double$ = computed((get) => get(base$) * 2);

const store = createStore();
store.sub(
  double$,
  command(({ get }) => {
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
const user$ = state(undefined);
const userId$ = state(0);
store.sub(
  userId$,
  command(({ set, get }) => {
    const userId = get(userId$);
    const user = fetch('/api/users/' + userId).then((resp) => resp.json());
    set(user$, user);
  }),
);

// ✅ use computed
const userId$ = state(0);
const user$ = computed(async (get) => {
  return await fetch('/api/users/' + get(userId$)).then((resp) => resp.json());
});
```

Using `Computed` to write reactive logic has several advantages:

- No need to manage unsubscription
- No need to worry about it modifying other `State`s or calling other `Command`

Here's a simple rule of thumb:

> if some logic can be written as a `Computed`, it should be written as a `Computed`.

### Comprasion

| Type     | get | set | sub target | as sub callback |
| -------- | --- | --- | ---------- | --------------- |
| State    | ✅  | ✅  | ✅         | ❌              |
| Computed | ✅  | ❌  | ✅         | ❌              |
| Command  | ❌  | ✅  | ❌         | ✅              |

That's it! Next, you can learn how to use CCState in React.

## Using in React

To begin using CCState in a React application, you must utilize the `StoreProvider` to provide a store for the hooks.

```jsx
// main.tsx
import { createStore, StoreProvider } from 'ccstate';
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

### Retrieving Values

The most basic usage is to use `useGet` to retrieve the value from State or Computed.

```jsx
// data/count.ts
import { state } from 'ccstate';
export const count$ = state(0);

// App.tsx
import { useGet } from 'ccstate';
import { count$ } from './data/count';

function App() {
  const count = useGet(count$);
  return <div>{count}</div>;
}
```

`useGet` returns a `State` or a `Computed` value, and when the value changes, `useGet` triggers a re-render of the component.

`useGet` does not do anything special with `Promise` values. In fact, `useGet` is equivalent to a single `store.get` call, plus a `store.sub` to ensure reactive updates to the React component.

Two other useful hooks are available when dealing with `Promise` values. First, we introduce `useLoadable`.

```jsx
// data/user.ts
import { computed } from 'ccstate';

export const user$ = computed(async () => {
  return fetch('/api/users/current').then((res) => res.json());
});

// App.tsx
import { useLoadable } from 'ccstate';
import { user$ } from './data/user';

function App() {
  const user_ = useLoadable(user$);
  if (user_.state === 'loading') return <div>Loading...</div>;
  if (user_.state === 'error') return <div>Error: {user_.error.message}</div>;

  return <div>{user_.data.name}</div>;
}
```

`useLoadable` accepts Value/Computed that returns a `Promise` and wraps the result in a `Loadable` structure.

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
import { useResolved } from 'ccstate';
import { user$ } from './data/user';

function App() {
  const user = useResolved(user$);
  return <div>{user?.name}</div>;
}
```

`useResolved` only returns the parameter passed to the resolve function so that it will return `undefined` during loading and when encountering error values. Like `useLoadable`, `useResolved` also suppresses exceptions. In fact, `useResolved` is a simple wrapper around `useLoadable`.

```typescript
// useResolved.ts
import { useLoadable } from './useLoadable';
import type { Computed, State } from '../core';

export function useResolved<T>(atom: State<Promise<T>> | Computed<Promise<T>>): T | undefined {
  const loadable = useLoadable(atom);
  return loadable.state === 'hasData' ? loadable.data : undefined;
}
```

### useLastLoadable & useLastResolved

In some scenarios, we want a refreshable Promise Computed to maintain its previous result during the refresh process instead of showing a loading state. CCState provides `useLastLoadable` and `useLastResolved` to achieve this functionality.

```jsx
import { useLoadable } from 'ccstate';
import { user$ } from './data/user';

function App() {
  const user_ = useLastLoadable(user$); // Keep the previous result during new user$ request, without triggering loading state
  if (user_.state === 'loading') return <div>Loading...</div>;
  if (user_.state === 'error') return <div>Error: {user_.error.message}</div>;

  return <div>{user_.data.name}</div>;
}
```

`useLastResolved` behaves similarly - it always returns the last resolved value from a Promise Atom and won't reset to `undefined` when a new Promise is generated.

### Updating State / Triggering Command

The `useSet` hook can be used to update the value of State, or trigger Command. It returns a function equivalent to `store.set` when called.

```jsx
// App.tsx
import { useSet } from 'ccstate';
import { count$ } from './data/count';

function App() {
  const setCount = useSet(count$);
  // setCount(x => x + 1) is equivalent to store.set(count$, x => x + 1)
  return <button onClick={() => setCount((x) => x + 1)}>Increment</button>;
}
```

### Testing & Debugging

Testing Value/Computed should be as simple as testing a Map.

```typescript
// counter.test.ts
import { test } from 'vitest';
import { createStore, state } from 'ccstate';

test('test counter', () => {
  const store = createStore();
  const count$ = state(0);
  store.set(count$, 10);
  expect(store.get(count$)).toBe(10);
});
```

Here are some tips to help you better debug during testing.

### ConsoleInterceptor

Use `ConsoleInterceptor` to log most store behaviors to the console during testing:

```typescript
import { createConsoleDebugStore, state, computed, command } from 'ccstate';

const base$ = state(1, { debugLabel: 'base$' });
const derived$ = computed((get) => get(base$) * 2);

const store = createConsoleDebugStore([base$, 'derived'], ['set', 'sub']); // log sub & set actions
store.set(base$, 1); // console: SET [V0:base$] 1
store.sub(
  derived$,
  command(() => void 0),
); // console: SUB [V0:derived$]
```

## Concept behind CCState

CCState is inspired by Jotai. While Jotai is a great state management solution that has benefited the Motiff project significantly, as our project grew larger, especially with the increasing number of states (10k~100k atoms), we felt that some of Jotai's design choices needed adjustments, mainly in these aspects:

- Too many combinations of atom init/setter/getter methods, need simplification to reduce team's mental overhead
- Should reduce reactive capabilities, especially the `onMount` capability - the framework shouldn't provide this ability
- Some implicit magic operations, especially Promise wrapping, make the application execution process less transparent

To address these issues, I created CCState to express my thoughts on state management. Before detailing the differences from Jotai, we need to understand CCState's data types and subscription system.

### More semantic data types

Like Jotai, CCState is also an Atom State solution. However, unlike Jotai, CCState doesn't expose Raw Atom, instead dividing Atoms into three types:

- `State` (equivalent to "Primitive Atom" in Jotai): `State` is a readable and writable "variable", similar to a Primitive Atom in Jotai. Reading a `State` involves no computation process, and writing to a `State` just like a map.set.
- `Computed` (equivalent to "Read-only Atom" in Jotai): `Computed` is a readable computed variable whose calculation process should be side-effect free. As long as its dependent Atoms don't change, repeatedly reading the value of a `Computed` should yield identical results. `Computed` is similar to a Read-only Atom in Jotai.
- `Command` (equivalent to "Write-only Atom" in Jotai): `Command` is used to encapsulate a process code block. The code inside an Command only executes when an external `set` call is made on it. `Command` is also the only type in ccstate that can modify value without relying on a store.

### Subscription System

CCState's subscription system is different from Jotai's. First, CCState's subscription callback must be an `Command`.

```typescript
export const userId$ = state(1);

export const userIdChange$ = command(({ get, set }) => {
  const userId = get(userId$);
  // ...
});

// ...
import { userId$, userIdChange$ } from './data';

function setupPage() {
  const store = createStore();
  // ...
  store.sub(userId$, userIdChange$);
  // ...
}
```

The consideration here is to avoid having callbacks depend on the Store object, which was a key design consideration when creating CCState. In CCState, `sub` is the only API with reactive capabilities, and CCState reduces the complexity of reactive computations by limiting Store usage.

CCState does not have APIs like `onMount`. This is because CCState considers `onMount` to be fundamentally an effect, and providing APIs like `onMount` in `computed` would make the computation process non-idempotent.

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

When designing CCState, we wanted the trigger points for value changes to be completely detached from React's Mount/Unmount lifecycle and completely decoupled from React's rendering behavior.

```jsx
// data.js
export const userId$ = state(0)
export const init$ = command(({set}) => {
  const userId = // ... parse userId from location search
  set(userId$, userId)
})

export const user$ = computed(get => {
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

## Changelog & TODO

[Changelog](packages/ccstate/CHANGELOG.md)

Here are some new ideas:

- Integration with svelte / solid.js
- Enhance devtools
  - Support viewing current subscription graph and related atom values
  - Enable logging and breakpoints for specific atoms in devtools
- Performance improvements
  - Mount atomState directly on atoms when there's only one store in the application to reduce WeakMap lookup overhead
  - Support static declaration of upstream dependencies for Computed to improve performance by disabling runtime dependency analysis

## Contributing

CCState welcomes any suggestions and Pull Requests. If you're interested in improving CCState, here are some basic steps to help you set up a CCState development environment.

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
