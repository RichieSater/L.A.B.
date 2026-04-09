import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CURRENT_SCHEMA_VERSION } from '../../src/constants/schema';
import { createDefaultStrategicDashboardState } from '../../src/types/strategic-dashboard';
import {
  advisorStates,
  compassSessions,
  scheduledSessions,
  userAppMeta,
} from '../db/schema';

const getUser = vi.fn();
const userProfilesFindFirst = vi.fn();
const userAppMetaFindFirst = vi.fn();
const sharedMetricsFindFirst = vi.fn();
const quickLogsFindFirst = vi.fn();
const taskPlanningAssignmentsFindFirst = vi.fn();
const compassSessionsFindFirst = vi.fn();
const updateCalls: Array<{ table: unknown; payload: unknown }> = [];

let advisorRows: Array<{ advisorId: string; state: unknown }> = [];
let scheduledRows: Array<typeof scheduledSessions.$inferSelect> = [];
let completedCompassRows: Array<typeof compassSessions.$inferSelect> = [];
let updatedCompassRow: typeof compassSessions.$inferSelect | null = null;

const insert = vi.fn(() => ({
  values: vi.fn(() => ({
    onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
    onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
    returning: vi.fn().mockResolvedValue(updatedCompassRow ? [updatedCompassRow] : []),
  })),
}));

const update = vi.fn((table: unknown) => ({
  set: vi.fn((payload: unknown) => {
    updateCalls.push({ table, payload });

    return {
      where: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue(updatedCompassRow && table === compassSessions ? [updatedCompassRow] : []),
      })),
    };
  }),
}));

const select = vi.fn(() => ({
  from: vi.fn((table: unknown) => {
    if (table === advisorStates) {
      return {
        where: vi.fn().mockResolvedValue(advisorRows),
      };
    }

    if (table === scheduledSessions) {
      return {
        where: vi.fn(() => ({
          orderBy: vi.fn().mockResolvedValue(scheduledRows),
        })),
      };
    }

    if (table === compassSessions) {
      return {
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue(completedCompassRows),
          })),
        })),
      };
    }

    throw new Error('Unexpected table in select().from().');
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
        findFirst: userProfilesFindFirst,
      },
      userAppMeta: {
        findFirst: userAppMetaFindFirst,
      },
      sharedMetrics: {
        findFirst: sharedMetricsFindFirst,
      },
      quickLogs: {
        findFirst: quickLogsFindFirst,
      },
      taskPlanningAssignments: {
        findFirst: taskPlanningAssignmentsFindFirst,
      },
      compassSessions: {
        findFirst: compassSessionsFindFirst,
      },
    },
    insert,
    update,
    select,
  },
}));

vi.mock('../env', () => ({
  env: {
    buildVersion: 'test-build',
    labAdminEmails: null,
  },
}));

vi.mock('../google-calendar', () => ({
  deleteCalendarEvent: vi.fn(),
  exchangeGoogleCalendarCode: vi.fn(),
  isGoogleCalendarConfigured: vi.fn(() => false),
  upsertCalendarEvent: vi.fn(),
}));

function makeProfileRow() {
  return {
    id: 'user_123',
    displayName: null,
    primaryEmail: null,
    accountTier: 'free' as const,
    schedulingEnabled: false,
    googleCalendarConnected: false,
    googleCalendarEmail: null,
    googleCalendarRefreshToken: null,
    createdAt: new Date('2026-04-09T10:00:00.000Z'),
    updatedAt: new Date('2026-04-09T10:00:00.000Z'),
  };
}

