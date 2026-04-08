import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUser } from '../../../server/auth.js';
import { getUserAccountTier, listAdminUsers } from '../../../server/data.js';
import { json, methodNotAllowed } from '../../../server/http.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<VercelResponse | void> {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, ['GET']);
  }

  const auth = await requireUser(req);

  if (!auth) {
    return json(res, 401, { error: 'Unauthorized' });
  }

  const accountTier = await getUserAccountTier(auth.userId);

  if (accountTier !== 'admin') {
    return json(res, 403, { error: 'Forbidden' });
  }

  const users = await listAdminUsers();
  return json(res, 200, users);
}
