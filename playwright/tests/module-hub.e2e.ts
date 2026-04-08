import { test, expect } from '../fixtures/lab';

test('loads the protected module hub from stored Clerk auth state', async ({ authedPage }) => {
  expect(new URL(authedPage.url()).pathname).toBe('/');
  await expect(authedPage.getByRole('heading', { name: 'The System' })).toBeVisible();
  await expect(authedPage.getByRole('button', { name: 'Open Quantum Planner' })).toBeVisible();
  await expect(authedPage.getByRole('button', { name: 'Open Advisory Board' })).toBeVisible();
  await expect(authedPage.getByRole('button', { name: 'Open Golden Compass' })).toBeVisible();
});
