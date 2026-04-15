import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '../../auth/auth-context';
import { ProtectedRoute } from '../../auth/ProtectedRoute';
import { APP_BUILD_VERSION } from '../../constants/build';
import { GOLDEN_COMPASS_PATH } from '../../constants/routes';
import { createDefaultAppState } from '../../state/init';
import { createCompassTestSession } from '../../testing/compass-test-data';
import type { BootstrapResponse } from '../../types/api';
import { CompassSessionPage } from '../CompassSessionPage';

const { useClerk, useUser, getBootstrap, getCompassSession } = vi.hoisted(() => ({
  useClerk: vi.fn(),
  useUser: vi.fn(),
  getBootstrap: vi.fn(),
  getCompassSession: vi.fn(),
}));

vi.mock('@clerk/react', () => ({
  useClerk,
  useUser,
}));

vi.mock('../../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../../lib/api')>('../../lib/api');
  return {
    ...actual,
    apiClient: {
      getBootstrap,
      getCompassSession,
    },
  };
});

vi.mock('../../components/compass/CompassSessionRunner', () => ({
  CompassSessionRunner: ({ initialSession }: { initialSession: { id: string } }) => (
    <div>runner:{initialSession.id}</div>
  ),
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

function RefreshableCompassRoute() {
  const { refreshBootstrap } = useAuth();

  return (
    <div>
      <button type="button" onClick={() => void refreshBootstrap()}>
        Refresh bootstrap
      </button>
      <CompassSessionPage />
    </div>
  );
}

describe('CompassSessionPage auth refresh continuity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useClerk.mockReturnValue({
      signOut: vi.fn().mockResolvedValue(undefined),
    });
    useUser.mockReturnValue({
      isLoaded: true,
      user: {
        id: 'user_123',
        primaryEmailAddress: { emailAddress: 'user@example.com' },
      },
    });
  });

  it('does not re-enter loading or refetch the session during a background auth refresh', async () => {
    const deferredRefresh = createDeferredPromise<BootstrapResponse>();

    getBootstrap
      .mockResolvedValueOnce(createBootstrapResponse())
      .mockReturnValueOnce(deferredRefresh.promise);
    getCompassSession.mockResolvedValue(createCompassTestSession({ id: 'compass-1' }));

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/golden-compass/compass-test-session']}>
          <Routes>
            <Route
              path="/golden-compass/:sessionId"
              element={(
                <ProtectedRoute>
                  <RefreshableCompassRoute />
                </ProtectedRoute>
              )}
            />
            <Route path={GOLDEN_COMPASS_PATH} element={<div>compass library</div>} />
            <Route path="/login" element={<div>Login page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );

    expect(await screen.findByText('runner:compass-1')).toBeInTheDocument();
    expect(getCompassSession).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Refresh bootstrap' }));

    await waitFor(() => {
      expect(getBootstrap).toHaveBeenCalledTimes(2);
    });
    expect(screen.getByText('runner:compass-1')).toBeInTheDocument();
    expect(screen.queryByText('Loading your Golden Compass session...')).not.toBeInTheDocument();
    expect(getCompassSession).toHaveBeenCalledTimes(1);

    await act(async () => {
      deferredRefresh.resolve(createBootstrapResponse());
      await deferredRefresh.promise;
    });

    expect(screen.getByText('runner:compass-1')).toBeInTheDocument();
    expect(getCompassSession).toHaveBeenCalledTimes(1);
  });
});
