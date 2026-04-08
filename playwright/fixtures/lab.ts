import type { Page } from '@playwright/test';
import { test as base } from '@playwright/test';
import { resetLabData, waitForLabReady } from '../helpers/lab';

type LabFixtures = {
  authedPage: Page;
  cleanLabPage: Page;
};

export const test = base.extend<LabFixtures>({
  authedPage: async ({ page }, runFixture) => {
    await page.goto('/');
    await waitForLabReady(page);
    await runFixture(page);
  },
  cleanLabPage: async ({ authedPage }, runFixture) => {
    await resetLabData(authedPage);
    await authedPage.goto('/');
    await waitForLabReady(authedPage);
    await runFixture(authedPage);
  },
});

export { expect } from '@playwright/test';
