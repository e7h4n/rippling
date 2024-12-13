import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  forbidOnly: !!process.env.CI,
  webServer: {
    command: 'pnpm vite --config vite.e2e.config.ts',
    timeout: 10 * 1000,
    url: 'http://localhost:5173/e2e.test.html',
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
  },
  use: {
    baseURL: 'http://localhost:5173',
  },
});
