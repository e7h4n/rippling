import { test, expect } from './fixtures';

test('hello', async ({ page }) => {
  const consoleMessagePromise = page.waitForEvent('console', {
    predicate: (msg) => msg.type() === 'warning' && msg.text().includes('[RIPPLING] Interceptor injected'),
  });
  await page.goto(`/e2e.test.html`);

  // Wait for Rippling interceptor to be injected
  const consoleMessage = await consoleMessagePromise;
  expect(consoleMessage.text()).toContain('DO NOT USE THIS IN PRODUCTION');

  await expect(page.getByText('1')).not.toBeVisible();
  const button = page.getByText('Increment');
  await button.click();
  await expect(page.getByText('1')).toBeVisible();
});
