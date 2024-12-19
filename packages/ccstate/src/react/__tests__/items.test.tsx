// @vitest-environment happy-dom

import { StrictMode } from 'react';

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, it } from 'vitest';
import { $computed, $func, $value, createStore, type Updater, type Value } from '../../core';
import { useGet } from '../useGet';
import { useSet } from '../useSet';
import { StoreProvider } from '../provider';

afterEach(() => {
  cleanup();
});

it('remove an item, then add another', async () => {
  interface Item {
    text: string;
    checked: boolean;
  }
  let itemIndex = 0;
  const itemsAtom = $value<Value<Item>[]>([]);

  const ListItem = ({ itemAtom, remove }: { itemAtom: Value<Item>; remove: () => void }) => {
    const item = useGet(itemAtom);
    const setItem = useSet(itemAtom);

    const toggle = () => {
      setItem((prev) => {
        return { ...prev, checked: !prev.checked };
      });
    };

    return (
      <>
        <div>
          {item.text} checked: {item.checked ? 'yes' : 'no'}
        </div>
        <button onClick={toggle}>Check {item.text}</button>
        <button onClick={remove}>Remove {item.text}</button>
      </>
    );
  };

  const List = () => {
    const items = useGet(itemsAtom);
    const setItems = useSet(itemsAtom);

    const addItem = () => {
      setItems((prev) => {
        return [
          ...prev,
          $value({
            text: `item${String(++itemIndex)}`,
            checked: false,
          }),
        ];
      });
    };

    const removeItem = (itemAtom: Value<Item>) => {
      setItems((prev) => {
        return prev.filter((x) => x !== itemAtom);
      });
    };

    return (
      <ul>
        {items.map((itemAtom) => (
          <ListItem
            key={itemAtom.toString()}
            itemAtom={itemAtom}
            remove={() => {
              removeItem(itemAtom);
            }}
          />
        ))}
        <li>
          <button onClick={addItem}>Add</button>
        </li>
      </ul>
    );
  };

  const store = createStore();
  render(
    <StrictMode>
      <StoreProvider value={store}>
        <List />
      </StoreProvider>
    </StrictMode>,
  );

  await userEvent.click(screen.getByText('Add'));
  await screen.findByText('item1 checked: no');

  await userEvent.click(screen.getByText('Add'));
  await waitFor(() => {
    screen.getByText('item1 checked: no');
    screen.getByText('item2 checked: no');
  });

  await userEvent.click(screen.getByText('Check item2'));
  await waitFor(() => {
    screen.getByText('item1 checked: no');
    screen.getByText('item2 checked: yes');
  });

  await userEvent.click(screen.getByText('Remove item1'));
  await screen.findByText('item2 checked: yes');

  await userEvent.click(screen.getByText('Add'));
  await waitFor(() => {
    screen.getByText('item2 checked: yes');
    screen.getByText('item3 checked: no');
  });
});

it('add an item with filtered list', async () => {
  interface Item {
    text: string;
    checked: boolean;
  }
  type ItemAtoms = Value<Item>[];

  let itemIndex = 0;
  const itemAtomsAtom = $value<ItemAtoms>([]);
  const setItemsAtom = $func(({ set }, update: Updater<ItemAtoms>) => {
    set(itemAtomsAtom, update);
  });

  const filterAtom = $value<'all' | 'checked' | 'not-checked'>('all');
  const filteredAtom = $computed((get) => {
    const filter = get(filterAtom);
    const items = get(itemAtomsAtom);
    if (filter === 'all') {
      return items;
    }
    if (filter === 'checked') {
      return items.filter((atom) => get(atom).checked);
    }
    return items.filter((atom) => !get(atom).checked);
  });

  const ListItem = ({ itemAtom, remove }: { itemAtom: Value<Item>; remove: () => void }) => {
    const item = useGet(itemAtom);
    const setItem = useSet(itemAtom);
    const toggle = () => {
      setItem((prev) => ({ ...prev, checked: !prev.checked }));
    };
    return (
      <>
        <div>
          {item.text} checked: {item.checked ? 'yes' : 'no'}
        </div>
        <button onClick={toggle}>Check {item.text}</button>
        <button onClick={remove}>Remove {item.text}</button>
      </>
    );
  };

  const Filter = () => {
    const filter = useGet(filterAtom);
    const setFilter = useSet(filterAtom);

    return (
      <>
        <div>{filter}</div>
        <button
          onClick={() => {
            setFilter('all');
          }}
        >
          All
        </button>
        <button
          onClick={() => {
            setFilter('checked');
          }}
        >
          Checked
        </button>
        <button
          onClick={() => {
            setFilter('not-checked');
          }}
        >
          Not Checked
        </button>
      </>
    );
  };

  const FilteredList = ({ removeItem }: { removeItem: (itemAtom: Value<Item>) => void }) => {
    const items = useGet(filteredAtom);
    return (
      <ul>
        {items.map((itemAtom) => (
          <ListItem
            key={itemAtom.toString()}
            itemAtom={itemAtom}
            remove={() => {
              removeItem(itemAtom);
            }}
          />
        ))}
      </ul>
    );
  };

  const List = () => {
    const setItems = useSet(setItemsAtom);
    const addItem = () => {
      setItems((prev) => [...prev, $value<Item>({ text: `item${String(++itemIndex)}`, checked: false })]);
    };
    const removeItem = (itemAtom: Value<Item>) => {
      setItems((prev) => prev.filter((x) => x !== itemAtom));
    };
    return (
      <>
        <Filter />
        <button onClick={addItem}>Add</button>
        <FilteredList removeItem={removeItem} />
      </>
    );
  };

  const store = createStore();
  render(
    <StoreProvider value={store}>
      <StrictMode>
        <List />
      </StrictMode>
    </StoreProvider>,
  );

  await userEvent.click(screen.getByText('Checked'));
  await userEvent.click(screen.getByText('Add'));
  await userEvent.click(screen.getByText('All'));
  await screen.findByText('item1 checked: no');
});
