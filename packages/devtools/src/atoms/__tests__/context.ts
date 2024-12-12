import { vi, test } from 'vitest';
import { initialize$ } from '../inspect-panel';
import { createStore, EventInterceptor, setupDevtoolsInterceptor, type Store } from 'rippling';
import { setupStore, setupUI } from '../../panel';
import { render, cleanup } from '@testing-library/react';
import { Window as HappyDomWindow } from 'happy-dom';
import { setupDevtoolsMessageListener } from '../../content_scripts/forwarder';

function createMockedEvent<Args extends unknown[], T extends (...args: Args) => void>(): chrome.events.Event<T> & {
  sendEvent: (...args: Args) => void;
} {
  const listeners: T[] = [];
  return {
    addListener: (listener: T) => {
      listeners.push(listener);
    },
    removeListener: (listener: T) => {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    },
    hasListeners: () => listeners.length > 0,
    hasListener: (listener: T) => listeners.includes(listener),
    getRules: vi.fn(),
    removeRules: vi.fn(),
    addRules: vi.fn(),
    sendEvent: (...args: Args) => {
      for (const listener of listeners) {
        listener(...args);
      }
    },
  };
}

function createMockedPanel(): chrome.devtools.panels.ExtensionPanel & {
  setShown: () => void;
  setHidden: () => void;
  store: Store;
} {
  const onShow = createMockedEvent<[Window], (win: Window) => void>();

  const onHide = createMockedEvent();

  const onSearch = createMockedEvent();

  const panelWindow = new HappyDomWindow() as unknown as Window;
  const store = createStore();
  setupUI(render, store);
  setupStore(store, panelWindow);

  return {
    setShown: () => {
      onShow.sendEvent(panelWindow);
    },
    setHidden: onHide.sendEvent,
    onShown: onShow,
    onHidden: onHide,
    createStatusBarButton: vi.fn(),
    onSearch,
    store,
  };
}

function createMockedPort(): chrome.runtime.Port {
  const onDisconnect = createMockedEvent();
  const onMessage = createMockedEvent();

  return {
    postMessage: onMessage.sendEvent,
    onMessage: onMessage,
    disconnect: onDisconnect.sendEvent,
    onDisconnect: onDisconnect,
    name: 'mockedPort',
  } satisfies chrome.runtime.Port;
}

function createDevtoolsContext() {
  const mockedPanel = createMockedPanel();

  vi.spyOn(chrome.devtools.inspectedWindow, 'eval').mockImplementation((code, options, callback) => {
    if (!callback) {
      return;
    }

    callback(true, {
      isError: false,
      code: '',
      description: '',
      details: [],
      isException: false,
      value: '',
    });
  });

  vi.spyOn(chrome.devtools.panels, 'create').mockImplementation((_title, _icon, _url, callback) => {
    if (!callback) {
      return;
    }

    callback(mockedPanel);
  });

  const port = createMockedPort();
  vi.spyOn(chrome.tabs, 'connect').mockReturnValue(port);
  vi.spyOn(chrome.runtime.onConnect, 'addListener').mockImplementation((listener) => {
    listener(port);
  });

  return {
    showPanel: () => {
      mockedPanel.setShown();
    },
    panellStore: mockedPanel.store,
  };
}

export const panelTest = test.extend<{
  panel: {
    show: () => void;
    panelStore: Store;
    devToolsStore: Store;
    interceptor: EventInterceptor;
  };
}>({
  panel: async ({}, use) => {
    const controller = new AbortController();
    const context = createDevtoolsContext();

    const devToolsStore = createStore();
    await devToolsStore.set(initialize$, controller.signal);

    const inspectedTabWindow = new HappyDomWindow() as unknown as Window;
    const interceptor = setupDevtoolsInterceptor(inspectedTabWindow);
    setupDevtoolsMessageListener(inspectedTabWindow);

    await use({
      show: context.showPanel,
      panelStore: context.panellStore,
      devToolsStore,
      interceptor,
    });

    cleanup();
    controller.abort();
  },
});
