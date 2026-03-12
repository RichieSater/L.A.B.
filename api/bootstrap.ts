import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUser } from '../server/auth';
import { buildBootstrapResponse } from '../server/data';
import { json, methodNotAllowed } from '../server/http';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse | void> {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, ['GET']);
  }

  const auth = await requireUser(req);

  if (!auth) {
    return json(res, 401, { error: 'Unauthorized' });
  }

  const payload = await buildBootstrapResponse(auth.userId);
  return json(res, 200, payload);
}
