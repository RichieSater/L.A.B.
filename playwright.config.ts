import path from 'node:path';
import process from 'node:process';
import { config as loadEnv } from 'dotenv';
import { defineConfig } from '@playwright/test';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv();

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5173';
const { hostname, port } = new URL(baseURL);

if (!port) {
  throw new Error('PLAYWRIGHT_BASE_URL must include an explicit port.');
}

const authFile = path.resolve(process.cwd(), 'playwright/.clerk/user.json');

export default defineConfig({
  testDir: './playwright',
  outputDir: 'test-results/playwright',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL,
    browserName: 'chromium',
    viewport: { width: 1440, height: 900 },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: `npm run dev -- --host ${hostname} --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  projects: [
    {
      name: 'auth setup',
      testMatch: 'auth.setup.ts',
    },
    {
      name: 'chromium',
      testMatch: 'tests/**/*.e2e.ts',
      dependencies: ['auth setup'],
      use: {
        storageState: authFile,
      },
    },
  ],
});
