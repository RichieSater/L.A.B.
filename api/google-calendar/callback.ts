import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUser } from '../../server/auth';
import { connectGoogleCalendar } from '../../server/data';
import { json, methodNotAllowed } from '../../server/http';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse | void> {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, ['GET']);
  }

  const auth = await requireUser(req);
  if (!auth) {
    return json(res, 401, { error: 'Unauthorized' });
  }

  const codeParam = req.query.code;
  const code = Array.isArray(codeParam) ? codeParam[0] : codeParam;
  if (!code) {
    return json(res, 400, { error: 'Authorization code is required.' });
  }

  try {
    await connectGoogleCalendar(auth.userId, code);
    res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
    return res.redirect('/settings?google_calendar=connected');
  } catch {
    res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
    return res.redirect('/settings?google_calendar=failed');
  }
}
