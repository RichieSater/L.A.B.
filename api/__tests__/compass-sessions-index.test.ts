import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireUser = vi.fn();
const listCompassSessions = vi.fn();
const createCompassSession = vi.fn();
const json = vi.fn((_res, _status, body) => body);
const methodNotAllowed = vi.fn();
const readJsonBody = vi.fn();

vi.mock('../../server/auth.js', () => ({
  requireUser,
}));

vi.mock('../../server/data.js', () => ({
  listCompassSessions,
  createCompassSession,
}));

vi.mock('../../server/http.js', () => ({
  json,
  methodNotAllowed,
  readJsonBody,
}));

describe('/api/compass-sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists compass sessions for the authenticated user', async () => {
    const handler = (await import('../compass-sessions/index')).default;
    requireUser.mockResolvedValue({ userId: 'user_123' });
    listCompassSessions.mockResolvedValue([{ id: 'compass-1' }]);

    await handler({ method: 'GET' } as never, {} as never);

    expect(listCompassSessions).toHaveBeenCalledWith('user_123');
    expect(json).toHaveBeenCalledWith(expect.anything(), 200, [{ id: 'compass-1' }]);
  });

  it('creates a new compass session', async () => {
    const handler = (await import('../compass-sessions/index')).default;
    requireUser.mockResolvedValue({ userId: 'user_123' });
    readJsonBody.mockReturnValue({ planningYear: 2026 });
    createCompassSession.mockResolvedValue({ id: 'compass-2', planningYear: 2026 });

    await handler({ method: 'POST' } as never, {} as never);

    expect(createCompassSession).toHaveBeenCalledWith('user_123', { planningYear: 2026 });
    expect(json).toHaveBeenCalledWith(expect.anything(), 201, { id: 'compass-2', planningYear: 2026 });
  });
});
