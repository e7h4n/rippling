<img src="https://github.com/user-attachments/assets/590797c8-6edf-45cc-8eae-028aef0b2cb3"  width="240" >

---

[![Coverage Status](https://coveralls.io/repos/github/e7h4n/ccstate/badge.svg?branch=main)](https://coveralls.io/github/e7h4n/ccstate?branch=main)
![NPM Type Definitions](https://img.shields.io/npm/types/ccstate)
![NPM Version](https://img.shields.io/npm/v/ccstate)
![npm package minimized gzipped size](https://img.shields.io/bundlejs/size/ccstate)
[![CI](https://github.com/e7h4n/ccstate/actions/workflows/ci.yaml/badge.svg)](https://github.com/e7h4n/ccstate/actions/workflows/ci.yaml)
[![CodSpeed Badge](https://img.shields.io/endpoint?url=https://codspeed.io/badge.json)](https://codspeed.io/e7h4n/ccstate)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[English](README.md) | 中文

CCState 是一个语义化、严谨且灵活的状态管理库，特别适用于具有复杂状态管理需求的中大型单页应用。

CCState 的名称源自其三种基本数据类型：计算值（computed）、命令（command）和状态（state）。

## 主要特性

- 💯 简单直观：清晰的 API 设计，仅包含 3 种数据类型和 2 种操作方式
- ✅ 可靠稳固：全面的测试覆盖率达到 100% 分支覆盖
- 🪶 超轻量级：零依赖，核心代码仅 500 行
- 💡 框架无关：可无缝对接 React、原生 JS 或任何 UI 框架
- 🚀 性能卓越：从设计之初就注重性能优化，在各种场景下比 Jotai 快 2-7 倍

## 快速开始

### 安装

```bash
# npm
npm i ccstate

# pnpm
pnpm add ccstate

# yarn
yarn add ccstate
```

### 创建数据

使用 `state` 来存储一个简单的值单元，并使用 `computed` 来创建一个派生计算逻辑：

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

### 在 React 中使用数据

在 React 中使用 `useGet` 和 `useSet` 钩子来获取/设置数据，并使用 `useResolved` 来获取 Promise 值。

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

使用 `createStore` 和 `StoreProvider` 为 React 提供一个 CCState 存储，所有状态和计算值只会影响这个隔离的存储。

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

That's it! [点击这里查看完整示例](https://codesandbox.io/p/sandbox/cr3xg6).

通过这些示例，你应该已经了解了 CCState 的基本用法。接下来，你可以阅读 CCState 的核心 API 来了解更多信息。

## 核心 API

CCState 提供了几种简单概念来帮助开发者更好地管理应用状态。它还可以作为外部存储来驱动 UI 框架，如 React。

### State

`State` 是 CCState 中最基本的值单元。一个 `State` 可以存储任何类型的值，可以通过 store 的 `get`/`set` 方法访问或修改。在解释为什么这样设计之前，我们先来看看 `State` 的基本能力。

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

这些示例应该很容易理解。你可能注意到示例中的一个细节：所有由 `state` 返回的变量都有一个 `$` 后缀。这是一种命名约定，用于区分 CCState 数据类型与其他常规类型。CCState 数据类型必须通过 store 的 `get`/`set` 方法访问，由于经常需要将 CCState 数据类型转换为常规类型，因此 `$` 后缀有助于避免命名冲突。

### Store

在 CCState 中，声明一个 `State` 并不意味着值会存储在 `State` 本身中。实际上，一个 `State` 就像一个 Map 的键，CCState 需要创建一个 Map 来存储每个 `State` 对应的值 - 这个 Map 就是 `Store`。

```typescript
const count$ = state(0); // count$: { init: 0 }

const store = createStore(); // 想象这个 store 是一个新的 Map()
store.set(count$, 10); // 简单想象为 map[count$] = 10

const otherStore = createStore(); // 另一个新的 Map()
otherStore.get(count$); // anotherMap[$count] ?? $count.init, returns 0
```

这应该很容易理解。如果 `Store` 只需要支持 `State` 类型，一个简单的 Map 就足够了。然而，CCState 需要支持两种额外的数据类型。接下来，让我们引入 `Computed`，CCState 的响应式计算单元。

### Computed

`Computed` 是 CCState 的响应式计算单元。你可以在 `Computed` 中编写派生计算逻辑，例如发送 HTTP 请求、数据转换、数据聚合等。

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

这个示例看起来比 `State` 不直观？这里有一个可能有助于你更好地理解发生了什么的思维模型：

- `computed(fn)` 返回一个对象 `{read: fn}`
- 当 `store.get(user$)` 遇到一个具有 `read` 方法的对象时，它调用该函数：`user$.read(store.get)`

这样，`Computed` 接收一个可以访问其他数据的方法，这个方法等价于 `store.get`，可以用于读取 `State` 和 `Computed`。CCState 特意将 `get` 方法传递给 `Computed`，而不是允许直接访问 `Computed` 内部的 `Store`，是为了将 `Computed` 内部的逻辑与 `Store` 的其他方法隔离开来，例如 `store.set`。`Computed` 的关键特性是它只能从 `Store` 中读取数据，而不能修改它们。换句话说，`Computed` 是无副作用的。

在大多数情况下，无副作用的计算逻辑非常有用。它们可以被多次执行，并且对执行时机的要求很少。`Computed` 是 CCState 中最强大的功能之一，你应该尽可能地将逻辑写成 `Computed`，除非你需要对 `Store` 进行设置操作。

### Command

`Command` 是 CCState 的逻辑单元，用于组织副作用。它具有 `set` 和 `get` 访问器，允许它不仅读取其他数据类型，还可以修改 `State` 或调用其他 `Command`。

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

同样，我们可以想象 `set` 操作是这样的：

- `command(fn)` 返回一个对象 `{write: fn}`，它被赋值给 `updateUser$`
- 当 `store.set(updateUser$)` 遇到一个具有 `write` 方法的对象时，它调用该函数：`updateUser$.write({set: store.set, get: store.get}, userId)`

由于 `Command` 可以调用 `set` 方法，它会在 `Store` 上产生副作用。因此，它的执行时机必须通过以下方式之一明确指定：

- 通过 `store.set` 调用 `Command`
- 在其他 `Command` 的 `set` 方法中被调用
- 通过 `store.sub` 建立的订阅关系被触发

### 订阅变化

CCState 在 `Store` 上提供了一个 `sub` 方法来建立订阅关系。

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

有两种方法可以取消订阅：

1. 使用 `store.sub` 返回的 `unsub` 函数
2. 在 `sub` 方法的第三个参数中传入一个 `signal`，使用 `AbortSignal` 来控制订阅

`sub` 方法非常强大，但应该谨慎使用。在大多数情况下，`Computed` 比 `sub` 更好，因为 `Computed` 不会生成新的 `set` 操作。

```typescript
// 🙅 使用 sub
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

// ✅ 使用 computed
const userId$ = state(0);
const user$ = computed(async (get) => {
  return await fetch('/api/users/' + get(userId$)).then((resp) => resp.json());
});
```

使用 `Computed` 来编写响应式逻辑有几个优点：

- 不需要管理取消订阅
- 不需要担心它修改其他 `State` 或调用其他 `Command`

这里有一个简单的经验法则：

> 如果某些逻辑可以写成 `Computed`，则应该写成 `Computed`。

### 比较

| 类型     | get | set | sub 目标 | 作为 sub 回调 |
| -------- | --- | --- | -------- | ------------- |
| State    | ✅  | ✅  | ✅       | ❌            |
| Computed | ✅  | ❌  | ✅       | ❌            |
| Command  | ❌  | ✅  | ❌       | ✅            |

这就是全部了！接下来，你可以学习如何在 React 中使用 CCState。

## 在 React 中使用

要在 React 应用程序中使用 CCState，必须使用 `StoreProvider` 提供一个 store 供 hooks 使用。

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

`StoreProvider` 内的所有子组件都将使用提供的 store 作为 `get` 和 `set` 操作的调用者。

你可以将 `StoreProvider` 放在 `StrictMode` 内或外，功能是相同的。

### 获取值

最基本的使用是使用 `useGet` 从 `State` 或 `Computed` 中获取值。

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

`useGet` 返回一个 `State` 或 `Computed` 值，当值发生变化时，`useGet` 会触发组件的重新渲染。

`useGet` 对 `Promise` 值没有任何特殊处理。实际上，`useGet` 等价于一个 `store.get` 调用 + 一个 `store.sub` 来确保 React 组件的响应式更新。

处理 `Promise` 值时，还有两个有用的 hook。首先，我们引入 `useLoadable`。

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

`useLoadable` 接受返回 `Promise` 的 `Value` 或 `Computed`，并将其结果包装在 `Loadable` 结构中。

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

这允许你根据状态在 JSX 中渲染加载和错误状态。`useLoadable` 会自己处理异常，因此不会触发 `ErrorBoundary`。

另一个有用的 hook 是 `useResolved`，它总是返回 `Promise` 的解析值。

```jsx
// App.tsx
import { useResolved } from 'ccstate';
import { user$ } from './data/user';

function App() {
  const user = useResolved(user$);
  return <div>{user?.name}</div>;
}
```

`useResolved` 只返回传递给解析函数的参数，因此它会在加载期间和遇到错误值时返回 `undefined`。像 `useLoadable` 一样，`useResolved` 也会抑制异常。实际上，`useResolved` 是 `useLoadable` 的简单包装。

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

在某些场景中，我们希望一个可刷新的 Promise Computed 在刷新过程中保持其上一个结果，而不是显示加载状态。CCState 提供了 `useLastLoadable` 和 `useLastResolved` 来实现这一功能。

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

`useLastResolved` 的行为类似 - 它总是返回 Promise Atom 的最后一个解析值，不会在生成新的 Promise 时重置为 `undefined`。

### 更新 State / 触发 Command

`useSet` hook 可以用来更新 `State` 的值，或者触发 `Command`。它返回一个等价于 `store.set` 的函数。

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

### 测试 & 调试

测试 `Value`/`Computed` 应该和测试 `Map` 一样简单。

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

这里有一些提示可以帮助你更好地调试测试。

### createConsoleDebugStore

使用 `createConsoleDebugStore` 在测试期间将大多数 store 行为记录到控制台：

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

## CCState 背后的理念

CCState 受 Jotai 启发。虽然 Jotai 是一个很好的状态管理解决方案，对 Motiff 项目有很大的帮助，但随着项目的发展，尤其是随着状态数量的增加（10k~100k 个原子），我们觉得 Jotai 的一些设计选择需要调整，主要在以下方面：

- 太多的组合的 `atom` 初始化/设置器/获取器方法，需要简化以减少团队的心智负担
- 应该减少响应式能力，尤其是 `onMount` 能力 - 框架不应该提供这种能力
- 一些隐式的魔法操作，尤其是 Promise 包装，使得应用程序的执行过程不透明

为了解决这些问题，我创建了 CCState 来表达我对状态管理的思考。在详细介绍与 Jotai 的区别之前，我们需要先理解 CCState 的数据类型和订阅系统。

### 更语义化的数据类型

与 Jotai 一样，CCState 也是一个原子状态(Atom State)解决方案。但与 Jotai 不同的是，CCState 并不暴露原始原子(Raw Atom)，而是将原子分为三种类型：

- `State`（相当于 Jotai 中的"原始原子"）：`State` 是一个可读写的"变量"，类似于 Jotai 中的原始原子。读取 `State` 不涉及任何计算过程，写入 `State` 就像 map.set 一样简单。
- `Computed`（相当于 Jotai 中的"只读原子"）：`Computed` 是一个可读的计算变量，其计算过程应该是无副作用的。只要它依赖的原子没有改变，重复读取 `Computed` 的值应该得到相同的结果。`Computed` 类似于 Jotai 中的只读原子。
- `Command`（相当于 Jotai 中的"只写原子"）：`Command` 用于封装一个过程代码块。Command 内部的代码只有在外部对其进行 `set` 调用时才会执行。`Command` 也是 ccstate 中唯一一个可以不依赖 store 就能修改值的类型。

### 订阅系统

CCState 的订阅系统与 Jotai 不同。首先，CCState 的订阅回调必须是一个 `Command`。

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

这样设计的考虑是为了避免回调函数依赖 Store 对象，这也是创建 CCState 时的一个关键设计考量。在 CCState 中，`sub` 是唯一具有响应式能力的 API，通过限制 Store 的使用，CCState 降低了响应式计算的复杂性。

CCState 没有提供类似 `onMount` 这样的 API。这是因为 CCState 认为 `onMount` 本质上是一个副作用(effect)，在 `computed` 中提供类似 `onMount` 的 API 会使计算过程失去幂等性。

### 避免在 React 中使用 `useEffect`

虽然像 `useEffect` 这样的响应式编程在解耦视图组件方面有其天然优势，但对于像 [Motiff](https://motiff.com) 这样的编辑器应用来说，它会带来许多复杂性。

不论 `useEffect` 最初的设计语义如何，在当前环境下，`useEffect` 的语义已经与 React 的渲染行为深度绑定。当工程师使用 `useEffect` 时，他们潜意识里会认为"当这些东西改变时回调我"，特别是"当某个异步过程完成时回调我"。使用 `async/await` 编写这种异步等待代码很容易，但 React 中用 `useEffect` 则并不自然。

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

在设计 CCState 时，我们希望状态值变更的触发点能够完全脱离 React 的挂载/卸载生命周期，并且与 React 的渲染行为彻底解耦。

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

## 参与贡献

CCState 欢迎任何建议和 Pull Request。如果您有兴趣改进 CCState，以下是帮助您搭建 CCState 开发环境的基本步骤。

```bash
pnpm install
pnpm husky # setup commit hooks to verify commit
pnpm vitest # to run all tests
pnpm lint # check code style & typing
```

## 特别鸣谢

感谢 [Jotai](https://github.com/pmndrs/jotai) 项目带来的灵感和部分代码片段，尤其是测试用例的参考。没有他们的工作，就不会有本项目的诞生。

## 开源许可

本项目采用 MIT 许可证 - 详情请参阅 [LICENSE](LICENSE) 文件。
