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
const deleteCalls: Array<unknown> = [];

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

const remove = vi.fn((table: unknown) => ({
  where: vi.fn().mockImplementation(() => {
    deleteCalls.push(table);
    return Promise.resolve(undefined);
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
          orderBy: vi.fn().mockResolvedValue(completedCompassRows),
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
    delete: remove,
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
    deleteCalls.length = 0;
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
      achievedAt: null,
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
      achievedAt: null,
    };
    completedCompassRows = [updatedCompassRow];

    const { updateCompassSession } = await import('../data');
    await updateCompassSession('user_123', 'compass-1', { status: 'completed' });

    const metaUpdate = updateCalls.find(call => call.table === userAppMeta);
    expect(metaUpdate).toBeDefined();
    expect(metaUpdate?.payload).toEqual(
      expect.objectContaining({
        strategicDashboard: expect.objectContaining({
          activeCompassSessionId: 'compass-1',
          latestCompassAdvisorContext: expect.objectContaining({
            sessionId: 'compass-1',
            planningYear: 2026,
            bonfire: expect.objectContaining({
              items: [],
            }),
            past: expect.objectContaining({
              highlights: ['Closed an old chapter'],
              proud: 'I kept going.',
            }),
            perfectDay: expect.objectContaining({
              dayNarrative: 'A calm day with long stretches of focused work.',
            }),
          }),
          latestCompassInsights: {
            annualGoals: [],
            dailyRituals: [],
            supportPeople: [],
          },
          achievedCompassSummaries: [],
        }),
      }),
    );
  });

  it('lets a previously completed Compass become the active Compass without rewriting year state', async () => {
    const olderCompleted = {
      id: 'compass-older',
      userId: 'user_123',
      planningYear: 2025,
      title: 'Golden Compass 2025',
      status: 'completed' as const,
      currentScreen: 12,
      answers: {
        'past-highlights': { items: JSON.stringify(['Old but still relevant']) },
      },
      insights: {
        annualGoals: ['Protect the quiet rebuild'],
        dailyRituals: ['Slow the morning down'],
        supportPeople: ['Coach'],
      },
      createdAt: new Date('2025-12-30T09:00:00.000Z'),
      updatedAt: new Date('2025-12-30T10:00:00.000Z'),
      completedAt: new Date('2025-12-30T10:00:00.000Z'),
      achievedAt: null,
    };
    const newerCompleted = {
      ...olderCompleted,
      id: 'compass-newer',
      planningYear: 2026,
      title: 'Golden Compass 2026',
      insights: {
        annualGoals: ['Ship L.A.B.'],
        dailyRituals: ['Plan first'],
        supportPeople: ['Therapist'],
      },
      updatedAt: new Date('2026-03-01T10:00:00.000Z'),
      completedAt: new Date('2026-03-01T10:00:00.000Z'),
    };

    compassSessionsFindFirst.mockResolvedValue(olderCompleted);
    userAppMetaFindFirst.mockResolvedValue({
      userId: 'user_123',
      schemaVersion: CURRENT_SCHEMA_VERSION,
      dailyPlanning: { entries: [] },
      weeklyFocus: { weeks: [] },
      weeklyReview: { entries: [] },
      strategicDashboard: {
        years: [],
        activeCompassSessionId: 'compass-newer',
        latestCompassInsights: newerCompleted.insights,
        latestCompassAdvisorContext: null,
        achievedCompassSummaries: [],
      },
      updatedAt: new Date('2026-04-09T10:00:00.000Z'),
    });
    updatedCompassRow = olderCompleted;
    completedCompassRows = [newerCompleted, olderCompleted];

    const { updateCompassSession } = await import('../data');
    await updateCompassSession('user_123', 'compass-older', { setActive: true });

    const metaUpdate = updateCalls.find(call => call.table === userAppMeta);
    expect(metaUpdate?.payload).toEqual(
      expect.objectContaining({
        strategicDashboard: expect.objectContaining({
          activeCompassSessionId: 'compass-older',
          latestCompassInsights: olderCompleted.insights,
        }),
      }),
    );
  });

  it('stores achieved Compass summaries separately from the active Compass cache', async () => {
    const completedSession = {
      id: 'compass-achieved',
      userId: 'user_123',
      planningYear: 2026,
      title: 'Golden Compass 2026',
      status: 'completed' as const,
      currentScreen: 12,
      answers: {},
      insights: {
        annualGoals: ['Ship L.A.B.'],
        dailyRituals: ['Plan first'],
        supportPeople: ['Therapist'],
      },
      createdAt: new Date('2026-04-09T09:00:00.000Z'),
      updatedAt: new Date('2026-04-09T10:00:00.000Z'),
      completedAt: new Date('2026-04-09T10:00:00.000Z'),
      achievedAt: null,
    };

    compassSessionsFindFirst.mockResolvedValue(completedSession);
    updatedCompassRow = {
      ...completedSession,
      achievedAt: new Date('2026-04-12T10:00:00.000Z'),
    };
    completedCompassRows = [updatedCompassRow];

    const { updateCompassSession } = await import('../data');
    await updateCompassSession('user_123', 'compass-achieved', { achieved: true });

    const metaUpdate = updateCalls.find(call => call.table === userAppMeta);
    expect(metaUpdate?.payload).toEqual(
      expect.objectContaining({
        strategicDashboard: expect.objectContaining({
          activeCompassSessionId: 'compass-achieved',
          achievedCompassSummaries: [
            expect.objectContaining({
              sessionId: 'compass-achieved',
              title: 'Golden Compass 2026',
              planningYear: 2026,
            }),
          ],
        }),
      }),
    );
  });

  it('falls back to the next newest completed Compass when the active one is deleted', async () => {
    const activeCompleted = {
      id: 'compass-active',
      userId: 'user_123',
      planningYear: 2026,
      title: 'Golden Compass 2026',
      status: 'completed' as const,
      currentScreen: 12,
      answers: {},
      insights: {
        annualGoals: ['Ship L.A.B.'],
        dailyRituals: ['Plan first'],
        supportPeople: ['Therapist'],
      },
      createdAt: new Date('2026-04-09T09:00:00.000Z'),
      updatedAt: new Date('2026-04-09T10:00:00.000Z'),
      completedAt: new Date('2026-04-09T10:00:00.000Z'),
      achievedAt: null,
    };
    const fallbackCompleted = {
      ...activeCompleted,
      id: 'compass-fallback',
      planningYear: 2025,
      title: 'Golden Compass 2025',
      insights: {
        annualGoals: ['Stay steady'],
        dailyRituals: ['Protect sleep'],
        supportPeople: ['Coach'],
      },
      updatedAt: new Date('2025-12-09T10:00:00.000Z'),
      completedAt: new Date('2025-12-09T10:00:00.000Z'),
    };

    compassSessionsFindFirst.mockResolvedValue(activeCompleted);
    userAppMetaFindFirst.mockResolvedValue({
      userId: 'user_123',
      schemaVersion: CURRENT_SCHEMA_VERSION,
      dailyPlanning: { entries: [] },
      weeklyFocus: { weeks: [] },
      weeklyReview: { entries: [] },
      strategicDashboard: {
        years: [],
        activeCompassSessionId: 'compass-active',
        latestCompassInsights: activeCompleted.insights,
        latestCompassAdvisorContext: null,
        achievedCompassSummaries: [],
      },
      updatedAt: new Date('2026-04-09T10:00:00.000Z'),
    });
    completedCompassRows = [fallbackCompleted];

    const { deleteCompassSession } = await import('../data');
    const deleted = await deleteCompassSession('user_123', 'compass-active');

    expect(deleted).toBe(true);
    expect(deleteCalls).toContain(compassSessions);
    const metaUpdate = updateCalls.find(call => call.table === userAppMeta);
    expect(metaUpdate?.payload).toEqual(
      expect.objectContaining({
        strategicDashboard: expect.objectContaining({
          activeCompassSessionId: 'compass-fallback',
          latestCompassInsights: fallbackCompleted.insights,
        }),
      }),
    );
  });

  it('clears active Compass caches when the last completed Compass is deleted', async () => {
    const onlyCompleted = {
      id: 'compass-only',
      userId: 'user_123',
      planningYear: 2026,
      title: 'Golden Compass 2026',
      status: 'completed' as const,
      currentScreen: 12,
      answers: {},
      insights: {
        annualGoals: ['Ship L.A.B.'],
        dailyRituals: ['Plan first'],
        supportPeople: ['Therapist'],
      },
      createdAt: new Date('2026-04-09T09:00:00.000Z'),
      updatedAt: new Date('2026-04-09T10:00:00.000Z'),
      completedAt: new Date('2026-04-09T10:00:00.000Z'),
      achievedAt: new Date('2026-04-12T10:00:00.000Z'),
    };

    compassSessionsFindFirst.mockResolvedValue(onlyCompleted);
    userAppMetaFindFirst.mockResolvedValue({
      userId: 'user_123',
      schemaVersion: CURRENT_SCHEMA_VERSION,
      dailyPlanning: { entries: [] },
      weeklyFocus: { weeks: [] },
      weeklyReview: { entries: [] },
      strategicDashboard: {
        years: [],
        activeCompassSessionId: 'compass-only',
        latestCompassInsights: onlyCompleted.insights,
        latestCompassAdvisorContext: null,
        achievedCompassSummaries: [
          {
            sessionId: 'compass-only',
            title: 'Golden Compass 2026',
            planningYear: 2026,
            completedAt: '2026-04-09T10:00:00.000Z',
            achievedAt: '2026-04-12T10:00:00.000Z',
          },
        ],
      },
      updatedAt: new Date('2026-04-09T10:00:00.000Z'),
    });
    completedCompassRows = [];

    const { deleteCompassSession } = await import('../data');
    await deleteCompassSession('user_123', 'compass-only');

    const metaUpdate = updateCalls.find(call => call.table === userAppMeta);
    expect(metaUpdate?.payload).toEqual(
      expect.objectContaining({
        strategicDashboard: expect.objectContaining({
          activeCompassSessionId: null,
          latestCompassInsights: null,
          latestCompassAdvisorContext: null,
          achievedCompassSummaries: [],
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
      achievedAt: null,
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
        activeCompassSessionId: null,
        latestCompassInsights: completedSession.insights,
        latestCompassAdvisorContext: null,
        achievedCompassSummaries: [],
      },
      updatedAt: new Date('2026-04-09T10:00:00.000Z'),
    });

    const { buildBootstrapResponse } = await import('../data');
    const response = await buildBootstrapResponse('user_123');

    expect(response.appState.strategicDashboard.latestCompassAdvisorContext).toEqual({
      sessionId: 'compass-older',
      planningYear: 2026,
      completedAt: '2026-03-01T10:00:00.000Z',
      bonfire: {
        items: [],
        releaseFeeling: '',
        releaseWords: [],
      },
      past: {
        highlights: ['Made the year feel different'],
        yearSnapshot: {
          workLife: '',
          relationships: '',
          health: '',
        },
        bestThing: '',
        biggestLesson: '',
        proud: '',
        yearWords: [],
        goldenMoments: '',
        biggestChallenges: ['Too much context switching.'],
        challengeSupport: '',
        challengeLessons: '',
        notProud: '',
        selfForgiveness: '',
      },
      future: {
        perfectDayBrainstorm: '',
        nextYearSummary: {
          workLife: '',
          relationships: '',
          health: '',
        },
      },
      perfectDay: {
        wakeTime: '',
        bodyFeeling: '',
        firstThoughts: '',
        morningView: '',
        location: '',
        salesMessage: '',
        autonomyFeeling: '',
        workPlans: '',
        funPlans: '',
        mirrorView: '',
        selfImageFeeling: '',
        outfit: '',
        outfitFeeling: '',
        breakfast: '',
        dayNarrative: 'A spacious day that still creates momentum.',
        spendingAccount: '',
        financialFreedomFeeling: '',
        charity: '',
        givingBack: '',
        weekendTrip: '',
        weekendActivities: '',
        weekendFood: '',
        homeAtmosphere: '',
        windowView: '',
        houseHighlights: '',
        garageHighlights: '',
        specialSomeoneMessage: '',
        nightClose: 'I am warm and available to the people I love.',
        gratitude: [],
        compassFeeling: '',
      },
      lightingPath: {
        environmentJoy: [],
        financialSupport: '',
        healthSupport: '',
        relationshipSupport: '',
        lettingGo: [],
        sayingNo: [],
        guiltFreeEnjoyment: [],
        supportPeople: [],
        placesToVisit: [],
        lovedOnes: [],
        selfRewards: [],
      },
      goldenPath: {
        pointA: '',
        pointB: '',
        obstacles: [],
        pleasurableProcess: '',
        fasterHelp: '',
        finalNotes: '',
        movieTitle: '',
        timeCapsuleLocation: '',
        timeCapsuleFeeling: '',
      },
    });
    expect(response.appState.strategicDashboard.activeCompassSessionId).toBe('compass-older');
  });
});
