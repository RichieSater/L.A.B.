import { useEffect, useState } from 'react';
import { apiClient } from '../lib/api';
import type { AdminUserSummary, ManagedAccountTier } from '../types/api';

type AdminSortKey = 'newest' | 'oldest' | 'email' | 'tier';

const TIER_BADGE_STYLES: Record<AdminUserSummary['accountTier'], string> = {
  free: 'border-amber-400/30 bg-amber-500/10 text-amber-100',
  premium: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100',
  admin: 'border-slate-400/30 bg-slate-500/10 text-slate-100',
};

export function AdminDashboardPage() {
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<AdminSortKey>('newest');
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadUsers() {
      try {
        const nextUsers = await apiClient.listAdminUsers();

        if (!active) {
          return;
        }

        setUsers(nextUsers);
        setError(null);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : 'Failed to load users.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadUsers();

    return () => {
      active = false;
    };
  }, []);

  async function handleTierChange(userId: string, accountTier: ManagedAccountTier) {
    setSavingUserId(userId);
    setError(null);

    try {
      const updatedUser = await apiClient.updateAdminUserTier(userId, { accountTier });
      setUsers(prevUsers => prevUsers.map(user => (user.id === userId ? updatedUser : user)));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to update account tier.');
    } finally {
      setSavingUserId(null);
    }
  }

  const query = search.trim().toLowerCase();
  const filteredUsers = users.filter(user => {
    if (!query) {
      return true;
    }

    return [user.displayName, user.primaryEmail, user.id]
      .filter((value): value is string => Boolean(value))
      .some(value => value.toLowerCase().includes(query));
  });
  const visibleUsers = [...filteredUsers].sort((left, right) => {
    if (sortBy === 'oldest') {
      return left.createdAt.localeCompare(right.createdAt);
    }

    if (sortBy === 'email') {
      return (left.primaryEmail ?? left.id).localeCompare(right.primaryEmail ?? right.id);
    }

    if (sortBy === 'tier') {
      return left.accountTier.localeCompare(right.accountTier) || left.createdAt.localeCompare(right.createdAt);
    }

    return right.createdAt.localeCompare(left.createdAt);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Admin</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Admin Dashboard</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
            Review LAB accounts and decide whether each non-admin user stays on free or gets premium access.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex flex-col gap-2 text-sm text-gray-400">
            Search
            <input
              type="search"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search by email, name, or id"
              className="min-w-[16rem] rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100 focus:border-slate-400 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-gray-400">
            Sort
            <select
              value={sortBy}
              onChange={event => setSortBy(event.target.value as AdminSortKey)}
              className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100 focus:border-slate-400 focus:outline-none"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="email">Email A-Z</option>
              <option value="tier">Tier</option>
            </select>
          </label>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-gray-800 bg-gray-950/70 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-gray-400">Users</h3>
            <p className="mt-1 text-sm text-gray-500">
              {loading ? 'Loading users...' : `${visibleUsers.length} visible user${visibleUsers.length === 1 ? '' : 's'}`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="px-5 py-8 text-sm text-gray-400">Loading account tiers...</div>
        ) : visibleUsers.length === 0 ? (
          <div className="px-5 py-8 text-sm text-gray-400">No users matched the current search.</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {visibleUsers.map(user => {
              const adminUser = user.accountTier === 'admin';
              const saving = savingUserId === user.id;

              return (
                <div
                  key={user.id}
                  data-user-id={user.id}
                  className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h4 className="text-sm font-semibold text-white">
                        {user.displayName ?? 'Unnamed user'}
                      </h4>
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${TIER_BADGE_STYLES[user.accountTier]}`}>
                        {user.accountTier}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-300">
                      {user.primaryEmail ?? 'Missing email'}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Joined {formatDate(user.createdAt)} • {user.id}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={adminUser || saving || user.accountTier === 'free'}
                      onClick={() => handleTierChange(user.id, 'free')}
                      className="rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-100 transition-colors hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving && user.accountTier !== 'free' ? 'Saving...' : 'Set free'}
                    </button>
                    <button
                      type="button"
                      disabled={adminUser || saving || user.accountTier === 'premium'}
                      onClick={() => handleTierChange(user.id, 'premium')}
                      className="rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-100 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving && user.accountTier !== 'premium' ? 'Saving...' : 'Set premium'}
                    </button>
                    {adminUser ? (
                      <span className="inline-flex items-center rounded-lg border border-slate-500/25 bg-slate-500/10 px-3 py-2 text-sm text-slate-200">
                        Admin is env-managed
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
