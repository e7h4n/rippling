import '@testing-library/jest-dom/vitest';
import * as chrome from 'e7h4n-vitest-chrome';

Object.assign(global, chrome);

process.on('unhandledRejection', (reason) => {
  if (reason instanceof Error && reason.name === 'AbortError') {
    return;
  }
  throw reason;
});
