import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireUser = vi.fn();
const resetUserData = vi.fn();
const json = vi.fn((_res, _status, body) => body);
const methodNotAllowed = vi.fn();

vi.mock('../../server/auth', () => ({
  requireUser,
}));

vi.mock('../../server/data', () => ({
  resetUserData,
}));

vi.mock('../../server/http', () => ({
  json,
  methodNotAllowed,
}));

describe('/api/reset-user-data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resets data for the signed-in user', async () => {
    const handler = (await import('../reset-user-data')).default;

    requireUser.mockResolvedValue({ userId: 'user_123' });
    resetUserData.mockResolvedValue(undefined);

    const req = { method: 'POST' } as never;
    const res = {} as never;

    await handler(req, res);

    expect(resetUserData).toHaveBeenCalledWith('user_123');
    expect(json).toHaveBeenLastCalledWith(res, 200, { success: true });
  });
});
