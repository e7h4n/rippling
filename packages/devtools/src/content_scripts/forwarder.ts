import type { DevToolsHookMessage } from 'rippling';

/**
 * Setup a tunnel to forward store messages from Inspected Tab Window to DevTools Port
 * @param targetWindow
 */
export function setupDevtoolsMessageListener(targetWindow: Window, signal?: AbortSignal) {
  const historyMessages: DevToolsHookMessage[] = [];
  let port: chrome.runtime.Port | undefined;

  const onConnect = (_port: chrome.runtime.Port) => {
    console.warn('[RIPPLING] Devtools connected');
    port = _port;
    for (const message of historyMessages) {
      port.postMessage(message);
    }
    historyMessages.length = 0;
  };

  chrome.runtime.onConnect.addListener(onConnect);
  signal?.addEventListener('abort', () => {
    chrome.runtime.onConnect.removeListener(onConnect);
  });

  targetWindow.addEventListener(
    'message',
    function onMessage({ data }) {
      if (signal?.aborted) {
        return;
      }

      if (
        !data ||
        typeof data !== 'object' ||
        !('source' in data) ||
        (data as unknown as { source: string }).source !== 'rippling-store'
      ) {
        return;
      }

      const message = data as DevToolsHookMessage;

      if (!port) {
        historyMessages.push(message);
        return;
      }

      port.postMessage(message);
    },
    { signal },
  );
}
