import { test, expect } from '../fixtures/lab';
import { getCompassTestAnswerRecord } from '../../src/testing/compass-test-data';
import {
  advanceCompassUntilScreen,
  assertCompassAuditClean,
  completeCompassFromScreen,
  createCompassSessionFromDashboard,
  openGoldenCompassFromModuleHub,
  resumeCompassFromPlanner,
  startCompassAudit,
} from '../helpers/compass';

function trackRequestBudget(page: Parameters<typeof startCompassAudit>[0]) {
  const compassPatchResponses: string[] = [];
  const appStatePutResponses: string[] = [];

  const handleResponse = (response: Awaited<ReturnType<typeof page.waitForResponse>>) => {
    const method = response.request().method();
    const url = response.url();

    if (method === 'PATCH' && /\/api\/compass-sessions\/[^/]+$/.test(url)) {
      compassPatchResponses.push(url);
    }

    if (method === 'PUT' && url.includes('/api/app-state')) {
      appStatePutResponses.push(url);
    }
  };

  page.on('response', handleResponse);

  return {
    compassPatchResponses,
    appStatePutResponses,
    reset() {
      compassPatchResponses.length = 0;
      appStatePutResponses.length = 0;
    },
    stop() {
      page.off('response', handleResponse);
    },
  };
}

async function runGoldenCompassRegression(page: Parameters<typeof startCompassAudit>[0]) {
  const audit = startCompassAudit(page);

  try {
    await openGoldenCompassFromModuleHub(page);
    const sessionId = await createCompassSessionFromDashboard(page);

    await advanceCompassUntilScreen(page, 'bonfire-write');

    const bonfireItems = JSON.parse(getCompassTestAnswerRecord('bonfire-write').items ?? '[]') as string[];
    const bonfireLabel = 'What is causing discomfort in your life right now?';
    const firstBonfireInput = page.getByRole('textbox', { name: `${bonfireLabel} 1` });
    await firstBonfireInput.click();
    await firstBonfireInput.pressSequentially(bonfireItems[0]);
    await expect(firstBonfireInput).toHaveValue(bonfireItems[0]);
    await expect(firstBonfireInput).toBeFocused();

    const addItemButton = page.getByRole('button', { name: `Add item for ${bonfireLabel}` });
    await addItemButton.scrollIntoViewIfNeeded();
    await addItemButton.click();
    const secondBonfireInput = page.getByRole('textbox', { name: `${bonfireLabel} 2` });
    await secondBonfireInput.pressSequentially(bonfireItems[1]);
    await expect(secondBonfireInput).toHaveValue(bonfireItems[1]);

    const continueFromBonfire = page.getByRole('button', { name: 'Continue' });
    await continueFromBonfire.scrollIntoViewIfNeeded();
    await continueFromBonfire.click();

    await advanceCompassUntilScreen(page, 'past-golden-moments', 'bonfire-release');

    await expect(page.getByText('3-5 items required')).toBeVisible();
    const goldenMomentsLabel = 'Golden moments from the last year';
    await page.getByRole('textbox', { name: `${goldenMomentsLabel} 1` }).fill('A calm, focused win');
    await page.getByRole('button', { name: `Add item for ${goldenMomentsLabel}` }).click();
    await page.getByRole('textbox', { name: `${goldenMomentsLabel} 2` }).fill('A body breakthrough');
    await page.getByRole('button', { name: `Add item for ${goldenMomentsLabel}` }).click();
    await page.getByRole('textbox', { name: `${goldenMomentsLabel} 3` }).fill('A great conversation');
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(
      page.getByRole('heading', { name: 'What are your three biggest challenges from the last year?' }),
    ).toBeVisible();
    await expect(page.getByText('0 of 3 items added')).toBeVisible();
    await page.getByRole('textbox', { name: 'What are your three biggest challenges from the last year? 1' }).fill('Too many active threads');
    await page.getByRole('button', { name: 'Add item for What are your three biggest challenges from the last year?' }).click();
    await page.getByRole('textbox', { name: 'What are your three biggest challenges from the last year? 2' }).fill('Money pressure');
    await page.getByRole('button', { name: 'Add item for What are your three biggest challenges from the last year?' }).click();
    await page.getByRole('textbox', { name: 'What are your three biggest challenges from the last year? 3' }).fill('Context switching');
    await expect(page.getByRole('button', { name: 'Add item for What are your three biggest challenges from the last year?' })).toBeDisabled();
    await page.getByRole('textbox', { name: 'What or who helped you overcome these challenges? 1' }).fill('Therapy');
    await page.getByRole('textbox', { name: 'What did you learn about yourself whilst overcoming these challenges? 1' }).fill('I need simpler systems.');
    await page.getByRole('textbox', { name: 'What are you not proud of yourself for?' }).fill('Waiting too long to simplify.');
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page.getByText('The Box Of Compassion')).toBeVisible();

    const compassionAnswer = 'I am ready to stop hiding from the hard thing.';
    const compassionInput = page.getByRole('textbox', {
      name: 'What are you ready to forgive yourself for? 1',
    });
    await compassionInput.fill(compassionAnswer);
    const saveAndExitButton = page.getByRole('button', { name: 'Save and Exit' });
    await saveAndExitButton.scrollIntoViewIfNeeded();
    await saveAndExitButton.click();

    await expect.poll(() => new URL(page.url()).pathname).toBe('/golden-compass');

    await resumeCompassFromPlanner(page);
    await expect
      .poll(() => new URL(page.url()).pathname)
      .toBe(`/golden-compass/${sessionId}`);
    const resumedCompassionInput = page.getByRole('textbox', {
      name: 'What are you ready to forgive yourself for? 1',
    });

    await expect(resumedCompassionInput).toHaveValue(compassionAnswer);

    await completeCompassFromScreen(page, 'past-compassion-box');

    await expect(page.getByText('Compass Completed')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Back to Weekly LAB' })).toBeVisible();
    await expect(page.getByText('Annual goals')).toBeVisible();

    await page.getByRole('button', { name: 'Open Compass Library' }).click();
    await expect.poll(() => new URL(page.url()).pathname).toBe('/golden-compass');

    const sessionCard = page.locator(`[data-compass-session-id="${sessionId}"]`);
    await expect(sessionCard).toBeVisible();
    page.once('dialog', dialog => dialog.accept());
    await sessionCard.getByRole('button', { name: 'Delete' }).click();
    await expect(sessionCard).toHaveCount(0);

    audit.stop();
    await page.goto(`/golden-compass/${sessionId}`);
    await expect.poll(() => new URL(page.url()).pathname).toBe('/golden-compass');
  } finally {
    audit.stop();
  }

  await assertCompassAuditClean(audit);
}

