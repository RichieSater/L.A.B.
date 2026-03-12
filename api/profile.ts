import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { UserProfile } from '../src/types/api';
import { requireUser } from '../server/auth';
import { updateUserProfile } from '../server/data';
import { json, methodNotAllowed, readJsonBody } from '../server/http';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse | void> {
  if (req.method !== 'PATCH') {
    return methodNotAllowed(res, ['PATCH']);
  }

  const auth = await requireUser(req);

  if (!auth) {
    return json(res, 401, { error: 'Unauthorized' });
  }

  const body = readJsonBody<Partial<UserProfile>>(req);
  const profile = await updateUserProfile(auth.userId, body);
  return json(res, 200, profile);
}
