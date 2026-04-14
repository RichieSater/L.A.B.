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
