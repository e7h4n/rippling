import { expect, describe } from 'vitest';
import { $value, createDebugStore } from 'rippling';
import { screen } from '@testing-library/react';
import { panelTest } from './context';

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
});
