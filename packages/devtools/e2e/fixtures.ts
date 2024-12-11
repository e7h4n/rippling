import { test as base, chromium, type BrowserContext } from '@playwright/test';

const EXTENSION_ID = 'nnocgligbafbkepiddmidebakcheiihc';
const EXTENSION_PATH = 'packages/devtools/dist';

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  context: async ({}, use) => {
    // 注意这里使用了正确的解构语法 { }
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      args: [`--disable-extensions-except=${EXTENSION_PATH}`, `--load-extension=${EXTENSION_PATH}`],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({}, use) => {
    // 这里也需要使用解构语法
    await use(EXTENSION_ID);
  },
});
export const expect = test.expect;
