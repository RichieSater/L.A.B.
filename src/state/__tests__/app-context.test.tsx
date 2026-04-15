import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BootstrapResponse } from '../../types/api';
import { APP_BUILD_VERSION } from '../../constants/build';
import { createDefaultAppState } from '../init';
import { AppProvider, useAppState } from '../app-context';

const { useAuth, apiClient } = vi.hoisted(() => ({
  useAuth: vi.fn(),
  apiClient: {
    saveAppState: vi.fn(),
  },
}));

vi.mock('../../auth/auth-context', () => ({
  useAuth,
}));

vi.mock('../../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../../lib/api')>('../../lib/api');
  return {
    ...actual,
    apiClient,
  };
});

function createBootstrapData(overrides: Partial<BootstrapResponse> = {}): BootstrapResponse {
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

function AppStateProbe() {
  const { state, dispatch } = useAppState();
  const currentHeadline = state.dailyPlanning.entries[0]?.headline ?? 'none';

  return (
    <div>
      <p>{currentHeadline}</p>
      <button
        type="button"
        onClick={() => {
          dispatch({
            type: 'SET_DAILY_PLANNING_FIELD',
            payload: {
              date: '2026-04-15',
              field: 'headline',
              value: 'Protect the morning',
            },
          });
        }}
      >
        Update headline
      </button>
    </div>
  );
}

describe('AppProvider autosave dedupe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    apiClient.saveAppState.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not save immediately after initializing from bootstrap data', async () => {
    useAuth.mockReturnValue({
      bootstrapData: createBootstrapData(),
      bootstrapError: null,
      loading: false,
    });

    render(
      <AppProvider>
        <AppStateProbe />
      </AppProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    expect(apiClient.saveAppState).not.toHaveBeenCalled();
  });

  it('still saves genuine reducer changes after bootstrap initialization', async () => {
    useAuth.mockReturnValue({
      bootstrapData: createBootstrapData(),
      bootstrapError: null,
      loading: false,
    });

    render(
      <AppProvider>
        <AppStateProbe />
      </AppProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Update headline' }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    expect(apiClient.saveAppState).toHaveBeenCalledTimes(1);
    expect(apiClient.saveAppState).toHaveBeenCalledWith(expect.objectContaining({
      dailyPlanning: expect.objectContaining({
        entries: [
          expect.objectContaining({
            date: '2026-04-15',
            headline: 'Protect the morning',
          }),
        ],
      }),
    }));
  });

  it('does not save again when bootstrap refresh returns the same app-state snapshot', async () => {
    let authValue = {
      bootstrapData: createBootstrapData(),
      bootstrapError: null,
      loading: false,
    };

    useAuth.mockImplementation(() => authValue);

    const { rerender } = render(
      <AppProvider>
        <AppStateProbe />
      </AppProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    expect(apiClient.saveAppState).not.toHaveBeenCalled();

    authValue = {
      bootstrapData: createBootstrapData(),
      bootstrapError: null,
      loading: false,
    };

    rerender(
      <AppProvider>
        <AppStateProbe />
      </AppProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    expect(apiClient.saveAppState).not.toHaveBeenCalled();
  });
});
