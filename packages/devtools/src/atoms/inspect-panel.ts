import { $computed, $func, $value, GLOBAL_RIPPLING_INTERCEPED_KEY } from 'rippling';
import { delay, interval } from 'signal-timers';

const internalReload$ = $value(0);
const reload$ = $func(({ set }) => {
  set(internalReload$, (x) => x + 1);
});

const devToolsTabId$ = $computed((get) => {
  get(internalReload$);
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

const lastPanel$ = $value<chrome.devtools.panels.ExtensionPanel | null>(null);
const lastPanelWindow$ = $value<Window | null>(null);
const createDevtoolsPanel$ = $func(async ({ get, set }, signal: AbortSignal) => {
  const lastPanel = get(lastPanel$);
  if (lastPanel) {
    return lastPanel;
  }

  const panel = await new Promise<chrome.devtools.panels.ExtensionPanel>((resolve) => {
    chrome.devtools.panels.create('Rippling', '', 'panel.html', (createdPanel) => {
      resolve(createdPanel);
    });
  });
  signal.throwIfAborted();

  set(lastPanel$, panel);
  return panel;
});

const ripplingLoaded$ = $computed(async (get) => {
  get(internalReload$);

  for (let i = 0; i < 10; i++) {
    const loaded = await new Promise((resolve) => {
      chrome.devtools.inspectedWindow.eval('window.' + GLOBAL_RIPPLING_INTERCEPED_KEY, {}, function (result) {
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

const setupDevtoolsPort$ = $func(({ set }, panelWindow: Window, signal: AbortSignal) => {
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

export const initialize$ = $func(async ({ set, get }, signal: AbortSignal) => {
  set(reload$);

  const loaded = await get(ripplingLoaded$);
  if (!loaded || signal.aborted) {
    return;
  }

  const panel = await set(createDevtoolsPanel$, signal);

  let controller: AbortController | null = null;
  const onPanelShow = (panelWindow: Window) => {
    set(lastPanelWindow$, panelWindow);
    if (signal.aborted) {
      return;
    }
    controller?.abort();
    controller = new AbortController();
    set(setupDevtoolsPort$, panelWindow, AbortSignal.any([signal, controller.signal]));
  };
  const lastPanelWindow = get(lastPanelWindow$);
  if (lastPanelWindow) {
    onPanelShow(lastPanelWindow);
  }

  const onPanelHide = () => {
    controller?.abort();
    controller = null;
  };

  panel.onShown.addListener(onPanelShow);
  panel.onHidden.addListener(onPanelHide);
  signal.addEventListener('abort', () => {
    panel.onShown.removeListener(onPanelShow);
    panel.onHidden.removeListener(onPanelHide);
  });
});
