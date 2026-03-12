/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useClerk, useUser } from '@clerk/react';
import { apiClient } from '../lib/api';
import type { BootstrapResponse, AuthUser, UserProfile } from '../types/api';
import { APP_BUILD_VERSION } from '../constants/build';

interface AuthContextValue {
  user: AuthUser | null;
  profile: UserProfile | null;
  bootstrapData: BootstrapResponse | null;
  loading: boolean;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshBootstrap: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapUser(user: ReturnType<typeof useUser>['user']): AuthUser | null {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    primaryEmailAddress: user.primaryEmailAddress?.emailAddress ?? null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, user: clerkUser } = useUser();
  const clerk = useClerk();
  const [bootstrapData, setBootstrapData] = useState<BootstrapResponse | null>(null);
  const [bootstrapping, setBootstrapping] = useState(false);

  const refreshBootstrap = useCallback(async () => {
    if (!clerkUser) {
      setBootstrapData(null);
      return;
    }

    setBootstrapping(true);

    try {
      const nextData = await apiClient.getBootstrap();

      if (nextData.buildVersion !== APP_BUILD_VERSION && typeof window !== 'undefined') {
        const reloadKey = `lab-build-reload:${nextData.buildVersion}`;
        if (!window.sessionStorage.getItem(reloadKey)) {
          window.sessionStorage.setItem(reloadKey, '1');
          window.location.replace(`${window.location.pathname}?refresh=${Date.now()}${window.location.hash}`);
          return;
        }
      }

      setBootstrapData(nextData);
    } finally {
      setBootstrapping(false);
    }
  }, [clerkUser]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!clerkUser) {
      setBootstrapData(null);
      setBootstrapping(false);
      return;
    }

    refreshBootstrap().catch(error => {
      console.error('Failed to bootstrap app state:', error);
      setBootstrapping(false);
    });
  }, [isLoaded, clerkUser, refreshBootstrap]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    const profile = await apiClient.updateProfile(updates);
    setBootstrapData(prev => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        profile,
      };
    });
  }, []);

  const signOut = useCallback(async () => {
    await clerk.signOut();
    setBootstrapData(null);
  }, [clerk]);

  const loading = !isLoaded || (!!clerkUser && (bootstrapping || !bootstrapData));
  const user = mapUser(clerkUser);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile: bootstrapData?.profile ?? null,
        bootstrapData,
        loading,
        signOut,
        updateProfile,
        refreshBootstrap,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return ctx;
}
