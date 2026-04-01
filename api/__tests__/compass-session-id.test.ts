import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireUser = vi.fn();
const getCompassSession = vi.fn();
const updateCompassSession = vi.fn();
const json = vi.fn((_res, _status, body) => body);
const methodNotAllowed = vi.fn();
const readJsonBody = vi.fn();

vi.mock('../../server/auth.js', () => ({
  requireUser,
}));

vi.mock('../../server/data.js', () => ({
  getCompassSession,
  updateCompassSession,
}));

vi.mock('../../server/http.js', () => ({
  json,
  methodNotAllowed,
  readJsonBody,
}));

describe('/api/compass-sessions/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads a compass session by id', async () => {
    const handler = (await import('../compass-sessions/[id]')).default;
    requireUser.mockResolvedValue({ userId: 'user_123' });
    getCompassSession.mockResolvedValue({ id: 'compass-1' });

    await handler({ method: 'GET', query: { id: 'compass-1' } } as never, {} as never);

    expect(getCompassSession).toHaveBeenCalledWith('user_123', 'compass-1');
    expect(json).toHaveBeenCalledWith(expect.anything(), 200, { id: 'compass-1' });
  });

  it('updates a compass session by id', async () => {
    const handler = (await import('../compass-sessions/[id]')).default;
    requireUser.mockResolvedValue({ userId: 'user_123' });
    readJsonBody.mockReturnValue({ status: 'completed' });
    updateCompassSession.mockResolvedValue({ id: 'compass-1', status: 'completed' });

    await handler({ method: 'PATCH', query: { id: 'compass-1' } } as never, {} as never);

    expect(updateCompassSession).toHaveBeenCalledWith('user_123', 'compass-1', { status: 'completed' });
    expect(json).toHaveBeenCalledWith(expect.anything(), 200, { id: 'compass-1', status: 'completed' });
  });

  it('returns a 404 when the compass session is missing', async () => {
    const handler = (await import('../compass-sessions/[id]')).default;
    requireUser.mockResolvedValue({ userId: 'user_123' });
    getCompassSession.mockResolvedValue(null);

    await handler({ method: 'GET', query: { id: 'missing' } } as never, {} as never);

    expect(json).toHaveBeenCalledWith(expect.anything(), 404, { error: 'Compass session not found.' });
  });
});
