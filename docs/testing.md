# Testing

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

## consoleLoggingInterceptor

Use `consoleLoggingInterceptor` to log most store behaviors to the console during testing:

```typescript
import { consoleLoggingInterceptor } from 'rippling';
const store = createDebugStore(consoleLoggingInterceptor);
const base$ = $value(1, { debugLabel: 'base$' });
store.get(base$); // console: GET [V0:base$] 1
```
