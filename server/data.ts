import { and, eq, lte, sql } from 'drizzle-orm';
import type { AppState } from '../src/types/app-state.js';
import type { AdvisorId } from '../src/types/advisor.js';
import { ALL_ADVISOR_IDS } from '../src/advisors/registry.js';
import { CURRENT_SCHEMA_VERSION } from '../src/constants/schema.js';
import { env } from './env.js';
import {
  createDefaultDailyPlanningState,
  normalizeDailyPlanningState,
} from '../src/types/daily-planning.js';
import {
  createDefaultStrategicDashboardState,
  normalizeStrategicDashboardState,
} from '../src/types/strategic-dashboard.js';
import type {
  BootstrapResponse,
  CreateScheduledSessionInput,
  UpdateScheduledSessionInput,
  UserProfile,
} from '../src/types/api.js';
import type { ScheduledSession } from '../src/types/scheduled-session.js';
import { createDefaultAppState, createDefaultAdvisorState } from '../src/state/init.js';
import { createDefaultWeeklyFocusState } from '../src/types/weekly-focus.js';
import { createDefaultWeeklyReviewState, normalizeWeeklyReviewState } from '../src/types/weekly-review.js';
import { clerkClient } from './auth.js';
import { db } from './db/client.js';
import {
  deleteCalendarEvent,
  exchangeGoogleCalendarCode,
  isGoogleCalendarConfigured,
  upsertCalendarEvent,
} from './google-calendar.js';
import {
  advisorStates,
  quickLogs,
  scheduledSessions,
  sharedMetrics,
  taskPlanningAssignments,
  userAppMeta,
  userProfiles,
} from './db/schema.js';

function mapProfile(row: typeof userProfiles.$inferSelect | undefined): UserProfile {
  return {
    displayName: row?.displayName ?? null,
    schedulingEnabled: row?.schedulingEnabled ?? false,
    googleCalendarConnected: row?.googleCalendarConnected ?? false,
    googleCalendarEmail: row?.googleCalendarEmail ?? null,
  };
}

function mapScheduledSession(row: typeof scheduledSessions.$inferSelect): ScheduledSession {
  return {
    id: row.id,
    advisorId: row.advisorId as AdvisorId,
    scheduledAt: row.scheduledAt.toISOString(),
    durationMinutes: row.durationMinutes,
    windowMinutes: row.windowMinutes,
    status: row.status,
    calendarSyncStatus: row.calendarSyncStatus,
    createdAt: row.createdAt.toISOString(),
  };
}

function hasUsableGoogleCalendarProfile(
  profile: typeof userProfiles.$inferSelect | undefined,
): profile is typeof userProfiles.$inferSelect & { googleCalendarRefreshToken: string } {
  return !!(
    profile?.googleCalendarConnected &&
    profile.googleCalendarRefreshToken &&
    isGoogleCalendarConfigured()
  );
}

async function deriveDisplayName(userId: string): Promise<string | null> {
  try {
    const user = await clerkClient.users.getUser(userId);
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();

    if (fullName) {
      return fullName;
    }

    return user.primaryEmailAddress?.emailAddress?.split('@')[0] ?? null;
  } catch (error) {
    console.error('[bootstrap] Failed to derive display name from Clerk.', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function ensureUserRecords(userId: string): Promise<void> {
  const existingProfile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.id, userId),
  });

  if (!existingProfile) {
    const displayName = await deriveDisplayName(userId);

    await db
      .insert(userProfiles)
      .values({
        id: userId,
        displayName,
      })
      .onConflictDoNothing();
  } else if (!existingProfile.displayName) {
    const displayName = await deriveDisplayName(userId);

    if (displayName) {
      await db
        .update(userProfiles)
        .set({
          displayName,
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.id, userId));
    }
  }

  await Promise.all([
    db
      .insert(sharedMetrics)
      .values({
        userId,
        metrics: {},
      })
      .onConflictDoNothing(),
    db
      .insert(quickLogs)
      .values({
        userId,
        logs: [],
      })
      .onConflictDoNothing(),
    db
      .insert(taskPlanningAssignments)
      .values({
        userId,
        assignments: {},
      })
      .onConflictDoNothing(),
    db
      .insert(userAppMeta)
      .values({
        userId,
        schemaVersion: CURRENT_SCHEMA_VERSION,
        dailyPlanning: createDefaultDailyPlanningState(),
        weeklyFocus: createDefaultWeeklyFocusState(),
        weeklyReview: createDefaultWeeklyReviewState(),
        strategicDashboard: createDefaultStrategicDashboardState(),
      })
      .onConflictDoNothing(),
  ]);
}

