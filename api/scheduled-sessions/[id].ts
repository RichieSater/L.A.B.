import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { UpdateScheduledSessionInput } from '../../src/types/api';
import { requireUser } from '../../server/auth';
import { updateScheduledSession } from '../../server/data';
import { json, methodNotAllowed, readJsonBody } from '../../server/http';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse | void> {
  if (req.method !== 'PATCH') {
    return methodNotAllowed(res, ['PATCH']);
  }

  const auth = await requireUser(req);

  if (!auth) {
    return json(res, 401, { error: 'Unauthorized' });
  }

  const sessionId = req.query.id;
  const id = Array.isArray(sessionId) ? sessionId[0] : sessionId;

  if (!id) {
    return json(res, 400, { error: 'Session id is required' });
  }

  const body = readJsonBody<UpdateScheduledSessionInput>(req);
  const session = await updateScheduledSession(auth.userId, id, body);

  if (!session) {
    return res.status(204).send('');
  }

  return json(res, 200, session);
}
