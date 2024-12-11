import './style.css';
import { createRoot } from 'react-dom/client';
import { Inspector } from './components/Inspector';
import { createStore, type PackedEventMessage, StoreProvider } from 'rippling';
import type { DevToolsHookMessage } from './types';
import { onEvent$ } from './atoms/events';

const main = document.createElement('div');
main.id = 'main';
document.body.appendChild(main);
const store = createStore();
const root = createRoot(main);
root.render(
  <StoreProvider value={store}>
    <Inspector />
  </StoreProvider>,
);

window.addEventListener('message', ({ data }: { data: DevToolsHookMessage }) => {
  if (!('source' in data) || data.source !== 'rippling-store-inspector') {
    return;
  }

  store.set(onEvent$, data.payload as PackedEventMessage);
});
