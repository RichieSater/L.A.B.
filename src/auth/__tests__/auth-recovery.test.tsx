import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '../auth-context';
import { APP_BUILD_VERSION } from '../../constants/build';

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

function AuthProbe() {
  const { loading, bootstrapError, bootstrapData, retryBootstrap } = useAuth();

  return (
    <div>
      <p>{loading ? 'loading' : 'ready'}</p>
      <p>{bootstrapError ? 'error' : 'no-error'}</p>
      <p>{bootstrapData ? bootstrapData.profile.displayName : 'no-data'}</p>
      <button onClick={() => void retryBootstrap()}>Retry bootstrap</button>
    </div>
  );
}

describe('auth recovery', () => {
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

  it('exposes a bootstrap error and recovers on retry', async () => {
    getBootstrap
      .mockRejectedValueOnce(new MockApiClientError({
        error: 'A server error has occurred',
        code: 'BOOTSTRAP_FAILED',
        requestId: 'iad1::request-1',
        status: 500,
      }))
      .mockResolvedValueOnce({
        profile: {
          displayName: 'Ritchie',
          schedulingEnabled: false,
          googleCalendarConnected: false,
          googleCalendarEmail: null,
        },
        appState: {} as never,
        scheduledSessions: [],
        buildVersion: APP_BUILD_VERSION,
      });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('ready')).toBeInTheDocument();
      expect(screen.getByText('error')).toBeInTheDocument();
      expect(screen.getByText('no-data')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Retry bootstrap'));

    await waitFor(() => {
      expect(screen.getByText('ready')).toBeInTheDocument();
      expect(screen.getByText('no-error')).toBeInTheDocument();
      expect(screen.getByText('Ritchie')).toBeInTheDocument();
    });
  });
});
