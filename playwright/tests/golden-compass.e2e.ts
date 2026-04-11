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

    await advanceCompassUntilScreen(page, 'past-compassion-box', 'bonfire-release');

    const compassionAnswer = 'I am ready to stop hiding from the hard thing.';
    const compassionInput = page.getByRole('textbox', {
      name: 'What are you ready to forgive yourself for?',
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
    await expect(page.getByText('What are you ready to forgive yourself for?')).toBeVisible();
    await expect(
      page.getByRole('textbox', { name: 'What are you ready to forgive yourself for?' }),
    ).toHaveValue(compassionAnswer);

    await completeCompassFromScreen(page, 'past-compassion-box');

    await expect(page.getByText('Compass Completed')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Back to Weekly LAB' })).toBeVisible();
    await expect(page.getByText('Annual goals')).toBeVisible();
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
