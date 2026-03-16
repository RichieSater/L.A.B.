import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUser } from '../../server/auth.js';
import { createGoogleCalendarState } from '../../server/google-calendar-state.js';
import { getGoogleCalendarAuthUrl } from '../../server/google-calendar.js';
import { json, methodNotAllowed } from '../../server/http.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse | void> {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, ['GET']);
  }

  const auth = await requireUser(req);
  if (!auth) {
    return json(res, 401, { error: 'Unauthorized' });
  }

  const authUrl = getGoogleCalendarAuthUrl(createGoogleCalendarState(auth.userId));
  if (!authUrl) {
    return json(res, 503, { error: 'Google Calendar is not configured.' });
  }

  res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
  return res.redirect(authUrl);
}
