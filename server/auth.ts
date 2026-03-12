import type { VercelRequest } from '@vercel/node';
import { createClerkClient } from '@clerk/backend';
import { env } from './env.js';
import { toRequest } from './http.js';

export const clerkClient = createClerkClient({
  publishableKey: env.clerkPublishableKey,
  secretKey: env.clerkSecretKey,
});

export async function requireUser(req: VercelRequest): Promise<{ userId: string } | null> {
  const requestState = await clerkClient.authenticateRequest(toRequest(req), {
    acceptsToken: 'session_token',
  });

  if (!requestState.isAuthenticated) {
    return null;
  }

  const auth = requestState.toAuth();

  if (!auth || !('userId' in auth) || !auth.userId) {
    return null;
  }

  return { userId: auth.userId };
}