async function resetLegacyUserState(userId: string): Promise<void> {
  const freshState = createDefaultAppState();

  await Promise.all(
    ALL_ADVISOR_IDS.map(advisorId =>
      db
        .insert(advisorStates)
        .values({
          userId,
          advisorId,
          state: freshState.advisors[advisorId],
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [advisorStates.userId, advisorStates.advisorId],
          set: {
            state: freshState.advisors[advisorId],
            updatedAt: new Date(),
          },
        }),
    ),
  );

  await Promise.all([
    db
      .update(sharedMetrics)
      .set({ metrics: {}, updatedAt: new Date() })
      .where(eq(sharedMetrics.userId, userId)),
    db
      .update(quickLogs)
      .set({ logs: [], updatedAt: new Date() })
      .where(eq(quickLogs.userId, userId)),
    db
      .update(taskPlanningAssignments)
      .set({ assignments: {}, updatedAt: new Date() })
      .where(eq(taskPlanningAssignments.userId, userId)),
    db
      .update(userAppMeta)
      .set({
        schemaVersion: CURRENT_SCHEMA_VERSION,
        dailyPlanning: createDefaultDailyPlanningState(),
        weeklyFocus: createDefaultWeeklyFocusState(),
        weeklyReview: createDefaultWeeklyReviewState(),
        strategicDashboard: createDefaultStrategicDashboardState(),
        updatedAt: new Date(),
      })
      .where(eq(userAppMeta.userId, userId)),
    db
      .update(scheduledSessions)
      .set({
        status: 'cancelled',
        calendarSyncStatus: 'disabled',
        googleCalendarEventId: null,
        updatedAt: new Date(),
      })
      .where(eq(scheduledSessions.userId, userId)),
  ]);
}

