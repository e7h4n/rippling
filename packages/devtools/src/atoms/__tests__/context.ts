import { test } from 'vitest';
import { createDebugStore, createStore, setupDevtoolsInterceptor, type Store } from 'ccstate';
import { cleanup, render } from '@testing-library/react';
import { setupStore, setupUI } from '../../panel';

export const panelTest = test.extend<{
  panel: {
    panelStore: Store;
    testStore: Store;
  };
}>({
  panel: async ({}, use) => {
    const controller = new AbortController();
    const interceptor = setupDevtoolsInterceptor(window);
    const storeToTest = createDebugStore(interceptor);

    const panelStore = createStore();
    setupUI(render, panelStore);
    setupStore(panelStore, window, controller.signal);

    await use({
      panelStore,
      testStore: storeToTest,
    });

    controller.abort();
    cleanup();
  },
});
