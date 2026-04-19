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
    <div className="lab-page lab-page--narrow space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="lab-eyebrow">Oversight</p>
          <h2 className="mt-3 text-[2.4rem] font-semibold leading-none tracking-[-0.04em] text-[color:var(--lab-text)]">
            Admin Dashboard
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--lab-text-muted)]">
            Review LAB accounts and decide whether each non-admin user stays on free or gets premium access.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex flex-col gap-2 text-sm text-[color:var(--lab-text-muted)]">
            Search
            <input
              type="search"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search by email, name, or id"
              className="lab-input min-w-[16rem]"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-[color:var(--lab-text-muted)]">
            Sort
            <select
              value={sortBy}
              onChange={event => setSortBy(event.target.value as AdminSortKey)}
              className="lab-select"
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
        <div className="lab-panel rounded-2xl border-[rgba(230,123,123,0.32)] bg-[rgba(230,123,123,0.12)] px-4 py-3 text-sm text-[#ffd5d5]">
          {error}
        </div>
      ) : null}

      <div className="lab-panel overflow-hidden rounded-[1.75rem]">
        <div className="flex items-center justify-between border-b border-[color:var(--lab-border-muted)] px-5 py-4">
          <div>
            <h3 className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--lab-text-muted)]">Users</h3>
            <p className="mt-1 text-sm text-[color:var(--lab-text-dim)]">
              {loading ? 'Loading users...' : `${visibleUsers.length} visible user${visibleUsers.length === 1 ? '' : 's'}`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="px-5 py-8 text-sm text-[color:var(--lab-text-muted)]">Loading account tiers...</div>
        ) : visibleUsers.length === 0 ? (
          <div className="px-5 py-8 text-sm text-[color:var(--lab-text-muted)]">No users matched the current search.</div>
        ) : (
          <div className="divide-y divide-[color:var(--lab-border-muted)]">
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
                      <h4 className="text-sm font-semibold text-[color:var(--lab-text)]">
                        {user.displayName ?? 'Unnamed user'}
                      </h4>
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${TIER_BADGE_STYLES[user.accountTier]}`}>
                        {user.accountTier}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[color:var(--lab-text)]">
                      {user.primaryEmail ?? 'Missing email'}
                    </p>
                    <p className="mt-1 text-xs text-[color:var(--lab-text-dim)]">
                      Joined {formatDate(user.createdAt)} • {user.id}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={adminUser || saving || user.accountTier === 'free'}
                      onClick={() => handleTierChange(user.id, 'free')}
                      className="lab-button lab-button--ink rounded-2xl px-4"
                    >
                      {saving && user.accountTier !== 'free' ? 'Saving...' : 'Set free'}
                    </button>
                    <button
                      type="button"
                      disabled={adminUser || saving || user.accountTier === 'premium'}
                      onClick={() => handleTierChange(user.id, 'premium')}
                      className="lab-button rounded-2xl border-[rgba(74,181,171,0.38)] bg-[rgba(74,181,171,0.14)] px-4 text-[#b7f1e2] hover:border-[rgba(74,181,171,0.65)] hover:text-white"
                    >
                      {saving && user.accountTier !== 'premium' ? 'Saving...' : 'Set premium'}
                    </button>
                    {adminUser ? (
                      <span className="inline-flex items-center rounded-2xl border border-[rgba(245,243,238,0.24)] bg-[rgba(245,243,238,0.08)] px-3 py-2 text-sm text-[color:var(--lab-text-muted)]">
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
