import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { test as setup } from '@playwright/test';
import { clerk, clerkSetup } from '@clerk/testing/playwright';
import { waitForLabReady } from './helpers/lab';

const authFile = path.resolve(process.cwd(), 'playwright/.clerk/user.json');
const defaultEmail = 'lab-playwright+clerk_test@example.com';

setup('configure Clerk Playwright helpers', async () => {
  await clerkSetup({
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY ?? process.env.VITE_CLERK_PUBLISHABLE_KEY,
  });
});

setup('authenticate durable Playwright user', async ({ page }) => {
  const email = process.env.PLAYWRIGHT_TEST_EMAIL ?? defaultEmail;

  fs.mkdirSync(path.dirname(authFile), { recursive: true });

  await page.goto('/login');
  await clerk.loaded({ page });
  await clerk.signIn({
    page,
    emailAddress: email,
  });
  await page.goto('/');
  await waitForLabReady(page);
  await page.context().storageState({ path: authFile });
});
