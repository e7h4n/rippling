import { $computed, $func, $value } from 'rippling';
import { delay } from 'signal-timers';
import { transaction } from 'signal-transaction';

const refresh$ = $value(0);

const devToolsTabId = $computed((get) => {
  get(refresh$);
  return chrome.devtools.inspectedWindow.tabId;
});

const connectPort$ = $func(({ get }, signal: AbortSignal) => {
  const port = chrome.runtime.connect({
    name: String(get(devToolsTabId)),
  });

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

const reload$ = $func(({ set }, controller: AbortController) => {
  if (controller.signal.aborted) {
    return;
  }
  controller.abort();
  void set(initialize$);
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

export const initialize$ = $func(async ({ set, get }) => {
  const controller = set(createController$);
  const signal = controller.signal;
  const { act } = transaction(signal);

  const reload = () => {
    set(reload$, controller);
  };

  act(() => {
    chrome.devtools.network.onNavigated.addListener(reload);
    return () => {
      chrome.devtools.network.onNavigated.removeListener(reload);
    };
  });

  const loaded = await get(ripplingLoaded$);
  if (!loaded || signal.aborted) {
    return;
  }

  const [panel, port] = await Promise.all([set(createPanel$, signal), set(connectPort$, signal)]);

  act(() => {
    port.onDisconnect.addListener(reload);
    return () => {
      port.onDisconnect.removeListener(reload);
    };
  });

  console.log('panel', panel);
  console.log('port', port);
});
