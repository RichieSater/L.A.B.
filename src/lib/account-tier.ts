import type { AccountTier, ManagedAccountTier } from '../types/api';

const ACCOUNT_TIER_RANK: Record<AccountTier, number> = {
  free: 0,
  premium: 1,
  admin: 2,
};

export function hasAccountTierAccess(
  accountTier: AccountTier | null | undefined,
  requiredTier: AccountTier,
): boolean {
  if (!accountTier) {
    return false;
  }

  return ACCOUNT_TIER_RANK[accountTier] >= ACCOUNT_TIER_RANK[requiredTier];
}

export function isManagedAccountTier(value: unknown): value is ManagedAccountTier {
  return value === 'free' || value === 'premium';
}
