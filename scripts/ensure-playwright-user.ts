import process from 'node:process';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { createClerkClient } from '@clerk/backend';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv();

const DEFAULT_TEST_EMAIL = 'lab-playwright+clerk_test@example.com';
const TEST_METADATA = {
  labPlaywrightManaged: true,
  labPlaywrightUser: true,
};

function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {};
}

const publishableKey = process.env.CLERK_PUBLISHABLE_KEY ?? process.env.VITE_CLERK_PUBLISHABLE_KEY;
const secretKey = required('CLERK_SECRET_KEY');
const email = process.env.PLAYWRIGHT_TEST_EMAIL ?? DEFAULT_TEST_EMAIL;
const password = required('PLAYWRIGHT_TEST_PASSWORD');

if (!publishableKey) {
  throw new Error('CLERK_PUBLISHABLE_KEY or VITE_CLERK_PUBLISHABLE_KEY is required.');
}

const clerkClient = createClerkClient({
  publishableKey,
  secretKey,
});

async function upsertPlaywrightUser() {
  const { data } = await clerkClient.users.getUserList({
    emailAddress: [email],
    limit: 2,
  });

  if (data.length > 1) {
    throw new Error(`Expected at most one Clerk user for ${email}, found ${data.length}.`);
  }

  if (data.length === 0) {
    const created = await clerkClient.users.createUser({
      emailAddress: [email],
      password,
      firstName: 'LAB',
      lastName: 'Playwright',
      privateMetadata: TEST_METADATA,
    });

    console.info(`Created Clerk Playwright user ${created.id} for ${email}.`);
    return;
  }

  const existing = data[0];
  const privateMetadata = {
    ...asRecord(existing.privateMetadata),
    ...TEST_METADATA,
  };

  await clerkClient.users.updateUser(existing.id, {
    password,
    firstName: existing.firstName ?? 'LAB',
    lastName: existing.lastName ?? 'Playwright',
    privateMetadata,
  });

  console.info(`Updated Clerk Playwright user ${existing.id} for ${email}.`);
}

await upsertPlaywrightUser();
