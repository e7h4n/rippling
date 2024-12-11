import type { DevToolsHookMessage } from './types';

const historyMessages: DevToolsHookMessage[] = [];
let port: chrome.runtime.Port | undefined;
chrome.runtime.onConnect.addListener(function (_port) {
  console.debug('[RIPPLING-DEVTOOLS] connected');
  port = _port;
  for (const message of historyMessages) {
    port.postMessage(message);
  }
  historyMessages.length = 0;
});

window.addEventListener('message', function onMessage({ data, source }) {
  if (source !== window || !data || !('source' in data)) {
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
