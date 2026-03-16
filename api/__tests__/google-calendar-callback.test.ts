import { beforeEach, describe, expect, it, vi } from 'vitest';

const verifyGoogleCalendarState = vi.fn();
const connectGoogleCalendar = vi.fn();
const json = vi.fn((_res, _status, body) => body);
const methodNotAllowed = vi.fn();

vi.mock('../../server/google-calendar-state', () => ({
  verifyGoogleCalendarState,
}));

vi.mock('../../server/data', () => ({
  connectGoogleCalendar,
}));

vi.mock('../../server/http', () => ({
  json,
  methodNotAllowed,
}));

describe('/api/google-calendar/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('connects Google Calendar when the code and state are valid', async () => {
    const handler = (await import('../google-calendar/callback')).default;

    verifyGoogleCalendarState.mockReturnValue({ ok: true, userId: 'user_123' });
    connectGoogleCalendar.mockResolvedValue(undefined);

    const redirect = vi.fn();
    const setHeader = vi.fn();
    const req = { method: 'GET', query: { code: 'auth-code', state: 'signed-state' } } as never;
    const res = { redirect, setHeader } as never;

    await handler(req, res);

    expect(verifyGoogleCalendarState).toHaveBeenCalledWith('signed-state');
    expect(connectGoogleCalendar).toHaveBeenCalledWith('user_123', 'auth-code');
    expect(setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store, max-age=0, must-revalidate');
    expect(redirect).toHaveBeenCalledWith('/settings?google_calendar=connected');
  });

  it('redirects to invalid_state when state is missing', async () => {
    const handler = (await import('../google-calendar/callback')).default;

    const redirect = vi.fn();
    const setHeader = vi.fn();
    const req = { method: 'GET', query: { code: 'auth-code' } } as never;
    const res = { redirect, setHeader } as never;

    await handler(req, res);

    expect(verifyGoogleCalendarState).not.toHaveBeenCalled();
    expect(connectGoogleCalendar).not.toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith('/settings?google_calendar=invalid_state');
  });

  it('redirects to invalid_state when state is malformed', async () => {
    const handler = (await import('../google-calendar/callback')).default;

    verifyGoogleCalendarState.mockReturnValue({ ok: false, reason: 'invalid' });

    const redirect = vi.fn();
    const setHeader = vi.fn();
    const req = { method: 'GET', query: { code: 'auth-code', state: 'bad-state' } } as never;
    const res = { redirect, setHeader } as never;

    await handler(req, res);

    expect(connectGoogleCalendar).not.toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith('/settings?google_calendar=invalid_state');
  });

  it('redirects to expired_state when state has expired', async () => {
    const handler = (await import('../google-calendar/callback')).default;

    verifyGoogleCalendarState.mockReturnValue({ ok: false, reason: 'expired' });

    const redirect = vi.fn();
    const setHeader = vi.fn();
    const req = { method: 'GET', query: { code: 'auth-code', state: 'expired-state' } } as never;
    const res = { redirect, setHeader } as never;

    await handler(req, res);

    expect(connectGoogleCalendar).not.toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith('/settings?google_calendar=expired_state');
  });

  it('redirects to failed when token exchange fails', async () => {
    const handler = (await import('../google-calendar/callback')).default;

    verifyGoogleCalendarState.mockReturnValue({ ok: true, userId: 'user_123' });
    connectGoogleCalendar.mockRejectedValue(new Error('token exchange failed'));

    const redirect = vi.fn();
    const setHeader = vi.fn();
    const req = { method: 'GET', query: { code: 'auth-code', state: 'signed-state' } } as never;
    const res = { redirect, setHeader } as never;

    await handler(req, res);

    expect(redirect).toHaveBeenCalledWith('/settings?google_calendar=failed');
  });
});
