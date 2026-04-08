import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { listAdminUsers, updateAdminUserTier } = vi.hoisted(() => ({
  listAdminUsers: vi.fn(),
  updateAdminUserTier: vi.fn(),
}));

vi.mock('../../lib/api', () => ({
  apiClient: {
    listAdminUsers,
    updateAdminUserTier,
  },
}));

import { AdminDashboardPage } from '../AdminDashboardPage';

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders users and lets admins change non-admin tiers', async () => {
    listAdminUsers.mockResolvedValue([
      {
        id: 'user_admin',
        displayName: 'Admin User',
        primaryEmail: 'admin@example.com',
        accountTier: 'admin',
        createdAt: '2026-04-05T12:00:00.000Z',
      },
      {
        id: 'user_free',
        displayName: 'Free User',
        primaryEmail: 'free@example.com',
        accountTier: 'free',
        createdAt: '2026-04-04T12:00:00.000Z',
      },
    ]);
    updateAdminUserTier.mockResolvedValue({
      id: 'user_free',
      displayName: 'Free User',
      primaryEmail: 'free@example.com',
      accountTier: 'premium',
      createdAt: '2026-04-04T12:00:00.000Z',
    });

    render(<AdminDashboardPage />);

    expect(await screen.findByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('Free User')).toBeInTheDocument();

    const freeUserRow = document.querySelector('[data-user-id="user_free"]');
    expect(freeUserRow).not.toBeNull();

    fireEvent.click(within(freeUserRow as HTMLElement).getByRole('button', { name: 'Set premium' }));

    await waitFor(() => {
      expect(updateAdminUserTier).toHaveBeenCalledWith('user_free', { accountTier: 'premium' });
    });

    expect(screen.getByText('admin is env-managed', { exact: false })).toBeInTheDocument();
  });
});
