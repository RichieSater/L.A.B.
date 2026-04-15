import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth, AuthProvider } from '../auth-context';
import { ProtectedRoute } from '../ProtectedRoute';
import { APP_BUILD_VERSION } from '../../constants/build';
import { createDefaultAppState } from '../../state/init';
import type { BootstrapResponse } from '../../types/api';

const { useClerk, useUser, getBootstrap, MockApiClientError } = vi.hoisted(() => {
  class HoistedMockApiClientError extends Error {
    error: string;
    code?: string;
    requestId?: string;
    status?: number;

    constructor(message: { error: string; code?: string; requestId?: string; status?: number }) {
      super(message.error);
      this.name = 'ApiClientError';
      this.error = message.error;
      this.code = message.code;
      this.requestId = message.requestId;
      this.status = message.status;
    }
  }

  return {
    useClerk: vi.fn(),
    useUser: vi.fn(),
    getBootstrap: vi.fn(),
    MockApiClientError: HoistedMockApiClientError,
  };
});

vi.mock('@clerk/react', () => ({
  useClerk,
  useUser,
}));

vi.mock('../../lib/api', () => ({
  ApiClientError: MockApiClientError,
  apiClient: {
    getBootstrap,
    updateProfile: vi.fn(),
  },
  isApiClientError: (error: unknown) => error instanceof MockApiClientError,
}));

function createBootstrapResponse(
  overrides: Partial<BootstrapResponse> = {},
): BootstrapResponse {
  return {
    profile: {
      displayName: 'Ritchie',
      schedulingEnabled: false,
      googleCalendarConnected: false,
      googleCalendarEmail: null,
      accountTier: 'premium',
    },
    appState: createDefaultAppState(),
    scheduledSessions: [],
    buildVersion: APP_BUILD_VERSION,
    ...overrides,
  };
}

function createDeferredPromise<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

function AuthProbe() {
  const { loading, bootstrapData, refreshBootstrap } = useAuth();

  return (
    <div>
      <p>{loading ? 'loading' : 'ready'}</p>
      <p>{bootstrapData?.profile.displayName ?? 'no-data'}</p>
      <button onClick={() => void refreshBootstrap()}>Refresh bootstrap</button>
    </div>
  );
}

function ProtectedRefreshProbe() {
  const { refreshBootstrap } = useAuth();

  return (
    <div>
      <button onClick={() => void refreshBootstrap()}>Refresh bootstrap</button>
      <div>Protected content</div>
    </div>
  );
}

describe('AuthProvider bootstrap continuity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useClerk.mockReturnValue({
      signOut: vi.fn().mockResolvedValue(undefined),
    });
  });

  it('does not refetch bootstrap when Clerk returns a new user object for the same user id', async () => {
    let userValue = {
      isLoaded: true,
      user: {
        id: 'user_123',
        primaryEmailAddress: { emailAddress: 'user@example.com' },
      },
    };

    useUser.mockImplementation(() => userValue);
    getBootstrap.mockResolvedValue(createBootstrapResponse());

    const { rerender } = render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await screen.findByText('ready');
    expect(getBootstrap).toHaveBeenCalledTimes(1);

    userValue = {
      isLoaded: true,
      user: {
        id: 'user_123',
        primaryEmailAddress: { emailAddress: 'user@example.com' },
      },
    };

    rerender(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('ready')).toBeInTheDocument();
    });
    expect(getBootstrap).toHaveBeenCalledTimes(1);
  });

  it('keeps loading false during refreshBootstrap when a bootstrap snapshot already exists', async () => {
    const deferredRefresh = createDeferredPromise<BootstrapResponse>();

    useUser.mockReturnValue({
      isLoaded: true,
      user: {
        id: 'user_123',
        primaryEmailAddress: { emailAddress: 'user@example.com' },
      },
    });
    getBootstrap
      .mockResolvedValueOnce(createBootstrapResponse())
      .mockReturnValueOnce(deferredRefresh.promise);

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await screen.findByText('ready');

    fireEvent.click(screen.getByRole('button', { name: 'Refresh bootstrap' }));

    await waitFor(() => {
      expect(getBootstrap).toHaveBeenCalledTimes(2);
    });
    expect(screen.getByText('ready')).toBeInTheDocument();
    expect(screen.getByText('Ritchie')).toBeInTheDocument();

    await act(async () => {
      deferredRefresh.resolve(createBootstrapResponse({
        profile: {
          displayName: 'Ritchie Updated',
          schedulingEnabled: false,
          googleCalendarConnected: false,
          googleCalendarEmail: null,
          accountTier: 'premium',
        },
      }));
      await deferredRefresh.promise;
    });

    await waitFor(() => {
      expect(screen.getByText('Ritchie Updated')).toBeInTheDocument();
    });
    expect(screen.getByText('ready')).toBeInTheDocument();
  });

  it('keeps protected children mounted during a background bootstrap refresh', async () => {
    const deferredRefresh = createDeferredPromise<BootstrapResponse>();

    useUser.mockReturnValue({
      isLoaded: true,
      user: {
        id: 'user_123',
        primaryEmailAddress: { emailAddress: 'user@example.com' },
      },
    });
    getBootstrap
      .mockResolvedValueOnce(createBootstrapResponse())
      .mockReturnValueOnce(deferredRefresh.promise);

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route
              path="/"
              element={(
                <ProtectedRoute>
                  <ProtectedRefreshProbe />
                </ProtectedRoute>
              )}
            />
            <Route path="/login" element={<div>Login page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );

    await screen.findByText('Protected content');

    fireEvent.click(screen.getByRole('button', { name: 'Refresh bootstrap' }));

    await waitFor(() => {
      expect(getBootstrap).toHaveBeenCalledTimes(2);
    });
    expect(screen.getByText('Protected content')).toBeInTheDocument();
    expect(screen.queryByText(/^Loading\.\.\.$/)).not.toBeInTheDocument();

    await act(async () => {
      deferredRefresh.resolve(createBootstrapResponse());
      await deferredRefresh.promise;
    });

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  it('still shows the protected-route loading state for a first bootstrap', async () => {
    const initialBootstrap = createDeferredPromise<BootstrapResponse>();

    useUser.mockReturnValue({
      isLoaded: true,
      user: {
        id: 'user_123',
        primaryEmailAddress: { emailAddress: 'user@example.com' },
      },
    });
    getBootstrap.mockReturnValue(initialBootstrap.promise);

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route
              path="/"
              element={(
                <ProtectedRoute>
                  <ProtectedRefreshProbe />
                </ProtectedRoute>
              )}
            />
            <Route path="/login" element={<div>Login page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await act(async () => {
      initialBootstrap.resolve(createBootstrapResponse());
      await initialBootstrap.promise;
    });

    await waitFor(() => {
      expect(screen.getByText('Protected content')).toBeInTheDocument();
    });
  });
});
