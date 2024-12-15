# Recommend Practices

## Naming

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

## Internal Atom

Feel free to create internal Atom. Atom is very lightweight. Creating an Atom should be just like creating a variable. Atoms don't necessarily need to be persisted or defined in the top-level scope - it's perfectly fine to create Atoms inside closures or pass new Atoms through containers.

## Do not use `store` directly

TODO

## Use `store.sub` with caution

TODO
