import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyGoogleCalendarState } from '../../server/google-calendar-state.js';
import { connectGoogleCalendar } from '../../server/data.js';
import { methodNotAllowed } from '../../server/http.js';

function redirectToSettings(res: VercelResponse, status: 'connected' | 'failed' | 'invalid_state' | 'expired_state') {
  res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
  return res.redirect(`/settings?google_calendar=${status}`);
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse | void> {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, ['GET']);
  }

  const codeParam = req.query.code;
  const code = Array.isArray(codeParam) ? codeParam[0] : codeParam;
  const stateParam = req.query.state;
  const state = Array.isArray(stateParam) ? stateParam[0] : stateParam;

  if (!state) {
    return redirectToSettings(res, 'invalid_state');
  }

  const verifiedState = verifyGoogleCalendarState(state);
  if (verifiedState.ok === false) {
    return redirectToSettings(res, verifiedState.reason === 'expired' ? 'expired_state' : 'invalid_state');
  }

  if (!code) {
    return redirectToSettings(res, 'failed');
  }

  try {
    await connectGoogleCalendar(verifiedState.userId, code);
    return redirectToSettings(res, 'connected');
  } catch {
    return redirectToSettings(res, 'failed');
  }
}
