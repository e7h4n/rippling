import { Inspector } from './components/Inspector';
import { StoreProvider, type PackedEventMessage, type Store } from 'rippling';
import type { ReactNode } from 'react';
import type { DevToolsHookMessage } from './types';
import { onEvent$ } from './atoms/events';

export function setupUI(render: (children: ReactNode) => void, store: Store) {
  render(
    <>
      <StoreProvider value={store}>
        <Inspector />
      </StoreProvider>
    </>,
  );
}

export function setupStore(store: Store, window: Window) {
  window.addEventListener('message', ({ data }: { data: DevToolsHookMessage }) => {
    if (!('source' in data) || data.source !== 'rippling-store-inspector') {
      return;
    }

    store.set(onEvent$, data.payload as PackedEventMessage);
  });
}
