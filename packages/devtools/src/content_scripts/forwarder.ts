import type { DevToolsHookMessage } from '../types';

/**
 * Setup a tunnel to forward store messages from Inspected Tab Window to DevTools Port
 * @param targetWindow
 */
export function setupDevtoolsMessageListener(targetWindow: Window) {
  const historyMessages: DevToolsHookMessage[] = [];
  let port: chrome.runtime.Port | undefined;

  chrome.runtime.onConnect.addListener(function (_port) {
    console.warn('[RIPPLING] Devtools connected');
    port = _port;
    for (const message of historyMessages) {
      port.postMessage(message);
    }
    historyMessages.length = 0;
  });

  targetWindow.addEventListener('message', function onMessage({ data }) {
    if (!data || !('source' in data)) {
      return;
    }

    const message = data as DevToolsHookMessage;
    if (message.source !== 'rippling-store-inspector') {
      return;
    }

    if (!port) {
      historyMessages.push(message);
      return;
    }

    port.postMessage(message);
  });
}
