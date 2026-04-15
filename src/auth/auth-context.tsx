/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useClerk, useUser } from '@clerk/react';
import { apiClient, isApiClientError, type ApiClientError } from '../lib/api';
import type {
  ApiError,
  BootstrapResponse,
  AuthUser,
  UpdateUserProfileInput,
  UserProfile,
} from '../types/api';
import { APP_BUILD_VERSION } from '../constants/build';

interface AuthContextValue {
  user: AuthUser | null;
  profile: UserProfile | null;
  bootstrapData: BootstrapResponse | null;
  bootstrapError: Error | ApiClientError | ApiError | null;
  loading: boolean;
  signOut: () => Promise<void>;
  updateProfile: (updates: UpdateUserProfileInput) => Promise<void>;
  refreshBootstrap: () => Promise<void>;
  retryBootstrap: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, user: clerkUser } = useUser();
  const clerk = useClerk();
  const clerkUserId = clerkUser?.id ?? null;
  const [bootstrapData, setBootstrapData] = useState<BootstrapResponse | null>(null);
  const [bootstrapDataUserId, setBootstrapDataUserId] = useState<string | null>(null);
  const [bootstrapError, setBootstrapError] = useState<Error | ApiClientError | ApiError | null>(null);
  const [bootstrapErrorUserId, setBootstrapErrorUserId] = useState<string | null>(null);
  const activeUserIdRef = useRef<string | null>(clerkUserId);
  const bootstrapRequestIdRef = useRef(0);

  useEffect(() => {
    activeUserIdRef.current = clerkUserId;
  }, [clerkUserId]);

  const fetchBootstrap = useCallback(async (
    userId: string,
    showRecoveryScreen: boolean,
  ) => {
    const requestId = bootstrapRequestIdRef.current + 1;
    bootstrapRequestIdRef.current = requestId;
    setBootstrapError(null);
    setBootstrapErrorUserId(null);

    try {
      const nextData = await apiClient.getBootstrap();

      if (activeUserIdRef.current !== userId || bootstrapRequestIdRef.current !== requestId) {
        return;
      }

      if (nextData.buildVersion !== APP_BUILD_VERSION && typeof window !== 'undefined') {
        const reloadKey = `lab-build-reload:${nextData.buildVersion}`;
        if (!window.sessionStorage.getItem(reloadKey)) {
          window.sessionStorage.setItem(reloadKey, '1');
          window.location.replace(`${window.location.pathname}?refresh=${Date.now()}${window.location.hash}`);
          return;
        }
      }

      setBootstrapDataUserId(userId);
      setBootstrapData(nextData);
      setBootstrapError(null);
      setBootstrapErrorUserId(null);
    } catch (error) {
      if (activeUserIdRef.current !== userId || bootstrapRequestIdRef.current !== requestId) {
        return;
      }

      const normalizedError = isApiClientError(error)
        ? error
        : error instanceof Error
          ? error
          : new Error('Failed to bootstrap app state.');

      if (showRecoveryScreen) {
        setBootstrapData(null);
        setBootstrapDataUserId(null);
        setBootstrapError(normalizedError);
        setBootstrapErrorUserId(userId);
        return;
      }

      throw normalizedError;
    }
  }, []);

  const currentBootstrapData = clerkUserId && bootstrapDataUserId === clerkUserId ? bootstrapData : null;
  const currentBootstrapError = clerkUserId && bootstrapErrorUserId === clerkUserId ? bootstrapError : null;

  const refreshBootstrap = useCallback(async () => {
    if (!clerkUserId) {
      return;
    }

    await fetchBootstrap(clerkUserId, !currentBootstrapData);
  }, [clerkUserId, currentBootstrapData, fetchBootstrap]);

  const retryBootstrap = refreshBootstrap;

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!clerkUserId) {
      bootstrapRequestIdRef.current += 1;
      queueMicrotask(() => {
        if (activeUserIdRef.current !== null) {
          return;
        }

        setBootstrapData(null);
        setBootstrapDataUserId(null);
        setBootstrapError(null);
        setBootstrapErrorUserId(null);
      });
      return;
    }

    queueMicrotask(() => {
      if (activeUserIdRef.current !== clerkUserId) {
        return;
      }

      fetchBootstrap(clerkUserId, true).catch(error => {
        console.error('Failed to bootstrap app state:', error);
      });
    });
  }, [clerkUserId, fetchBootstrap, isLoaded]);

  const updateProfile = useCallback(async (updates: UpdateUserProfileInput) => {
    const profile = await apiClient.updateProfile(updates);
    setBootstrapData(prev => {
      if (!prev || bootstrapDataUserId !== clerkUserId) {
        return prev;
      }

      return {
        ...prev,
        profile,
      };
    });
  }, [bootstrapDataUserId, clerkUserId]);

  const signOut = useCallback(async () => {
    await clerk.signOut();
    bootstrapRequestIdRef.current += 1;
    setBootstrapData(null);
    setBootstrapDataUserId(null);
    setBootstrapError(null);
    setBootstrapErrorUserId(null);
  }, [clerk]);

  const loading = !isLoaded || (!!clerkUserId && !currentBootstrapData && !currentBootstrapError);
  const user: AuthUser | null = clerkUser
    ? {
        id: clerkUser.id,
        primaryEmailAddress: clerkUser.primaryEmailAddress?.emailAddress ?? null,
      }
    : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile: currentBootstrapData?.profile ?? null,
        bootstrapData: currentBootstrapData,
        bootstrapError: currentBootstrapError,
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
