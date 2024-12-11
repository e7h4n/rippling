import { $value, createDebugStore, setupDevtoolsInterceptor, StoreProvider, useGet, useSet } from 'rippling';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const interceptor = setupDevtoolsInterceptor();
const store = createDebugStore(interceptor);

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <StoreProvider value={store}>
        <App />
      </StoreProvider>
    </StrictMode>,
  );
}

const count$ = $value(0);
function App() {
  const count = useGet(count$);
  const setCount = useSet(count$);

  return (
    <div>
      <button
        onClick={() => {
          setCount(count + 1);
        }}
      >
        Increment
      </button>
      <p>Count: {count}</p>
    </div>
  );
}
