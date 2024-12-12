import { expect, describe } from 'vitest';
import { $func, $value, createDebugStore, type SetEventData } from 'rippling';
import { screen } from '@testing-library/react';
import { panelTest } from './context';
import { userEvent } from '@testing-library/user-event';
import { storeEvents$ } from '../events';
import { delay } from 'signal-timers';

describe('inspect panel', () => {
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
});

panelTest('should render unmount events ', async ({ panel }) => {
  const storeToTest = createDebugStore(panel.interceptor);

  panel.show();
  const base$ = $value(0);
  storeToTest.sub(
    base$,
    $func(() => void 0),
  )();

  const eventRows = await screen.findByText('UNMOUNT');
  expect(eventRows).toBeInTheDocument();
});
