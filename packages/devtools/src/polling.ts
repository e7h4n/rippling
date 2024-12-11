class CouldNotFindRipplingOnThePageError extends Error {
  constructor() {
    super("Could not find Rippling, or it hasn't been loaded yet");

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CouldNotFindRipplingOnThePageError);
    }

    this.name = 'CouldNotFindRipplingOnThePageError';
  }
}

export function startRipplingPolling(
  onRipplingFound: () => void,
  attemptsThreshold: number,
  onCouldNotFindRipplingAfterReachingAttemptsThreshold: () => void,
) {
  let status = 'idle';

  function abort() {
    status = 'aborted';
  }

  // This function will call onSuccess only if Rippling was found and polling is not aborted, onError will be called for every other case
  function checkIfRipplingPresentInInspectedWindow(onSuccess: () => void, onError: (error: string | Error) => void) {
    chrome.devtools.inspectedWindow.eval(
      'window.__RIPPLING_DEVTOOLS_GLOBAL_HOOK__',
      (pageHasRippling, exceptionInfo) => {
        if (status === 'aborted') {
          onError('Polling was aborted, user probably navigated to the other page');
          return;
        }

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (exceptionInfo) {
          const { code, description, isError, isException, value } = exceptionInfo;

          if (isException) {
            onError(`Received error while checking if rippling has loaded: ${value}`);
            return;
          }

          if (isError) {
            onError(`Received error with code ${code} while checking if rippling has loaded: "${description}"`);
            return;
          }
        }

        if (pageHasRippling) {
          onSuccess();
          return;
        }

        onError(new CouldNotFindRipplingOnThePageError());
      },
    );
  }

  // Just a Promise wrapper around `checkIfRipplingPresentInInspectedWindow`
  // returns a Promise, which will resolve only if Rippling has been found on the page
  function poll(attempt: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      checkIfRipplingPresentInInspectedWindow(
        () => {
          resolve();
        },
        (error) => {
          reject(error as Error);
        },
      );
    }).catch((error: unknown) => {
      if (error instanceof CouldNotFindRipplingOnThePageError) {
        if (attempt === attemptsThreshold) {
          onCouldNotFindRipplingAfterReachingAttemptsThreshold();
        }

        // Start next attempt in 0.5s
        return new Promise((r) => setTimeout(r, 500)).then(() => poll(attempt + 1));
      }

      // Propagating every other Error
      throw error;
    });
  }

  poll(1)
    .then(onRipplingFound)
    .catch((error: unknown) => {
      // Log propagated errors only if polling was not aborted
      // Some errors are expected when user performs in-tab navigation and `.eval()` is still being executed
      if (status === 'aborted') {
        return;
      }

      console.error(error);
    });

  return { abort };
}
