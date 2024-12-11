import { test, expect } from './fixtures';

test.skip('hello', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/panel.html`);

  const bodyText = await page.getByText('Store 1').textContent();
  expect(bodyText).toBe('Store 1');
});

test.skip('send message to extension', async ({ page, extensionId }) => {
  const messages: string[] = [];

  await page.goto(`chrome-extension://${extensionId}/dummy.html`);

  page.on('console', (msg) => messages.push(msg.text()));
  await page.waitForTimeout(1000);
  expect(messages).toContain('hello');
});
