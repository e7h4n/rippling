import { $computed, $func, $value, createStore } from 'rippling';
import { delay, interval } from 'signal-timers';
import { transaction } from 'signal-transaction';

const refresh$ = $value(0);

const devToolsTabId$ = $computed((get) => {
  get(refresh$);
  return chrome.devtools.inspectedWindow.tabId;
});

const connectPort$ = $func(({ get }, signal: AbortSignal) => {
  const port = chrome.tabs.connect(get(devToolsTabId$));

  interval(
    () => {
      port.postMessage('heartbeat');
    },
    15000,
    { signal },
  );

  signal.addEventListener('abort', () => {
    port.disconnect();
  });

  return port;
});

const createPanel$ = $func(async (_, signal: AbortSignal) => {
  const panel = await new Promise<chrome.devtools.panels.ExtensionPanel>((resolve) => {
    chrome.devtools.panels.create('Rippling', '', 'panel.html', (createdPanel) => {
      resolve(createdPanel);
    });
  });
  signal.throwIfAborted();

  return panel;
});

const ripplingLoaded$ = $computed(async (get) => {
  get(refresh$);

  for (let i = 0; i < 10; i++) {
    const loaded = await new Promise((resolve) => {
      chrome.devtools.inspectedWindow.eval('window.__RIPPLING_DEVTOOLS_GLOBAL_HOOK__', function (result) {
        resolve(result);
      });
    });
    if (loaded) {
      return true;
    }
    await delay(100);
  }
  return false;
});

const createController$ = $func(() => {
  const controller = new AbortController();
  window.addEventListener(
    'beforeunload',
    () => {
      controller.abort();
    },
    {
      signal: controller.signal,
    },
  );

  return controller;
});

const setupPanel$ = $func(({ set }, panelWindow: Window, signal: AbortSignal) => {
  const port = set(connectPort$, signal);
  const onMessage = (message: unknown) => {
    panelWindow.postMessage(message);
  };
  port.onMessage.addListener(onMessage);
  signal.addEventListener('abort', () => {
    port.onMessage.removeListener(onMessage);
    port.disconnect();
  });
});

export const initialize$ = $func(async ({ set, get }) => {
  const controller = set(createController$);
  const signal = controller.signal;
  const { act } = transaction(signal);

  const onNavigate = () => {
    if (controller.signal.aborted) {
      return;
    }
    set(refresh$, (x) => x + 1);
    controller.abort();
    void set(initialize$);
  };

  act(() => {
    chrome.devtools.network.onNavigated.addListener(onNavigate);
    return () => {
      chrome.devtools.network.onNavigated.removeListener(onNavigate);
    };
  });

  const loaded = await get(ripplingLoaded$);
  if (!loaded || signal.aborted) {
    return;
  }

  const panel = await set(createPanel$, signal);
  act(() => {
    let controller: AbortController | null = null;
    const onPanelShow = (panelWindow: Window) => {
      if (signal.aborted) {
        return;
      }
      controller?.abort();
      controller = new AbortController();
      set(setupPanel$, panelWindow, AbortSignal.any([signal, controller.signal]));
    };
    const onPanelHide = () => {
      controller?.abort();
      controller = null;
    };

    panel.onShown.addListener(onPanelShow);
    panel.onHidden.addListener(onPanelHide);
    return () => {
      panel.onShown.removeListener(onPanelShow);
      panel.onHidden.removeListener(onPanelHide);
    };
  });
});

const store = createStore();
void store.set(initialize$);
