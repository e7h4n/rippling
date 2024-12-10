# Rippling

[![Coverage Status](https://coveralls.io/repos/github/e7h4n/rippling/badge.svg?branch=main)](https://coveralls.io/github/e7h4n/rippling?branch=main)
![NPM Type Definitions](https://img.shields.io/npm/types/rippling)
![NPM Version](https://img.shields.io/npm/v/rippling)
![npm package minimized gzipped size](https://img.shields.io/bundlejs/size/rippling)
[![CI](https://github.com/e7h4n/rippling/actions/workflows/ci.yaml/badge.svg)](https://github.com/e7h4n/rippling/actions/workflows/ci.yaml)
[![CodSpeed Badge](https://img.shields.io/endpoint?url=https://codspeed.io/badge.json)](https://codspeed.io/e7h4n/rippling)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Core Concepts

### Value

Value is the basic stateful unit in Rippling. They can be thought of as a simple key-value store.

For Example:

```typescript
const store = createStore();
const count$ = $value(0);
store.set(count$, 1);
console.log(store.get(count$)); // 1
```

### Computed

Computed are the basic compute units in Rippling. They can read other Values / Computed.

For Example:

```typescript
const store = createStore();
const count$ = $value(0);
const doubleCount$ = $computed((get) => get(count$) * 2);
console.log(store.get(doubleCount$)); // 0
```

### Func

Func is the basic command unit in Rippling. It can read Value / Computed and write to Value / Func.

For Example:

```typescript
const store = createStore();
const count$ = $value(0);
const doubleCount$ = $value(0);
const updateCount$ = $func((get, set, value) => {
  set(count$, value);
  set(doubleCount$, get(count$) * 2);
});
store.set(updateCount$, 1);
console.log(store.get(count$)); // 1
console.log(store.get(doubleCount$)); // 2
```

## Changelog

[Changelog](packages/rippling/CHANGELOG.md)

## Special Thanks

Thanks [Jotai](https://github.com/pmndrs/jotai) for the inspiration and some code snippets, especially the test cases. Without their work, this project would not exist.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
