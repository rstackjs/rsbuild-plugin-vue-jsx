import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRsbuild, loadConfig } from '@rsbuild/core';
import { expect, test } from '@rstest/playwright';
import { editFile as editSharedFile, waitFor } from '@rstackjs/test-utils';
import { chromium, type Browser, type Page } from 'playwright';
import { getRandomPort } from '@rstackjs/test-utils';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test('should render', async ({ page }) => {
  const rsbuild = await createRsbuild({
    cwd: __dirname,
    rsbuildConfig: {
      ...(await loadConfig({ cwd: __dirname })).content,
      server: {
        port: await getRandomPort(),
      },
    },
  });

  const { server, urls } = await rsbuild.startDevServer();

  await page.goto(urls[0]);

  await expect(page.locator('.named')).toHaveText('named 0');
  await expect(page.locator('.named-specifier')).toHaveText(
    'named specifier 1',
  );
  await expect(page.locator('.default')).toHaveText('default 2');
  await expect(page.locator('.default-tsx')).toHaveText('default tsx 3');
  await expect(page.locator('.script')).toHaveText('script 4');
  await expect(page.locator('.ts-import')).toHaveText('success');

  await server.close();
});

test('should update', async ({ page }) => {
  const rsbuild = await createRsbuild({
    cwd: __dirname,
    rsbuildConfig: {
      ...(await loadConfig({ cwd: __dirname })).content,
      server: {
        port: await getRandomPort(),
      },
    },
  });

  const { server, urls } = await rsbuild.startDevServer();

  await page.goto(urls[0]);

  await page.locator('.named').click();
  await expect(page.locator('.named')).toHaveText('named 1');

  await page.locator('.named-specifier').click();
  await expect(page.locator('.named-specifier')).toHaveText(
    'named specifier 2',
  );

  await page.locator('.default').click();
  await expect(page.locator('.default')).toHaveText('default 3');

  await page.locator('.default-tsx').click();
  await expect(page.locator('.default-tsx')).toHaveText('default tsx 4');

  await page.locator('.script').click();
  await expect(page.locator('.script')).toHaveText('script 5');

  await server.close();
});

