import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireUser = vi.fn();
const deleteCompassSession = vi.fn();
const getCompassSession = vi.fn();
const updateCompassSession = vi.fn();
const json = vi.fn((_res, _status, body) => body);
const methodNotAllowed = vi.fn();
const readJsonBody = vi.fn();

vi.mock('../../server/auth.js', () => ({
  requireUser,
}));

vi.mock('../../server/data.js', () => ({
  deleteCompassSession,
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

  it('returns a 400 when lifecycle actions target an incomplete Compass', async () => {
    const handler = (await import('../compass-sessions/[id]')).default;
    requireUser.mockResolvedValue({ userId: 'user_123' });
    readJsonBody.mockReturnValue({ setActive: true });
    updateCompassSession.mockRejectedValue(new Error('COMPASS_COMPLETED_REQUIRED'));

    await handler({ method: 'PATCH', query: { id: 'compass-1' } } as never, {} as never);

    expect(json).toHaveBeenCalledWith(expect.anything(), 400, {
      error: 'Only completed Compass sessions can be marked achieved or used as the active Compass.',
    });
  });

  it('deletes a compass session by id', async () => {
    const handler = (await import('../compass-sessions/[id]')).default;
    const send = vi.fn();
    requireUser.mockResolvedValue({ userId: 'user_123' });
    deleteCompassSession.mockResolvedValue(true);

    await handler({ method: 'DELETE', query: { id: 'compass-1' } } as never, {
      status: vi.fn(() => ({ send })),
    } as never);

    expect(deleteCompassSession).toHaveBeenCalledWith('user_123', 'compass-1');
    expect(send).toHaveBeenCalledWith('');
  });

  it('returns a 404 when the compass session is missing', async () => {
    const handler = (await import('../compass-sessions/[id]')).default;
    requireUser.mockResolvedValue({ userId: 'user_123' });
    getCompassSession.mockResolvedValue(null);

    await handler({ method: 'GET', query: { id: 'missing' } } as never, {} as never);

    expect(json).toHaveBeenCalledWith(expect.anything(), 404, { error: 'Compass session not found.' });
  });
});
