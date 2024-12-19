import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { initialize$ } from '../inspect-panel'; // 导入要测试的函数
import { createStore, GLOBAL_CCSTATE_INTERCEPED_KEY, type Store } from 'ccstate';

function createMockChrome() {
  const onShownCallbacks: ((panelWindow: Window) => void)[] = [];
  const onHiddenCallbacks: (() => void)[] = [];
  const portPostMessage = vi.fn();
  const windowPostMessage = vi.fn();
  const mockedWindow = {
    postMessage: windowPostMessage,
  };

  return {
    showPanel: () => {
      onShownCallbacks.forEach((cb) => {
        cb(mockedWindow as unknown as Window);
      });
    },
    hidePanel: () => {
      onHiddenCallbacks.forEach((cb) => {
        cb();
      });
    },
    devtools: {
      inspectedWindow: {
        tabId: 123,
        eval: vi.fn((expression, options, callback: (ret: boolean) => void) => {
          callback(true);
        }),
      },
      panels: {
        create: vi.fn(
          (
            title: string,
            icon: string,
            page: string,
            callback: (panel: chrome.devtools.panels.ExtensionPanel) => void,
          ) => {
            // Mock the create function to return a panel object
            callback({
              onShown: {
                addListener: vi.fn((cb: (panelWindow: Window) => void) => {
                  onShownCallbacks.push(cb);
                }),
                removeListener: vi.fn(),
              },
              onHidden: {
                addListener: vi.fn((cb: () => void) => {
                  onHiddenCallbacks.push(cb);
                }),
                removeListener: vi.fn(),
              },
            } as unknown as chrome.devtools.panels.ExtensionPanel);
          },
        ),
      },
    },
    tabs: {
      connect: vi.fn(() => {
        return {
          postMessage: portPostMessage,
          onMessage: {
            addListener: vi.fn(),
            removeListener: vi.fn(),
          },
          disconnect: vi.fn(),
        };
      }),
    },
    mocks: {
      portPostMessage,
      windowPostMessage,
    },
  };
}

let mockChrome: ReturnType<typeof createMockChrome>;
let store: Store;
let controller: AbortController;

beforeEach(() => {
  store = createStore();
  controller = new AbortController();
  mockChrome = createMockChrome();
  vi.stubGlobal('chrome', mockChrome);
});

afterEach(() => {
  vi.unstubAllGlobals();
  controller.abort();
});

describe('inspect-panel', () => {
  it('should initialize the devtools panel', async () => {
    // Call the initialize function
    await store.set(initialize$, controller.signal);

    // Check if the chrome.devtools.panels.create was called
    expect(mockChrome.devtools.panels.create).toHaveBeenCalledWith('CCState', '', 'panel.html', expect.any(Function));
  });

  it('should connect to the inspected tab', async () => {
    await store.set(initialize$, controller.signal);
    mockChrome.showPanel();

    // Check if the chrome.tabs.connect was called with the correct tabId
    expect(mockChrome.tabs.connect).toHaveBeenCalledWith(123);
  });

  it('should evaluate the global ccstate key', async () => {
    await store.set(initialize$, controller.signal);

    // Check if the eval function was called
    expect(mockChrome.devtools.inspectedWindow.eval).toHaveBeenCalledWith(
      'window.' + GLOBAL_CCSTATE_INTERCEPED_KEY,
      {},
      expect.any(Function),
    );
  });

  it('should reuse last panel and send knock when page reload', async () => {
    await store.set(initialize$, controller.signal);
    mockChrome.showPanel();
    controller.abort();
    controller = new AbortController();
    mockChrome.mocks.windowPostMessage.mockClear();
    await store.set(initialize$, controller.signal);
    expect(mockChrome.mocks.windowPostMessage).toHaveBeenCalledWith('knockknock');
  });

  it('will retry to check if ccstate is loaded', async () => {
    vi.useFakeTimers();
    mockChrome.devtools.inspectedWindow.eval.mockImplementation((expression, options, callback) => {
      callback(false);
    });
    const promise = store.set(initialize$, controller.signal);
    await vi.advanceTimersByTimeAsync(2000);
    mockChrome.devtools.inspectedWindow.eval.mockImplementation((expression, options, callback) => {
      callback(true);
    });
    await vi.runAllTimersAsync();
    mockChrome.showPanel();
    expect(mockChrome.mocks.windowPostMessage).toHaveBeenCalledWith('knockknock');
    await promise;
    vi.useRealTimers();
  });

  it('should send heartbeat every 15 seconds', async () => {
    vi.useFakeTimers();
    void store.set(initialize$, controller.signal);
    await vi.runAllTimersAsync();
    mockChrome.showPanel();
    await vi.advanceTimersByTimeAsync(15000);
    expect(mockChrome.mocks.portPostMessage).toHaveBeenCalledWith('heartbeat');
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('should not throw error when ccstate is not loaded', async () => {
    vi.useFakeTimers();
    mockChrome.devtools.inspectedWindow.eval.mockImplementation((expression, options, callback) => {
      callback(false);
    });
    const promise = store.set(initialize$, controller.signal);
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBeUndefined();

    vi.useRealTimers();
  });

  it('should not throw error when signal is aborted', async () => {
    await store.set(initialize$, controller.signal);

    controller.abort();
    expect(() => {
      mockChrome.showPanel();
    }).not.toThrow();
  });

  it('should reconnect to panel when panel is hide and show', async () => {
    await store.set(initialize$, controller.signal);
    mockChrome.showPanel();
    mockChrome.hidePanel();
    mockChrome.mocks.windowPostMessage.mockClear();
    mockChrome.showPanel();
    expect(mockChrome.mocks.windowPostMessage).toHaveBeenCalledWith('knockknock');
  });

  it('will abort last controller when panel show is accidently called', async () => {
    await store.set(initialize$, controller.signal);
    mockChrome.showPanel();
    mockChrome.mocks.windowPostMessage.mockClear();
    mockChrome.showPanel();
    expect(mockChrome.mocks.windowPostMessage).toHaveBeenCalledWith('knockknock');
  });
});