test.describe('vue jsx hmr', () => {
  let server: {
    close: () => Promise<void>;
  };
  let browser: Browser;
  let page: Page;

  test.beforeAll(async () => {
    browser = await chromium.launch();
    page = await browser.newPage();
    const rsbuild = await createRsbuild({
      cwd: __dirname,
      rsbuildConfig: {
        ...(await loadConfig({ cwd: __dirname })).content,
        server: {
          port: await getRandomPort(),
        },
      },
    });

    const result = await rsbuild.startDevServer();
    server = result.server;

    await page.goto(result.urls[0]);
  });

  test.afterAll(async () => {
    // reset files
    await editFile('Comps.jsx', (code) =>
      code.replace('named updated {count', 'named {count'),
    );
    await editFile('Comps.jsx', (code) =>
      code.replace('named specifier updated {count', 'named specifier {count'),
    );
    await editFile('Comps.jsx', (code) =>
      code.replace('default updated {count', 'default {count'),
    );
    await editFile('Comp.tsx', (code) =>
      code.replace('default tsx updated {count', 'default tsx {count'),
    );
    await editFile('setup-syntax-jsx.vue', (code) =>
      code.replace('let count = ref(1000)', 'let count = ref(100)'),
    );

    await page.close();
    await browser.close();
    await server.close();
  });

  test('hmr: named export', async () => {
    await page.locator('.named').click();
    await expect(page.locator('.named')).toHaveText('named 1');
    await page.locator('.named-specifier').click();
    await expect(page.locator('.named-specifier')).toHaveText(
      'named specifier 2',
    );
    await page.locator('.default').click();
    await expect(page.locator('.default')).toHaveText('default 3');
    await page.locator('.default-tsx').click();
    await expect(page.locator('.default-tsx')).toHaveText('default tsx 4');

    await editFile('Comps.jsx', (code) =>
      code.replace('named {count', 'named updated {count'),
    );
    await untilUpdated(() => page.textContent('.named'), 'named updated 0');

    // affect all components in same file
    await expect(page.locator('.named-specifier')).toHaveText(
      'named specifier 1',
    );
    await expect(page.locator('.default')).toHaveText('default 2');
    // should not affect other components from different file
    await expect(page.locator('.default-tsx')).toHaveText('default tsx 4');
  });

  test('hmr: named export via specifier', async () => {
    await editFile('Comps.jsx', (code) =>
      code.replace('named specifier {count', 'named specifier updated {count'),
    );
    await untilUpdated(
      () => page.textContent('.named-specifier'),
      'named specifier updated 1',
    );

    // affect all components in same file
    await expect(page.locator('.default')).toHaveText('default 2');
    // should not affect other components on the page
    await expect(page.locator('.default-tsx')).toHaveText('default tsx 4');
  });

  test('hmr: default export', async () => {
    await editFile('Comps.jsx', (code) =>
      code.replace('default {count', 'default updated {count'),
    );
    await untilUpdated(() => page.textContent('.default'), 'default updated 2');

    // should not affect other components on the page
    await expect(page.locator('.default-tsx')).toHaveText('default tsx 4');
  });

  test('hmr: default Default export', async () => {
    await page.locator('.named').click();
    await expect(page.locator('.named')).toHaveText('named updated 1');

    await editFile('Comp.tsx', (code) =>
      code.replace('default tsx {count', 'default tsx updated {count'),
    );
    await untilUpdated(
      () => page.textContent('.default-tsx'),
      'default tsx updated 3',
    );

    // should not affect other components on the page
    await expect(page.locator('.named')).toHaveText('named updated 1');
  });

  // not pass
  // see https://github.com/web-infra-dev/rsbuild/pull/2018
  test.skip('hmr: vue script lang=jsx', async () => {
    await page.locator('.script').click();
    await expect(page.locator('.script')).toHaveText('script 5');

    await editFile('Script.vue', (code) =>
      code.replace('script {count', 'script updated {count'),
    );

    await untilUpdated(() => page.textContent('.script'), 'script updated 4');

    // reset code
    await editFile('Script.vue', (code) =>
      code.replace('script updated {count', 'script {count'),
    );
  });

  // not pass
  test.skip('hmr: script in .vue', async () => {
    await page.locator('.src-import').click();
    await expect(page.locator('.src-import')).toHaveText('src import 6');

    await editFile('Script.vue', (code) =>
      code.replace('script {count', 'script updated {count'),
    );
    await untilUpdated(() => page.textContent('.script'), 'script updated 4');

    await expect(page.locator('.src-import')).toHaveText('src import 6');

    // reset code
    await editFile('Script.vue', (code) =>
      code.replace('script updated {count', 'script {count'),
    );
  });

  // not pass
  test.skip('hmr: src import in .vue', async () => {
    await page.locator('.script').click();
    await expect(page.locator('.script')).toHaveText('script 5');

    await editFile('SrcImport.jsx', (code) =>
      code.replace('src import {count', 'src import updated {count'),
    );

    await untilUpdated(
      () => page.textContent('.src-import'),
      'src import updated 5',
    );

    await expect(page.locator('.script')).toHaveText('script 5');

    // reset code
    await editFile('SrcImport.jsx', (code) =>
      code.replace('src import updated {count', 'src import {count'),
    );
  });

  test('hmr: setup jsx in .vue', async () => {
    await editFile('setup-syntax-jsx.vue', (code) =>
      code.replace('let count = ref(100)', 'let count = ref(1000)'),
    );

    await untilUpdated(() => page.textContent('.setup-jsx'), '1000');
  });
});

function editFile(
  filename: string,
  replacer: (str: string) => string,
): Promise<void> {
  const fileName = path.join(__dirname, 'src', filename);
  return editSharedFile(fileName, replacer);
}

async function untilUpdated(
  poll: () => Promise<string | null>,
  expected: string,
): Promise<void> {
  let actual = '';
  await waitFor(
    async () => {
      actual = (await poll()) ?? '';
      return actual.includes(expected);
    },
    { interval: 50, timeout: 2500 },
  );
  expect(actual).toMatch(expected);
}
