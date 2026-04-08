import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { UpdateAdminUserTierInput } from '../../src/types/api.js';
import { requireUser } from '../../server/auth.js';
import { getUserAccountTier, listAdminUsers, updateAdminUserTier } from '../../server/data.js';
import { json, methodNotAllowed, readJsonBody } from '../../server/http.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<VercelResponse | void> {
  const auth = await requireUser(req);

  if (!auth) {
    return json(res, 401, { error: 'Unauthorized' });
  }

  const accountTier = await getUserAccountTier(auth.userId);

  if (accountTier !== 'admin') {
    return json(res, 403, { error: 'Forbidden' });
  }

  if (req.method === 'GET') {
    const users = await listAdminUsers();
    return json(res, 200, users);
  }

  if (req.method === 'PATCH') {
    const userIdParam = req.query.userId;
    const userId = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;

    if (!userId) {
      return json(res, 400, { error: 'User id is required.' });
    }

    const body = readJsonBody<UpdateAdminUserTierInput>(req);

    if (body.accountTier !== 'free' && body.accountTier !== 'premium') {
      return json(res, 400, { error: 'Account tier must be free or premium.' });
    }

    try {
      const updatedUser = await updateAdminUserTier(userId, body.accountTier);

      if (!updatedUser) {
        return json(res, 404, { error: 'User not found.' });
      }

      return json(res, 200, updatedUser);
    } catch (error) {
      if (error instanceof Error && error.message === 'ADMIN_ACCOUNT_TIER_LOCKED') {
        return json(res, 400, { error: 'Admin users cannot be reassigned here.' });
      }

      throw error;
    }
  }

  return methodNotAllowed(res, ['GET', 'PATCH']);
}
