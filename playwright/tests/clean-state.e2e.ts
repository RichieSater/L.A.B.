import { test, expect } from '../fixtures/lab';
import {
  createScheduledSession,
  getBootstrap,
  resetLabData,
  waitForLabReady,
} from '../helpers/lab';

test('can clear LAB data without deleting the durable Clerk user', async ({ cleanLabPage }) => {
  const initialBootstrap = await getBootstrap(cleanLabPage);
  expect(initialBootstrap.scheduledSessions).toHaveLength(0);

  const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await createScheduledSession(cleanLabPage, scheduledAt);

  const scheduledBootstrap = await getBootstrap(cleanLabPage);
  expect(scheduledBootstrap.scheduledSessions).toHaveLength(1);

  await resetLabData(cleanLabPage);
  await cleanLabPage.goto('/');
  await waitForLabReady(cleanLabPage);

  const resetBootstrap = await getBootstrap(cleanLabPage);
  expect(resetBootstrap.scheduledSessions).toHaveLength(0);

  await cleanLabPage.goto('/settings');
  await expect(cleanLabPage.getByRole('heading', { name: 'Settings' })).toBeVisible();
});