test('golden compass ux is stable on desktop', async ({ authedPage }) => {
  await runGoldenCompassRegression(authedPage);
});

test('typing request budgets stay bounded across Compass and planner notes', async ({ cleanLabPage }) => {
  const budget = trackRequestBudget(cleanLabPage);

  try {
    await openGoldenCompassFromModuleHub(cleanLabPage);
    const sessionId = await createCompassSessionFromDashboard(cleanLabPage);

    await advanceCompassUntilScreen(cleanLabPage, 'past-monthly-events');
    budget.reset();

    const compassPath = `/golden-compass/${sessionId}`;
    const aprilInput = cleanLabPage.getByRole('textbox', { name: 'April event 1' });
    await aprilInput.click();
    await aprilInput.pressSequentially('Signed the', { delay: 45 });
    await cleanLabPage.waitForTimeout(1200);
    await aprilInput.pressSequentially(' lease', { delay: 45 });
    await cleanLabPage.waitForTimeout(1200);

    await expect(aprilInput).toHaveValue('Signed the lease');
    await expect.poll(() => new URL(cleanLabPage.url()).pathname).toBe(compassPath);
    await expect(cleanLabPage.getByText('Loading your advisory board...')).toHaveCount(0);
    expect(budget.compassPatchResponses).toHaveLength(0);

    const addAprilEvent = cleanLabPage.getByRole('button', { name: 'Add event for April' });
    await addAprilEvent.click();

    const aprilSecondInput = cleanLabPage.getByRole('textbox', { name: 'April event 2' });
    await aprilSecondInput.pressSequentially('Took the first real trip', { delay: 45 });
    await cleanLabPage.waitForTimeout(1200);
    await aprilSecondInput.pressSequentially(' and stayed present', { delay: 45 });

    await expect(aprilSecondInput).toHaveValue('Took the first real trip and stayed present');
    await expect(cleanLabPage.getByText('Loading your advisory board...')).toHaveCount(0);

    await cleanLabPage.getByRole('button', { name: 'Continue' }).click();

    await expect.poll(() => budget.compassPatchResponses.length).toBeLessThanOrEqual(2);
    await expect.poll(() => new URL(cleanLabPage.url()).pathname).toBe(compassPath);

    await cleanLabPage.goto('/planner');
    await expect(cleanLabPage.getByRole('heading', { name: 'Daily Plan' })).toBeVisible();
    budget.reset();

    const headline = cleanLabPage.getByLabel('Headline');
    await headline.click();
    await headline.pressSequentially('Protect the real bottleneck', { delay: 45 });
    await cleanLabPage.waitForTimeout(1500);
    await headline.pressSequentially(' before anything cosmetic', { delay: 45 });
    await cleanLabPage.waitForTimeout(1500);

    await expect(headline).toHaveValue('Protect the real bottleneck before anything cosmetic');
    expect(budget.appStatePutResponses).toHaveLength(0);
    await expect(cleanLabPage.getByText('Loading your advisory board...')).toHaveCount(0);

    await cleanLabPage.waitForTimeout(1500);
    await expect.poll(() => budget.appStatePutResponses.length).toBe(1);

    await headline.fill('Protect the bottleneck before cosmetic cleanup');
    await cleanLabPage.getByLabel('Guardrail').click();
    await expect.poll(() => budget.appStatePutResponses.length).toBe(2);
    await expect(cleanLabPage.getByText('Loading your advisory board...')).toHaveCount(0);
  } finally {
    budget.stop();
  }
});

test.describe('golden compass mobile', () => {
  test.use({
    viewport: {
      width: 390,
      height: 844,
    },
  });

  test('golden compass ux is stable on mobile', async ({ authedPage }) => {
    await runGoldenCompassRegression(authedPage);
  });
});
