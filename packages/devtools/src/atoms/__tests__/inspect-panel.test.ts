import { expect } from 'vitest';
import { $func, $value, createDebugStore, type SetEventData } from 'rippling';
import { screen } from '@testing-library/react';
import { panelTest } from './context';
import { userEvent } from '@testing-library/user-event';
import { selectedFilter$, storeEvents$ } from '../events';
import { delay } from 'signal-timers';

panelTest('should render events', async ({ panel }) => {
  panel.show();

  const storeToTest = createDebugStore(panel.interceptor);
  const base$ = $value(0);
  storeToTest.set(base$, 1);

  const eventRows = await screen.findAllByTestId('event-row');
  expect(eventRows.length).toBeGreaterThan(0);
});

panelTest('should render events if panel is not open', async ({ panel }) => {
  const storeToTest = createDebugStore(panel.interceptor);

  const base$ = $value(0);
  storeToTest.set(base$, 1);

  panel.show();

  const eventRows = await screen.findAllByTestId('event-row');
  expect(eventRows.length).toBeGreaterThan(0);
});

panelTest('clear should cleanup all events', async ({ panel }) => {
  const storeToTest = createDebugStore(panel.interceptor);

  const base$ = $value(0);

  panel.show();

  await expect(screen.findAllByTestId('event-row')).rejects.toThrow();

  storeToTest.set(base$, 1);

  await delay(10);
  expect(panel.panelStore.get(storeEvents$)).toHaveLength(1);
  expect((panel.panelStore.get(panel.panelStore.get(storeEvents$)[0]).data as SetEventData).args).toEqual([1]);

  const clearButton = await screen.findByTestId('clear-events');
  const user = userEvent.setup();
  await user.click(clearButton);

  await delay(10);
  expect(panel.panelStore.get(storeEvents$)).toHaveLength(0);
});

panelTest('should render unmount events ', async ({ panel }) => {
  panel.show();

  const storeToTest = createDebugStore(panel.interceptor);
  const base$ = $value(0);
  storeToTest.sub(
    base$,
    $func(() => void 0),
  )();

  let eventRows = await screen.findAllByTestId('event-row');

  const user = userEvent.setup();
  await user.click(screen.getByLabelText('unmount'));
  await user.click(screen.getByLabelText('sub'));

  const filters = panel.panelStore.get(selectedFilter$);
  expect(filters.has('unmount')).toBeTruthy();
  expect(filters.has('sub')).toBeFalsy();
  expect(panel.panelStore.get(storeEvents$)).toHaveLength(1);
  eventRows = await screen.findAllByTestId('event-row');
  expect(eventRows[0]).toHaveTextContent('UNMOUNT');
});

panelTest('should filter events', async ({ panel }) => {
  panel.show();

  const storeToTest = createDebugStore(panel.interceptor);
  const base$ = $value(0);
  storeToTest.set(base$, 1);

  const eventRows = await screen.findAllByTestId('event-row');
  expect(eventRows.length).toBe(1);

  const user = userEvent.setup();
  const label = screen.getByLabelText('set');
  await user.click(label);

  await expect(screen.findAllByTestId('event-row')).rejects.toThrow();
});