export async function resetUserData(userId: string): Promise<void> {
  await ensureUserRecords(userId);

  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.id, userId),
  });

  const sessionRows = await db
    .select()
    .from(scheduledSessions)
    .where(eq(scheduledSessions.userId, userId));

  const calendarRefreshToken = profile?.googleCalendarRefreshToken;

  if (profile?.googleCalendarConnected && calendarRefreshToken && isGoogleCalendarConfigured()) {
    const eventIds = sessionRows
      .map(row => row.googleCalendarEventId)
      .filter((eventId): eventId is string => Boolean(eventId));

    await Promise.all(
      eventIds.map(async eventId => {
        try {
          await deleteCalendarEvent(calendarRefreshToken, eventId);
        } catch (error) {
          console.warn('[resetUserData] Failed to delete Google Calendar event during reset.', {
            userId,
            eventId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }),
    );
  }

  const freshState = createDefaultAppState();

  await db.delete(advisorStates).where(eq(advisorStates.userId, userId));
  await db.delete(scheduledSessions).where(eq(scheduledSessions.userId, userId));

  await Promise.all([
    db.insert(advisorStates).values(
      ALL_ADVISOR_IDS.map(advisorId => ({
        userId,
        advisorId,
        state: freshState.advisors[advisorId],
        updatedAt: new Date(),
      })),
    ),
    db
      .update(sharedMetrics)
      .set({ metrics: {}, updatedAt: new Date() })
      .where(eq(sharedMetrics.userId, userId)),
    db
      .update(quickLogs)
      .set({ logs: [], updatedAt: new Date() })
      .where(eq(quickLogs.userId, userId)),
    db
      .update(taskPlanningAssignments)
      .set({ assignments: {}, updatedAt: new Date() })
      .where(eq(taskPlanningAssignments.userId, userId)),
    db
      .update(userAppMeta)
      .set({
        schemaVersion: CURRENT_SCHEMA_VERSION,
        dailyPlanning: createDefaultDailyPlanningState(),
        weeklyFocus: createDefaultWeeklyFocusState(),
        weeklyReview: createDefaultWeeklyReviewState(),
        strategicDashboard: createDefaultStrategicDashboardState(),
        updatedAt: new Date(),
      })
      .where(eq(userAppMeta.userId, userId)),
  ]);
}

async function markExpiredScheduledSessions(userId: string): Promise<void> {
  await db
    .update(scheduledSessions)
    .set({
      status: 'missed',
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(scheduledSessions.userId, userId),
        eq(scheduledSessions.status, 'scheduled'),
        lte(
          sql`${scheduledSessions.scheduledAt} + (${scheduledSessions.windowMinutes} * interval '1 minute')`,
          new Date(),
        ),
      ),
    );
}

async function loadAppState(userId: string): Promise<AppState> {
  const baseState = createDefaultAppState();

  const [advisorRows, sharedMetricsRow, quickLogsRow, taskPlanningRow, metaRow] = await Promise.all([
    db.select().from(advisorStates).where(eq(advisorStates.userId, userId)),
    db.query.sharedMetrics.findFirst({ where: eq(sharedMetrics.userId, userId) }),
    db.query.quickLogs.findFirst({ where: eq(quickLogs.userId, userId) }),
    db.query.taskPlanningAssignments.findFirst({ where: eq(taskPlanningAssignments.userId, userId) }),
    db.query.userAppMeta.findFirst({ where: eq(userAppMeta.userId, userId) }),
  ]);

  for (const advisorId of ALL_ADVISOR_IDS) {
    baseState.advisors[advisorId] = createDefaultAdvisorState(advisorId);
  }

  for (const row of advisorRows) {
    baseState.advisors[row.advisorId as AdvisorId] = row.state;
  }

  baseState.sharedMetrics = sharedMetricsRow?.metrics ?? {};
  baseState.quickLogs = quickLogsRow?.logs ?? [];
  baseState.taskPlanning = taskPlanningRow?.assignments ?? {};
  baseState.dailyPlanning = normalizeDailyPlanningState(
    metaRow?.dailyPlanning ?? createDefaultDailyPlanningState(),
  );
  baseState.weeklyFocus = metaRow?.weeklyFocus ?? createDefaultWeeklyFocusState();
  baseState.weeklyReview = normalizeWeeklyReviewState(
    metaRow?.weeklyReview ?? createDefaultWeeklyReviewState(),
  );
  baseState.strategicDashboard = normalizeStrategicDashboardState(
    metaRow?.strategicDashboard ?? createDefaultStrategicDashboardState(),
  );
  baseState.schemaVersion = metaRow?.schemaVersion ?? CURRENT_SCHEMA_VERSION;
  baseState.initialized = true;

  return baseState;
}

async function syncScheduledSessionCalendarForProfile(
  profile: typeof userProfiles.$inferSelect | undefined,
  row: typeof scheduledSessions.$inferSelect,
): Promise<{
  calendarSyncStatus: typeof row.calendarSyncStatus;
  googleCalendarEventId: string | null;
}> {
  if (!hasUsableGoogleCalendarProfile(profile)) {
    return {
      calendarSyncStatus: 'disabled',
      googleCalendarEventId: row.googleCalendarEventId ?? null,
    };
  }

  if (row.status !== 'scheduled') {
    if (row.googleCalendarEventId) {
      await deleteCalendarEvent(profile.googleCalendarRefreshToken, row.googleCalendarEventId);
    }

    return {
      calendarSyncStatus: 'synced',
      googleCalendarEventId: null,
    };
  }

  const eventId = await upsertCalendarEvent({
    refreshToken: profile.googleCalendarRefreshToken,
    eventId: row.googleCalendarEventId,
    summary: `${row.advisorId} advisory session`,
    description: 'Scheduled from L.A.B.',
    startIso: row.scheduledAt.toISOString(),
    endIso: new Date(row.scheduledAt.getTime() + row.durationMinutes * 60 * 1000).toISOString(),
  });

  return {
    calendarSyncStatus: 'synced',
    googleCalendarEventId: eventId,
  };
}

async function syncScheduledSessionCalendar(
  userId: string,
  row: typeof scheduledSessions.$inferSelect,
): Promise<{
  calendarSyncStatus: typeof row.calendarSyncStatus;
  googleCalendarEventId: string | null;
}> {
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.id, userId),
  });

  return syncScheduledSessionCalendarForProfile(profile, row);
}

async function backfillGoogleCalendarScheduledSessions(
  userId: string,
  profile: typeof userProfiles.$inferSelect | undefined,
): Promise<void> {
  if (!hasUsableGoogleCalendarProfile(profile)) {
    return;
  }

  const rows = await db
    .select()
    .from(scheduledSessions)
    .where(
      and(
        eq(scheduledSessions.userId, userId),
        eq(scheduledSessions.status, 'scheduled'),
      ),
    );

  await Promise.all(
    rows.map(async row => {
      try {
        const syncState = await syncScheduledSessionCalendarForProfile(profile, row);

        await db
          .update(scheduledSessions)
          .set({
            ...syncState,
            updatedAt: new Date(),
          })
          .where(eq(scheduledSessions.id, row.id));
      } catch (error) {
        console.warn('[googleCalendar] Failed to backfill scheduled session after connect.', {
          userId,
          sessionId: row.id,
          error: error instanceof Error ? error.message : String(error),
        });

        await db
          .update(scheduledSessions)
          .set({
            calendarSyncStatus: 'failed',
            updatedAt: new Date(),
          })
          .where(eq(scheduledSessions.id, row.id));
      }
    }),
  );
}

