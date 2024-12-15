# Basic

Rippling is an atomic state management library that provides several simple concepts to help developers better manage application states. And it can be used as an external store to drive UI frameworks like React.

After reading this document, you will:

- Understand the basic usage of Rippling
- Build an understanding of Rippling's implementation principles
- Be prepared with knowledge for using Rippling in React

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

`Computed` is Rippling's reactive computation unit. We can write derived computation logic in `Computed`, such as sending HTTP requests, data transformation, data aggregation, etc.

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

That's it! Through this document, you have understood the core concepts of Rippling. Next, you can read [React](react.md) to learn how to use Rippling in React.