describe('Compass persistence in server/data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateCalls.length = 0;
    advisorRows = [];
    scheduledRows = [];
    completedCompassRows = [];
    updatedCompassRow = null;

    getUser.mockResolvedValue({
      firstName: '',
      lastName: '',
      primaryEmailAddress: null,
      privateMetadata: {},
    });
    userProfilesFindFirst.mockResolvedValue(makeProfileRow());
    userAppMetaFindFirst.mockResolvedValue({
      userId: 'user_123',
      schemaVersion: CURRENT_SCHEMA_VERSION,
      dailyPlanning: { entries: [] },
      weeklyFocus: { weeks: [] },
      weeklyReview: { entries: [] },
      strategicDashboard: createDefaultStrategicDashboardState(),
      updatedAt: new Date('2026-04-09T10:00:00.000Z'),
    });
    sharedMetricsFindFirst.mockResolvedValue(undefined);
    quickLogsFindFirst.mockResolvedValue(undefined);
    taskPlanningAssignmentsFindFirst.mockResolvedValue(undefined);
  });

  it('stores latestCompassAdvisorContext when a Compass session is completed', async () => {
    const answers = {
      'past-highlights': { items: JSON.stringify(['Closed an old chapter']) },
      'past-proud': { main: 'I kept going.' },
      'perfect-day-overview': { main: 'A calm day with long stretches of focused work.' },
    };

    compassSessionsFindFirst.mockResolvedValue({
      id: 'compass-1',
      userId: 'user_123',
      planningYear: 2026,
      title: 'Golden Compass 2026',
      status: 'in_progress',
      currentScreen: 12,
      answers,
      insights: null,
      createdAt: new Date('2026-04-09T09:00:00.000Z'),
      updatedAt: new Date('2026-04-09T09:30:00.000Z'),
      completedAt: null,
    });
    updatedCompassRow = {
      id: 'compass-1',
      userId: 'user_123',
      planningYear: 2026,
      title: 'Golden Compass 2026',
      status: 'completed',
      currentScreen: 12,
      answers,
      insights: {
        annualGoals: [],
        dailyRituals: [],
        supportPeople: [],
      },
      createdAt: new Date('2026-04-09T09:00:00.000Z'),
      updatedAt: new Date('2026-04-09T10:00:00.000Z'),
      completedAt: new Date('2026-04-09T10:00:00.000Z'),
    };

    const { updateCompassSession } = await import('../data');
    await updateCompassSession('user_123', 'compass-1', { status: 'completed' });

    const metaUpdate = updateCalls.find(call => call.table === userAppMeta);
    expect(metaUpdate).toBeDefined();
    expect(metaUpdate?.payload).toEqual(
      expect.objectContaining({
        strategicDashboard: expect.objectContaining({
          latestCompassAdvisorContext: expect.objectContaining({
            sessionId: 'compass-1',
            planningYear: 2026,
            past: expect.objectContaining({
              highlights: ['Closed an old chapter'],
              proud: 'I kept going.',
            }),
            perfectDay: expect.objectContaining({
              overview: 'A calm day with long stretches of focused work.',
            }),
          }),
        }),
      }),
    );
  });

  it('backfills latestCompassAdvisorContext during bootstrap from the most recent completed session', async () => {
    const completedSession = {
      id: 'compass-older',
      userId: 'user_123',
      planningYear: 2026,
      title: 'Golden Compass 2026',
      status: 'completed' as const,
      currentScreen: 20,
      answers: {
        'past-highlights': { items: JSON.stringify(['Made the year feel different']) },
        'past-challenges': { main: 'Too much context switching.' },
        'perfect-day-overview': { main: 'A spacious day that still creates momentum.' },
        'perfect-day-relationships': { main: 'I am warm and available to the people I love.' },
      },
      insights: {
        annualGoals: ['Ship L.A.B.'],
        dailyRituals: ['Plan first'],
        supportPeople: ['Therapist'],
      },
      createdAt: new Date('2026-03-01T08:00:00.000Z'),
      updatedAt: new Date('2026-03-01T10:00:00.000Z'),
      completedAt: new Date('2026-03-01T10:00:00.000Z'),
    };

    completedCompassRows = [completedSession];
    userAppMetaFindFirst.mockResolvedValue({
      userId: 'user_123',
      schemaVersion: CURRENT_SCHEMA_VERSION,
      dailyPlanning: { entries: [] },
      weeklyFocus: { weeks: [] },
      weeklyReview: { entries: [] },
      strategicDashboard: {
        years: [],
        latestCompassInsights: completedSession.insights,
        latestCompassAdvisorContext: null,
      },
      updatedAt: new Date('2026-04-09T10:00:00.000Z'),
    });

    const { buildBootstrapResponse } = await import('../data');
    const response = await buildBootstrapResponse('user_123');

    expect(response.appState.strategicDashboard.latestCompassAdvisorContext).toEqual({
      sessionId: 'compass-older',
      planningYear: 2026,
      completedAt: '2026-03-01T10:00:00.000Z',
      past: {
        highlights: ['Made the year feel different'],
        proud: '',
        challenges: 'Too much context switching.',
        lessons: '',
        selfForgiveness: '',
      },
      perfectDay: {
        overview: 'A spacious day that still creates momentum.',
        body: '',
        work: '',
        relationships: 'I am warm and available to the people I love.',
      },
    });
  });
});
