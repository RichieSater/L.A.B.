import { beforeEach, describe, expect, it, vi } from 'vitest';

const getUser = vi.fn();
const findUserProfile = vi.fn();
const insert = vi.fn(() => ({
  values: vi.fn(() => ({
    onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
  })),
}));
const selectWhere = vi.fn();
const selectFrom = vi.fn(() => ({ where: selectWhere }));
const select = vi.fn(() => ({ from: selectFrom }));
const updateWhere = vi.fn().mockResolvedValue(undefined);
const updateSet = vi.fn(() => ({ where: updateWhere }));
const update = vi.fn(() => ({ set: updateSet }));
const exchangeGoogleCalendarCode = vi.fn();
const upsertCalendarEvent = vi.fn();
const deleteCalendarEvent = vi.fn();

vi.mock('../auth', () => ({
  clerkClient: {
    users: {
      getUser,
    },
  },
}));

vi.mock('../db/client', () => ({
  db: {
    query: {
      userProfiles: {
        findFirst: findUserProfile,
      },
    },
    insert,
    select,
    update,
  },
}));

vi.mock('../env', () => ({
  env: {
    buildVersion: 'test-build',
    labAdminEmails: null,
  },
}));

vi.mock('../google-calendar', () => ({
  deleteCalendarEvent,
  exchangeGoogleCalendarCode,
  isGoogleCalendarConfigured: vi.fn(() => true),
  upsertCalendarEvent,
}));

function createScheduledRow(overrides: Partial<{
  id: string;
  advisorId: string;
  scheduledAt: Date;
  durationMinutes: number;
  windowMinutes: number;
  status: 'scheduled' | 'completed' | 'missed' | 'cancelled';
  calendarSyncStatus: 'disabled' | 'pending' | 'synced' | 'failed';
  googleCalendarEventId: string | null;
  createdAt: Date;
  updatedAt: Date;
}> = {}) {
  return {
    id: 'session-1',
    userId: 'user_123',
    advisorId: 'career',
    scheduledAt: new Date('2026-03-30T14:00:00.000Z'),
    durationMinutes: 60,
    windowMinutes: 60,
    status: 'scheduled' as const,
    calendarSyncStatus: 'disabled' as const,
    googleCalendarEventId: null,
    createdAt: new Date('2026-03-29T10:00:00.000Z'),
    updatedAt: new Date('2026-03-29T10:00:00.000Z'),
    ...overrides,
  };
}

describe('Google Calendar lifecycle sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockResolvedValue({
      firstName: 'Test',
      lastName: 'User',
      primaryEmailAddress: { emailAddress: 'test@example.com' },
    });
  });

  it('backfills existing scheduled sessions after Google Calendar connects', async () => {
    const existingProfile = {
      id: 'user_123',
      displayName: 'Test User',
      primaryEmail: 'test@example.com',
      accountTier: 'premium' as const,
      schedulingEnabled: true,
      googleCalendarConnected: false,
      googleCalendarEmail: null,
      googleCalendarRefreshToken: null,
      createdAt: new Date('2026-03-29T10:00:00.000Z'),
      updatedAt: new Date('2026-03-29T10:00:00.000Z'),
    };
    const connectedProfile = {
      ...existingProfile,
      googleCalendarConnected: true,
      googleCalendarEmail: 'lab@example.com',
      googleCalendarRefreshToken: 'refresh-token',
    };

    findUserProfile
      .mockResolvedValueOnce(existingProfile)
      .mockResolvedValueOnce(connectedProfile);
    selectWhere.mockResolvedValueOnce([
      createScheduledRow({ id: 'session-a', advisorId: 'career' }),
      createScheduledRow({
        id: 'session-b',
        advisorId: 'fitness',
        scheduledAt: new Date('2026-03-31T15:00:00.000Z'),
      }),
    ]);
    exchangeGoogleCalendarCode.mockResolvedValue({
      refreshToken: 'refresh-token',
      email: 'lab@example.com',
    });
    upsertCalendarEvent
      .mockResolvedValueOnce('google-event-a')
      .mockRejectedValueOnce(new Error('sync failed'));

    const { connectGoogleCalendar } = await import('../data');
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(connectGoogleCalendar('user_123', 'auth-code')).resolves.toEqual({
      displayName: 'Test User',
      schedulingEnabled: true,
      googleCalendarConnected: true,
      googleCalendarEmail: 'lab@example.com',
      accountTier: 'premium',
    });

    expect(exchangeGoogleCalendarCode).toHaveBeenCalledWith('auth-code');
    expect(upsertCalendarEvent).toHaveBeenCalledTimes(2);
    expect(updateSet).toHaveBeenCalledWith(expect.objectContaining({
      googleCalendarConnected: true,
      googleCalendarEmail: 'lab@example.com',
      googleCalendarRefreshToken: 'refresh-token',
    }));
    expect(updateSet).toHaveBeenCalledWith(expect.objectContaining({
      calendarSyncStatus: 'synced',
      googleCalendarEventId: 'google-event-a',
    }));
    expect(updateSet).toHaveBeenCalledWith(expect.objectContaining({
      calendarSyncStatus: 'failed',
    }));
    expect(consoleWarn).toHaveBeenCalledTimes(1);

    consoleWarn.mockRestore();
  });

  it('clears session sync state and still disconnects when event cleanup is best-effort', async () => {
    const connectedProfile = {
      id: 'user_123',
      displayName: 'Test User',
      primaryEmail: 'test@example.com',
      accountTier: 'premium' as const,
      schedulingEnabled: true,
      googleCalendarConnected: true,
      googleCalendarEmail: 'lab@example.com',
      googleCalendarRefreshToken: 'refresh-token',
      createdAt: new Date('2026-03-29T10:00:00.000Z'),
      updatedAt: new Date('2026-03-29T10:00:00.000Z'),
    };
    const disconnectedProfile = {
      ...connectedProfile,
      googleCalendarConnected: false,
      googleCalendarEmail: null,
      googleCalendarRefreshToken: null,
    };

    findUserProfile
      .mockResolvedValueOnce(connectedProfile)
      .mockResolvedValueOnce(connectedProfile)
      .mockResolvedValueOnce(disconnectedProfile);
    selectWhere.mockResolvedValueOnce([
      createScheduledRow({
        id: 'session-a',
        googleCalendarEventId: 'google-event-a',
        calendarSyncStatus: 'synced',
      }),
      createScheduledRow({
        id: 'session-b',
        googleCalendarEventId: null,
        calendarSyncStatus: 'disabled',
      }),
    ]);
    deleteCalendarEvent.mockRejectedValueOnce(new Error('delete failed'));

    const { disconnectGoogleCalendar } = await import('../data');
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(disconnectGoogleCalendar('user_123')).resolves.toEqual({
      displayName: 'Test User',
      schedulingEnabled: true,
      googleCalendarConnected: false,
      googleCalendarEmail: null,
      accountTier: 'premium',
    });

    expect(deleteCalendarEvent).toHaveBeenCalledWith('refresh-token', 'google-event-a');
    expect(updateSet).toHaveBeenCalledWith(expect.objectContaining({
      calendarSyncStatus: 'disabled',
      googleCalendarEventId: null,
    }));
    expect(updateSet).toHaveBeenCalledWith(expect.objectContaining({
      googleCalendarConnected: false,
      googleCalendarEmail: null,
      googleCalendarRefreshToken: null,
    }));
    expect(consoleWarn).toHaveBeenCalledTimes(1);

    consoleWarn.mockRestore();
  });
});
