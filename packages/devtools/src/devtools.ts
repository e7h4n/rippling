import { $func, createStore } from 'rippling';
import { initialize$ as initializeInspectPanel$ } from './atoms/inspect-panel';

const createDevtoolsRootSignal$ = $func(() => {
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

  const onNavigate = () => {
    if (controller.signal.aborted) {
      return;
    }
    controller.abort();
  };

  chrome.devtools.network.onNavigated.addListener(onNavigate);
  controller.signal.addEventListener('abort', () => {
    chrome.devtools.network.onNavigated.removeListener(onNavigate);
  });

  return controller.signal;
});

const store = createStore();

const init = () => {
  const signal = store.set(createDevtoolsRootSignal$);
  void store.set(initializeInspectPanel$, signal);
};

chrome.devtools.network.onNavigated.addListener(init);
init();
