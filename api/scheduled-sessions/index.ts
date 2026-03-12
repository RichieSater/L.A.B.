import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { CreateScheduledSessionInput } from '../../src/types/api.js';
import { requireUser } from '../../server/auth.js';
import { createScheduledSession, listScheduledSessions } from '../../server/data.js';
import { json, methodNotAllowed, readJsonBody } from '../../server/http.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse | void> {
  const auth = await requireUser(req);

  if (!auth) {
    return json(res, 401, { error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const sessions = await listScheduledSessions(auth.userId);
    return json(res, 200, sessions);
  }

  if (req.method === 'POST') {
    const body = readJsonBody<CreateScheduledSessionInput>(req);
    const session = await createScheduledSession(auth.userId, body);
    return json(res, 201, session);
  }

  return methodNotAllowed(res, ['GET', 'POST']);
}