async function clearGoogleCalendarScheduledSessionSync(
  userId: string,
  profile: typeof userProfiles.$inferSelect | undefined,
): Promise<void> {
  const rows = await db
    .select()
    .from(scheduledSessions)
    .where(eq(scheduledSessions.userId, userId));

  if (hasUsableGoogleCalendarProfile(profile)) {
    await Promise.all(
      rows.map(async row => {
        if (!row.googleCalendarEventId) {
          return;
        }

        try {
          await deleteCalendarEvent(profile.googleCalendarRefreshToken, row.googleCalendarEventId);
        } catch (error) {
          console.warn('[googleCalendar] Failed to delete synced event during disconnect.', {
            userId,
            sessionId: row.id,
            eventId: row.googleCalendarEventId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }),
    );
  }

  await db
    .update(scheduledSessions)
    .set({
      calendarSyncStatus: 'disabled',
      googleCalendarEventId: null,
      updatedAt: new Date(),
    })
    .where(eq(scheduledSessions.userId, userId));
}

export async function buildBootstrapResponse(userId: string): Promise<BootstrapResponse> {
  await ensureUserRecords(userId);
  const metaRow = await db.query.userAppMeta.findFirst({
    where: eq(userAppMeta.userId, userId),
  });

  if ((metaRow?.schemaVersion ?? CURRENT_SCHEMA_VERSION) < CURRENT_SCHEMA_VERSION) {
    await resetLegacyUserState(userId);
  }

  await markExpiredScheduledSessions(userId);

  const [profileRow, appState, sessionRows] = await Promise.all([
    db.query.userProfiles.findFirst({ where: eq(userProfiles.id, userId) }),
    loadAppState(userId),
    db
      .select()
      .from(scheduledSessions)
      .where(
        and(
          eq(scheduledSessions.userId, userId),
          eq(scheduledSessions.status, 'scheduled'),
        ),
      )
      .orderBy(scheduledSessions.scheduledAt),
  ]);

  return {
    profile: mapProfile(profileRow),
    appState,
    scheduledSessions: sessionRows.map(mapScheduledSession),
    buildVersion: env.buildVersion,
  };
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
  await ensureUserRecords(userId);

  const nextValues: Partial<typeof userProfiles.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (updates.displayName !== undefined) {
    nextValues.displayName = updates.displayName;
  }

  if (updates.schedulingEnabled !== undefined) {
    nextValues.schedulingEnabled = updates.schedulingEnabled;
  }

  await db
    .update(userProfiles)
    .set(nextValues)
    .where(eq(userProfiles.id, userId));

  const updated = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.id, userId),
  });

  return mapProfile(updated);
}

export async function saveAppState(userId: string, appState: AppState): Promise<void> {
  await ensureUserRecords(userId);

  await Promise.all(
    ALL_ADVISOR_IDS.map(advisorId =>
      db
        .insert(advisorStates)
        .values({
          userId,
          advisorId,
          state: appState.advisors[advisorId],
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [advisorStates.userId, advisorStates.advisorId],
          set: {
            state: appState.advisors[advisorId],
            updatedAt: new Date(),
          },
        }),
    ),
  );

  await Promise.all([
    db
      .insert(sharedMetrics)
      .values({
        userId,
        metrics: appState.sharedMetrics,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: sharedMetrics.userId,
        set: {
          metrics: appState.sharedMetrics,
          updatedAt: new Date(),
        },
      }),
    db
      .insert(quickLogs)
      .values({
        userId,
        logs: appState.quickLogs,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: quickLogs.userId,
        set: {
          logs: appState.quickLogs,
          updatedAt: new Date(),
        },
      }),
    db
      .insert(taskPlanningAssignments)
      .values({
        userId,
        assignments: appState.taskPlanning,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: taskPlanningAssignments.userId,
        set: {
          assignments: appState.taskPlanning,
          updatedAt: new Date(),
        },
      }),
    db
      .insert(userAppMeta)
      .values({
        userId,
        schemaVersion: appState.schemaVersion,
        dailyPlanning: appState.dailyPlanning,
        weeklyFocus: appState.weeklyFocus,
        weeklyReview: appState.weeklyReview,
        strategicDashboard: appState.strategicDashboard,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userAppMeta.userId,
        set: {
          schemaVersion: appState.schemaVersion,
          dailyPlanning: appState.dailyPlanning,
          weeklyFocus: appState.weeklyFocus,
          weeklyReview: appState.weeklyReview,
          strategicDashboard: appState.strategicDashboard,
          updatedAt: new Date(),
        },
      }),
  ]);
}

