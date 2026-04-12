import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { UpdateCompassSessionInput } from '../../src/types/compass.js';
import { requireUser } from '../../server/auth.js';
import { deleteCompassSession, getCompassSession, updateCompassSession } from '../../server/data.js';
import { json, methodNotAllowed, readJsonBody } from '../../server/http.js';

function isCompletedCompassRequirementError(error: unknown): boolean {
  return error instanceof Error && error.message === 'COMPASS_COMPLETED_REQUIRED';
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<VercelResponse | void> {
  const auth = await requireUser(req);

  if (!auth) {
    return json(res, 401, { error: 'Unauthorized' });
  }

  const sessionId = req.query.id;
  const id = Array.isArray(sessionId) ? sessionId[0] : sessionId;

  if (!id) {
    return json(res, 400, { error: 'Compass session id is required.' });
  }

  if (req.method === 'GET') {
    const session = await getCompassSession(auth.userId, id);

    if (!session) {
      return json(res, 404, { error: 'Compass session not found.' });
    }

    return json(res, 200, session);
  }

  if (req.method === 'PATCH') {
    try {
      const input = readJsonBody<UpdateCompassSessionInput>(req);
      const session = await updateCompassSession(auth.userId, id, input);

      if (!session) {
        return json(res, 404, { error: 'Compass session not found.' });
      }

      return json(res, 200, session);
    } catch (error) {
      if (isCompletedCompassRequirementError(error)) {
        return json(res, 400, {
          error: 'Only completed Compass sessions can be marked achieved or used as the active Compass.',
        });
      }

      throw error;
    }
  }

  if (req.method === 'DELETE') {
    const deleted = await deleteCompassSession(auth.userId, id);

    if (!deleted) {
      return json(res, 404, { error: 'Compass session not found.' });
    }

    return res.status(204).send('');
  }

  return methodNotAllowed(res, ['GET', 'PATCH', 'DELETE']);
}
