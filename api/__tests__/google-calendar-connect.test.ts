import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireUser = vi.fn();
const createGoogleCalendarState = vi.fn();
const getGoogleCalendarAuthUrl = vi.fn();
const json = vi.fn((_res, _status, body) => body);
const methodNotAllowed = vi.fn();

vi.mock('../../server/auth', () => ({
  requireUser,
}));

vi.mock('../../server/google-calendar-state', () => ({
  createGoogleCalendarState,
}));

vi.mock('../../server/google-calendar', () => ({
  getGoogleCalendarAuthUrl,
}));

vi.mock('../../server/http', () => ({
  json,
  methodNotAllowed,
}));

describe('/api/google-calendar/connect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects authenticated users to Google with a signed state token', async () => {
    const handler = (await import('../google-calendar/connect')).default;

    requireUser.mockResolvedValue({ userId: 'user_123' });
    createGoogleCalendarState.mockReturnValue('signed-state');
    getGoogleCalendarAuthUrl.mockReturnValue('https://accounts.google.com/o/oauth2/v2/auth?state=signed-state');

    const redirect = vi.fn();
    const setHeader = vi.fn();
    const req = { method: 'GET' } as never;
    const res = { redirect, setHeader } as never;

    await handler(req, res);

    expect(createGoogleCalendarState).toHaveBeenCalledWith('user_123');
    expect(getGoogleCalendarAuthUrl).toHaveBeenCalledWith('signed-state');
    expect(setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store, max-age=0, must-revalidate');
    expect(redirect).toHaveBeenCalledWith('https://accounts.google.com/o/oauth2/v2/auth?state=signed-state');
  });
});
