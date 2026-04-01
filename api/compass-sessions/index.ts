import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { CreateCompassSessionInput } from '../../src/types/compass.js';
import { requireUser } from '../../server/auth.js';
import { createCompassSession, listCompassSessions } from '../../server/data.js';
import { json, methodNotAllowed, readJsonBody } from '../../server/http.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<VercelResponse | void> {
  const auth = await requireUser(req);

  if (!auth) {
    return json(res, 401, { error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const sessions = await listCompassSessions(auth.userId);
    return json(res, 200, sessions);
  }

  if (req.method === 'POST') {
    const input = readJsonBody<CreateCompassSessionInput>(req);
    const session = await createCompassSession(auth.userId, input);
    return json(res, 201, session);
  }

  return methodNotAllowed(res, ['GET', 'POST']);
}
