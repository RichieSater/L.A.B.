import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { HOME_PATH } from '../constants/routes';
import { hasAccountTierAccess } from '../lib/account-tier';
import type { AccountTier } from '../types/api';
import { useAuth } from './auth-context';

export function EntitledRoute({
  children,
  requiredTier,
}: {
  children: ReactNode;
  requiredTier: AccountTier;
}) {
  const { profile } = useAuth();

  if (!hasAccountTierAccess(profile?.accountTier, requiredTier)) {
    return <Navigate to={HOME_PATH} replace />;
  }

  return <>{children}</>;
}