export async function listScheduledSessions(userId: string): Promise<ScheduledSession[]> {
  await ensureUserRecords(userId);
  await markExpiredScheduledSessions(userId);

  const rows = await db
    .select()
    .from(scheduledSessions)
    .where(
      and(
        eq(scheduledSessions.userId, userId),
        eq(scheduledSessions.status, 'scheduled'),
      ),
    )
    .orderBy(scheduledSessions.scheduledAt);

  return rows.map(mapScheduledSession);
}

export async function createScheduledSession(userId: string, input: CreateScheduledSessionInput): Promise<ScheduledSession> {
  await ensureUserRecords(userId);

  const [created] = await db
    .insert(scheduledSessions)
    .values({
      userId,
      advisorId: input.advisorId,
      scheduledAt: new Date(input.scheduledAt),
      durationMinutes: input.durationMinutes ?? 60,
      windowMinutes: 60,
      status: 'scheduled',
      calendarSyncStatus: 'pending',
      updatedAt: new Date(),
    })
    .returning();

  try {
    const syncState = await syncScheduledSessionCalendar(userId, created);
    const [synced] = await db
      .update(scheduledSessions)
      .set({
        ...syncState,
        updatedAt: new Date(),
      })
      .where(eq(scheduledSessions.id, created.id))
      .returning();

    return mapScheduledSession(synced ?? created);
  } catch {
    const [failed] = await db
      .update(scheduledSessions)
      .set({
        calendarSyncStatus: 'failed',
        updatedAt: new Date(),
      })
      .where(eq(scheduledSessions.id, created.id))
      .returning();

    return mapScheduledSession(failed ?? created);
  }
}

export async function updateScheduledSession(
  userId: string,
  sessionId: string,
  input: UpdateScheduledSessionInput,
): Promise<ScheduledSession | null> {
  await ensureUserRecords(userId);

  const patch: Partial<typeof scheduledSessions.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (input.scheduledAt !== undefined) {
    patch.scheduledAt = new Date(input.scheduledAt);
  }

  if (input.durationMinutes !== undefined) {
    patch.durationMinutes = input.durationMinutes;
  }

  if (input.status !== undefined) {
    patch.status = input.status;
  }

  const [updated] = await db
    .update(scheduledSessions)
    .set(patch)
    .where(
      and(
        eq(scheduledSessions.id, sessionId),
        eq(scheduledSessions.userId, userId),
      ),
    )
    .returning();

  if (!updated) {
    return null;
  }

  try {
    const syncState = await syncScheduledSessionCalendar(userId, updated);
    const [synced] = await db
      .update(scheduledSessions)
      .set({
        ...syncState,
        updatedAt: new Date(),
      })
      .where(eq(scheduledSessions.id, sessionId))
      .returning();

    await markExpiredScheduledSessions(userId);
    return synced?.status === 'scheduled' ? mapScheduledSession(synced) : null;
  } catch {
    const [failed] = await db
      .update(scheduledSessions)
      .set({
        calendarSyncStatus: 'failed',
        updatedAt: new Date(),
      })
      .where(eq(scheduledSessions.id, sessionId))
      .returning();

    await markExpiredScheduledSessions(userId);
    return failed?.status === 'scheduled' ? mapScheduledSession(failed) : null;
  }
}

export async function connectGoogleCalendar(userId: string, code: string): Promise<UserProfile> {
  await ensureUserRecords(userId);
  const token = await exchangeGoogleCalendarCode(code);

  await db
    .update(userProfiles)
    .set({
      googleCalendarConnected: true,
      googleCalendarEmail: token.email,
      googleCalendarRefreshToken: token.refreshToken,
      updatedAt: new Date(),
    })
    .where(eq(userProfiles.id, userId));

  const updated = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.id, userId),
  });

  await backfillGoogleCalendarScheduledSessions(userId, updated);

  return mapProfile(updated);
}

export async function disconnectGoogleCalendar(userId: string): Promise<UserProfile> {
  await ensureUserRecords(userId);

  const existingProfile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.id, userId),
  });

  await clearGoogleCalendarScheduledSessionSync(userId, existingProfile);

  await db
    .update(userProfiles)
    .set({
      googleCalendarConnected: false,
      googleCalendarEmail: null,
      googleCalendarRefreshToken: null,
      updatedAt: new Date(),
    })
    .where(eq(userProfiles.id, userId));

  const updated = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.id, userId),
  });

  return mapProfile(updated);
}
