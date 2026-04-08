function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function optional(name: string): string | null {
  return process.env[name] ?? null;
}

export const env = {
  clerkPublishableKey: required('CLERK_PUBLISHABLE_KEY'),
  clerkSecretKey: required('CLERK_SECRET_KEY'),
  databaseUrl: required('DATABASE_URL'),
  buildVersion: optional('VERCEL_GIT_COMMIT_SHA') ?? 'dev',
  labAdminEmails: optional('LAB_ADMIN_EMAILS'),
  oauthStateSecret: optional('OAUTH_STATE_SECRET'),
  googleClientId: optional('GOOGLE_CLIENT_ID'),
  googleClientSecret: optional('GOOGLE_CLIENT_SECRET'),
  appUrl: optional('APP_URL'),
};
