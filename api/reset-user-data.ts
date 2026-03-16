import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUser } from '../server/auth.js';
import { resetUserData } from '../server/data.js';
import { json, methodNotAllowed } from '../server/http.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse | void> {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, ['POST']);
  }

  const auth = await requireUser(req);

  if (!auth) {
    return json(res, 401, { error: 'Unauthorized' });
  }

  await resetUserData(auth.userId);
  return json(res, 200, { success: true });
}
