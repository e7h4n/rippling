# Concept behind Rippling

Rippling is a state management library inspired by Jotai. While Jotai is a great state management solution that has benefited the Motiff project significantly, as our project grew larger, especially with the increasing number of states (1k~10k atoms), we felt that some of Jotai's design choices needed adjustments, mainly in these aspects:

- Too many combinations of atom init/setter/getter methods, need simplification to reduce team's mental overhead
- Should reduce reactive capabilities, especially the `onMount` capability - the framework shouldn't provide this ability
- Some implicit magic operations, especially Promise wrapping, make the application execution process less transparent

To address these issues, I created Rippling to express my thoughts on state management. Before detailing the differences from Jotai, we need to understand Rippling's Atom types and subscription system.

## More Semantic Atom Types

Like Jotai, Rippling is also an Atom State solution. However, unlike Jotai, Rippling doesn't expose Raw Atom, instead dividing Atoms into three types:

- `Value` (equivalent to "Primitive Atom" in Jotai): `Value` is a readable and writable "variable", similar to a Primitive Atom in Jotai. Reading a `Value` involves no computation process, and writing to a `Value` just like a map.set.
- `Computed` (equivalent to "Read-only Atom" in Jotai): `Computed` is a readable computed variable whose calculation process should be side-effect free. As long as its dependent Atoms don't change, repeatedly reading the value of a `Computed` should yield identical results. `Computed` is similar to a Read-only Atom in Jotai.
- `Func` (equivalent to "Write-only Atom" in Jotai): `Func` is used to encapsulate a process code block. The code inside an Func only executes when an external `set` call is made on it. `Func` is also the only type in rippling that can modify value without relying on a store.

## Subscription System

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

## Avoid `useEffect` in React

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
  const user = useLoadable(user$);
  if (user.state !== 'hasData') {
    return <div>Loading...</div>
  }

  return <>{user.data.name}</>;
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

## Less Magic

TBD
