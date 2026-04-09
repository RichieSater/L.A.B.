import { beforeEach, describe, expect, it, vi } from 'vitest';

const getUser = vi.fn();
const findUserProfile = vi.fn();
const insertCalls: Array<{ table: unknown; payload: unknown }> = [];
const mockEnv = {
  buildVersion: 'test-build',
  labAdminEmails: null as string | null,
};
const updateWhere = vi.fn().mockResolvedValue(undefined);
const updateSet = vi.fn(() => ({ where: updateWhere }));
const update = vi.fn(() => ({ set: updateSet }));
const insert = vi.fn((table: unknown) => ({
  values: vi.fn((payload: unknown) => {
    insertCalls.push({ table, payload });
    return {
      onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
    };
  }),
}));

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
        taskPlanningAssignments: {
          findFirst: vi.fn(),
        },
      },
      insert,
      update,
  },
}));

vi.mock('../env', () => ({
  env: mockEnv,
}));

vi.mock('../google-calendar', () => ({
  deleteCalendarEvent: vi.fn(),
  exchangeGoogleCalendarCode: vi.fn(),
  isGoogleCalendarConfigured: vi.fn(() => false),
  upsertCalendarEvent: vi.fn(),
}));

describe('ensureUserRecords', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertCalls.length = 0;
    mockEnv.labAdminEmails = null;
    getUser.mockRejectedValue(new Error('Clerk unavailable'));
  });

  it('creates default rows when Clerk lookup fails for a new user', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { ensureUserRecords } = await import('../data');
    findUserProfile
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({
        id: 'user_123',
        displayName: null,
        primaryEmail: null,
        accountTier: 'free',
        schedulingEnabled: false,
        googleCalendarConnected: false,
        googleCalendarEmail: null,
        googleCalendarRefreshToken: null,
        createdAt: new Date('2026-04-05T12:00:00.000Z'),
        updatedAt: new Date('2026-04-05T12:00:00.000Z'),
      });

    await expect(ensureUserRecords('user_123')).resolves.toBeUndefined();

    expect(getUser).toHaveBeenCalledWith('user_123');
    expect(insert).toHaveBeenCalledTimes(5);
    expect(insertCalls[0]?.payload).toEqual({
      id: 'user_123',
      displayName: null,
      primaryEmail: null,
      accountTier: 'free',
    });
    expect(insertCalls.slice(1).map(call => call.payload)).toEqual([
      { userId: 'user_123', metrics: {} },
      { userId: 'user_123', logs: [] },
      { userId: 'user_123', assignments: {} },
      {
        userId: 'user_123',
        schemaVersion: 3,
        dailyPlanning: {
          entries: [],
        },
        weeklyFocus: {
          weeks: [],
        },
        weeklyReview: {
          entries: [],
        },
        strategicDashboard: {
          years: [],
          latestCompassInsights: null,
          latestCompassAdvisorContext: null,
        },
      },
    ]);

    consoleError.mockRestore();
  });

  it('promotes allowlisted emails to admin when Clerk returns identity details', async () => {
    mockEnv.labAdminEmails = 'richiesater@gmail.com';
    getUser.mockResolvedValue({
      firstName: 'Ritchie',
      lastName: 'Sater',
      primaryEmailAddress: { emailAddress: 'richiesater@gmail.com' },
      privateMetadata: {},
    });
    findUserProfile
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({
        id: 'user_admin',
        displayName: 'Ritchie Sater',
        primaryEmail: 'richiesater@gmail.com',
        accountTier: 'admin',
        schedulingEnabled: false,
        googleCalendarConnected: false,
        googleCalendarEmail: null,
        googleCalendarRefreshToken: null,
        createdAt: new Date('2026-04-05T12:00:00.000Z'),
        updatedAt: new Date('2026-04-05T12:00:00.000Z'),
      });

    const { ensureUserRecords } = await import('../data');

    await expect(ensureUserRecords('user_admin')).resolves.toBeUndefined();

    expect(insertCalls[0]?.payload).toEqual({
      id: 'user_admin',
      displayName: 'Ritchie Sater',
      primaryEmail: 'richiesater@gmail.com',
      accountTier: 'admin',
    });
  });
});
