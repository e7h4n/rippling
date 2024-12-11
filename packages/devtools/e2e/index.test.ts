import { type BrowserContext, chromium } from 'playwright';
import { test, expect } from '@playwright/test';

let browser: BrowserContext | undefined;
const EXTENSION_ID = 'nnocgligbafbkepiddmidebakcheiihc';
const EXTENSION_PATH = 'packages/devtools/dist';

test.skip('hello', async () => {
  browser = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    args: [`--disable-extensions-except=${EXTENSION_PATH}`, `--load-extension=${EXTENSION_PATH}`],
  });
  const page = await browser.newPage();
  await page.goto(`chrome-extension://${EXTENSION_ID}/panel.html`);

  const bodyText = await page.getByText('Store 1').textContent();
  expect(bodyText).toBe('Store 1');

  expect(true).toBe(true);

  await browser.close();
});
