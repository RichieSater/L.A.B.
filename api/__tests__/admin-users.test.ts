import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireUser = vi.fn();
const getUserAccountTier = vi.fn();
const listAdminUsers = vi.fn();
const updateAdminUserTier = vi.fn();
const json = vi.fn((_res, _status, body) => body);
const methodNotAllowed = vi.fn();
const readJsonBody = vi.fn();

vi.mock('../../server/auth', () => ({
  requireUser,
}));

vi.mock('../../server/data', () => ({
  getUserAccountTier,
  listAdminUsers,
  updateAdminUserTier,
}));

vi.mock('../../server/http', () => ({
  json,
  methodNotAllowed,
  readJsonBody,
}));

describe('admin user APIs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects non-admin access to the user list', async () => {
    const handler = (await import('../admin/users')).default;
    requireUser.mockResolvedValue({ userId: 'user_123' });
    getUserAccountTier.mockResolvedValue('premium');

    await handler({ method: 'GET' } as never, {} as never);

    expect(json).toHaveBeenCalledWith(expect.anything(), 403, { error: 'Forbidden' });
  });

  it('returns the admin user list for admins', async () => {
    const handler = (await import('../admin/users')).default;
    requireUser.mockResolvedValue({ userId: 'user_admin' });
    getUserAccountTier.mockResolvedValue('admin');
    listAdminUsers.mockResolvedValue([
      {
        id: 'user_123',
        displayName: 'Premium User',
        primaryEmail: 'premium@example.com',
        accountTier: 'premium',
        createdAt: '2026-04-05T12:00:00.000Z',
      },
    ]);

    await handler({ method: 'GET' } as never, {} as never);

    expect(json).toHaveBeenCalledWith(expect.anything(), 200, [
      {
        id: 'user_123',
        displayName: 'Premium User',
        primaryEmail: 'premium@example.com',
        accountTier: 'premium',
        createdAt: '2026-04-05T12:00:00.000Z',
      },
    ]);
  });

  it('rejects admin-tier edits through the management endpoint', async () => {
    const handler = (await import('../admin/users')).default;
    requireUser.mockResolvedValue({ userId: 'user_admin' });
    getUserAccountTier.mockResolvedValue('admin');
    readJsonBody.mockReturnValue({ accountTier: 'premium' });
    updateAdminUserTier.mockRejectedValue(new Error('ADMIN_ACCOUNT_TIER_LOCKED'));

    await handler({
      method: 'PATCH',
      query: { userId: 'user_admin' },
    } as never, {} as never);

    expect(json).toHaveBeenCalledWith(expect.anything(), 400, {
      error: 'Admin users cannot be reassigned here.',
    });
  });
});
