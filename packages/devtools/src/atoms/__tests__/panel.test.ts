import { expect } from 'vitest';
import { $computed, $func, $value } from 'rippling';
import { screen } from '@testing-library/react';
import { delay } from 'signal-timers';
import { panelTest } from './context';
import { selectedFilter$, storeEvents$, toggleFilter$ } from '../events';

panelTest('should got message', async ({ panel }) => {
  const base$ = $value(0);
  panel.testStore.set(base$, 1);

  await delay(10);
  const eventRows = await screen.findAllByTestId('event-row');
  expect(eventRows).toHaveLength(1);
});

panelTest('mixup all events', async ({ panel }) => {
  const base$ = $value(0, {
    debugLabel: 'base$',
  });
  const double$ = $computed((get) => get(base$) * 2, {
    debugLabel: 'double$',
  });
  const result$ = $value(0, {
    debugLabel: 'result$',
  });

  const unsub = panel.testStore.sub(
    double$,
    $func(
      ({ get, set }) => {
        set(result$, get(double$) * 10);
      },
      {
        debugLabel: 'callback$',
      },
    ),
  );

  panel.testStore.set(base$, 100);
  unsub();

  panel.panelStore.set(toggleFilter$, 'get');
  panel.panelStore.set(toggleFilter$, 'unsub');
  panel.panelStore.set(toggleFilter$, 'mount');
  panel.panelStore.set(toggleFilter$, 'unmount');
  expect(panel.panelStore.get(selectedFilter$)).toEqual(
    new Set(['set', 'sub', 'notify', 'get', 'unsub', 'mount', 'unmount']),
  );

  const eventRows = await screen.findAllByTestId('event-row');

  expect(eventRows).toHaveLength(12); // magic number to verify the events
});

panelTest('error computed', async ({ panel }) => {
  const error$ = $computed(
    () => {
      throw new Error('test');
    },
    {
      debugLabel: 'error$',
    },
  );

  panel.panelStore.set(toggleFilter$, 'get');
  expect(panel.panelStore.get(selectedFilter$)).toContain('get');

  expect(() => panel.testStore.get(error$)).toThrow();
  await screen.findAllByTestId('event-row');
  expect(panel.panelStore.get(storeEvents$).map((event$) => panel.panelStore.get(event$))).toEqual([
    {
      data: {
        beginTime: expect.any(Number) as number,
        endTime: expect.any(Number) as number,
        error: 'test',
        state: 'hasError',
      },
      eventId: expect.any(Number) as number,
      targetAtom: expect.stringContaining('error$') as string,
      type: 'get',
    },
  ]);
});
