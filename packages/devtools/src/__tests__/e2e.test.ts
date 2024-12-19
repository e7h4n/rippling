import { expect, it } from 'vitest';
import { launch } from 'puppeteer';
import { createServer } from 'vite';
import { delay } from 'signal-timers';

const EXTENSION_PATH = 'packages/devtools/dist';

it.skipIf(!!process.env.CI)('test puppeteer', async () => {
  const server = await createServer({
    root: 'packages/devtools',
    configFile: 'packages/devtools/vite.e2e.config.ts',
  });
  const { config } = await server.listen();
  const pageUrl = `http://localhost:${String(config.server.port)}/e2e.test.html`;

  const browser = await launch({
    headless: true,
    devtools: true,
    userDataDir: '',
    args: [`--disable-extensions-except=${EXTENSION_PATH}`, `--load-extension=${EXTENSION_PATH}`],
  });

  const consoleMessages: string[] = [];
  const page = (await browser.pages())[0];
  page.on('console', (msg) => consoleMessages.push(msg.text()));

  await page.goto(pageUrl);

  // Wait for CCState interceptor to be injected
  await expect(page.$eval('body', (el) => el.textContent?.includes('1'))).resolves.toBe(false);
  const button = await page.$('button');
  await button?.click();
  await expect(page.$eval('body', (el) => el.textContent?.includes('1'))).resolves.toBe(true);

  const targets = browser.targets();
  const devtoolsPage = await targets
    .find((t) => {
      return String(t.type()) === 'other' && t.url().startsWith('devtools://');
    })
    ?.asPage();

  if (!devtoolsPage) {
    throw new Error('Devtools target not found');
  }
  devtoolsPage.on('console', (msg) => consoleMessages.push(msg.text()));

  await devtoolsPage.waitForNetworkIdle();
  let selected = false;
  let count = 0;
  while (!selected) {
    await delay(100);
    if (++count > 100) {
      throw new Error('Failed to select CCState panel');
    }
    await devtoolsPage.keyboard.down('MetaLeft');
    await devtoolsPage.keyboard.press(']');
    await devtoolsPage.keyboard.up('MetaLeft');

    selected =
      (await devtoolsPage.evaluate(() => {
        return document
          .querySelector('#-blink-dev-tools > div.widget.vbox.root-view > div > div > div > [slot=main]')
          ?.shadowRoot?.querySelector('.tabbed-pane-header-tab.selected')
          ?.textContent?.includes('CCState');
      })) ?? false;
  }

  await browser.close();
  await server.close();
});
