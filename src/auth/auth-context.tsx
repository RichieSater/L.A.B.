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
import { apiClient, isApiClientError, type ApiClientError } from '../lib/api';
import type { ApiError, BootstrapResponse, AuthUser, UserProfile } from '../types/api';
import { APP_BUILD_VERSION } from '../constants/build';

interface AuthContextValue {
  user: AuthUser | null;
  profile: UserProfile | null;
  bootstrapData: BootstrapResponse | null;
  bootstrapError: Error | ApiClientError | ApiError | null;
  loading: boolean;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshBootstrap: () => Promise<void>;
  retryBootstrap: () => Promise<void>;
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
  const [bootstrapError, setBootstrapError] = useState<Error | ApiClientError | ApiError | null>(null);
  const [bootstrapping, setBootstrapping] = useState(false);

  const fetchBootstrap = useCallback(async (showRecoveryScreen: boolean) => {
    if (!clerkUser) {
      setBootstrapData(null);
      setBootstrapError(null);
      return;
    }

    setBootstrapping(true);
    setBootstrapError(null);

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
      setBootstrapError(null);
    } catch (error) {
      const normalizedError = isApiClientError(error)
        ? error
        : error instanceof Error
          ? error
          : new Error('Failed to bootstrap app state.');

      if (showRecoveryScreen) {
        setBootstrapData(null);
        setBootstrapError(normalizedError);
        return;
      }

      throw normalizedError;
    } finally {
      setBootstrapping(false);
    }
  }, [clerkUser]);

  const refreshBootstrap = useCallback(async () => {
    await fetchBootstrap(!bootstrapData);
  }, [bootstrapData, fetchBootstrap]);

  const retryBootstrap = useCallback(async () => {
    await fetchBootstrap(true);
  }, [fetchBootstrap]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!clerkUser) {
      setBootstrapData(null);
      setBootstrapError(null);
      setBootstrapping(false);
      return;
    }

    retryBootstrap().catch(error => {
      console.error('Failed to bootstrap app state:', error);
      setBootstrapping(false);
    });
  }, [isLoaded, clerkUser, retryBootstrap]);

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
    setBootstrapError(null);
  }, [clerk]);

  const loading = !isLoaded || (!!clerkUser && (bootstrapping || (!bootstrapData && !bootstrapError)));
  const user = mapUser(clerkUser);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile: bootstrapData?.profile ?? null,
        bootstrapData,
        bootstrapError,
        loading,
        signOut,
        updateProfile,
        refreshBootstrap,
        retryBootstrap,
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
