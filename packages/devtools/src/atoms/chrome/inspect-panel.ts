import { computed, command, state, GLOBAL_CCSTATE_INTERCEPED_KEY } from 'ccstate';
import { interval } from 'signal-timers';

const internalReload$ = state(0);
const reload$ = command(({ set }) => {
  set(internalReload$, (x) => x + 1);
});

const inspectedTabId$ = computed((get) => {
  get(internalReload$);
  return chrome.devtools.inspectedWindow.tabId;
});

const connectPort$ = command(({ get }, signal: AbortSignal) => {
  const port = chrome.tabs.connect(get(inspectedTabId$));

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

const lastPanel$ = state<chrome.devtools.panels.ExtensionPanel | null>(null);
const lastPanelWindow$ = state<Window | null>(null);
const createDevtoolsPanel$ = command(async ({ get, set }, signal: AbortSignal) => {
  const lastPanel = get(lastPanel$);
  if (lastPanel) {
    return lastPanel;
  }

  const panel = await new Promise<chrome.devtools.panels.ExtensionPanel>((resolve) => {
    chrome.devtools.panels.create('CCState', '', 'panel.html', (createdPanel) => {
      resolve(createdPanel);
    });
  });
  signal.throwIfAborted();

  set(lastPanel$, panel);
  return panel;
});

const ccstateLoaded$ = computed(async (get) => {
  get(internalReload$);

  for (let i = 0; i < 60; i++) {
    const loaded = await new Promise((resolve) => {
      chrome.devtools.inspectedWindow.eval('window.' + GLOBAL_CCSTATE_INTERCEPED_KEY, {}, function (result) {
        resolve(result);
      });
    });
    if (loaded) {
      return true;
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  }
  return false;
});

const setupDevtoolsPort$ = command(({ set, get }, signal: AbortSignal) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const panelWindow = get(lastPanelWindow$)!;

  panelWindow.postMessage('knockknock');
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

export const initialize$ = command(async ({ set, get }, signal: AbortSignal) => {
  set(reload$);

  const loaded = await get(ccstateLoaded$);
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
    if (controller) {
      controller.abort();
    }
    controller = new AbortController();
    set(setupDevtoolsPort$, AbortSignal.any([signal, controller.signal]));
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
