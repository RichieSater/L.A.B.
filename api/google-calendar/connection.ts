import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUser } from '../../server/auth.js';
import { buildBootstrapResponse, disconnectGoogleCalendar } from '../../server/data.js';
import { json, methodNotAllowed } from '../../server/http.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse | void> {
  const auth = await requireUser(req);
  if (!auth) {
    return json(res, 401, { error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const bootstrap = await buildBootstrapResponse(auth.userId);
    return json(res, 200, {
      connected: bootstrap.profile.googleCalendarConnected,
      email: bootstrap.profile.googleCalendarEmail,
      authUrl: bootstrap.profile.googleCalendarConnected ? null : '/api/google-calendar/connect',
    });
  }

  if (req.method === 'DELETE') {
    const profile = await disconnectGoogleCalendar(auth.userId);
    return json(res, 200, profile);
  }

  return methodNotAllowed(res, ['GET', 'DELETE']);
}
