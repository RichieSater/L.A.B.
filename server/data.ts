import { and, desc, eq, lte, sql } from 'drizzle-orm';
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
  applyCompassInsightsToStrategicDashboard,
  createDefaultStrategicDashboardState,
  normalizeStrategicDashboardState,
} from '../src/types/strategic-dashboard.js';
import type {
  AccountTier,
  AdminUserSummary,
  BootstrapResponse,
  CreateScheduledSessionInput,
  ManagedAccountTier,
  UpdateUserProfileInput,
  UpdateScheduledSessionInput,
  UserProfile,
} from '../src/types/api.js';
import { isManagedAccountTier } from '../src/lib/account-tier.js';
import type { ScheduledSession } from '../src/types/scheduled-session.js';
import type {
  CompassSessionDetail,
  CompassSessionSummary,
  CreateCompassSessionInput,
  UpdateCompassSessionInput,
} from '../src/types/compass.js';
import { createDefaultAppState, createDefaultAdvisorState } from '../src/state/init.js';
import { createDefaultWeeklyFocusState } from '../src/types/weekly-focus.js';
import { createDefaultWeeklyReviewState, normalizeWeeklyReviewState } from '../src/types/weekly-review.js';
import {
  countCompassAnswers,
  createCompassSessionTitle,
  deriveCompassInsights,
  extractCompassAdvisorContext,
} from '../src/lib/compass-insights.js';
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
  compassSessions,
  quickLogs,
  scheduledSessions,
  sharedMetrics,
  taskPlanningAssignments,
  userAppMeta,
  userProfiles,
} from './db/schema.js';

type UserProfileRow = typeof userProfiles.$inferSelect;
type CompassSessionRow = typeof compassSessions.$inferSelect;

const PLAYWRIGHT_PREMIUM_METADATA_KEY = 'labPlaywrightUser';
const COMPASS_COMPLETED_REQUIRED_ERROR = 'COMPASS_COMPLETED_REQUIRED';

function mapProfile(row: UserProfileRow | undefined): UserProfile {
  return {
    displayName: row?.displayName ?? null,
    schedulingEnabled: row?.schedulingEnabled ?? false,
    googleCalendarConnected: row?.googleCalendarConnected ?? false,
    googleCalendarEmail: row?.googleCalendarEmail ?? null,
    accountTier: row?.accountTier ?? 'free',
  };
}

function mapAdminUserSummary(row: UserProfileRow): AdminUserSummary {
  return {
    id: row.id,
    displayName: row.displayName ?? null,
    primaryEmail: row.primaryEmail ?? null,
    accountTier: row.accountTier,
    createdAt: row.createdAt.toISOString(),
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

function mapCompassSessionSummary(
  row: typeof compassSessions.$inferSelect,
  activeCompassSessionId: string | null,
): CompassSessionSummary {
  return {
    id: row.id,
    title: row.title,
    planningYear: row.planningYear,
    status: row.status,
    currentScreen: row.currentScreen,
    answerCount: countCompassAnswers(row.answers ?? {}),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
    achievedAt: row.achievedAt?.toISOString() ?? null,
    isActive: row.status === 'completed' && activeCompassSessionId === row.id,
    insights: row.insights ?? null,
  };
}

function mapCompassSessionDetail(
  row: typeof compassSessions.$inferSelect,
  activeCompassSessionId: string | null,
): CompassSessionDetail {
  return {
    ...mapCompassSessionSummary(row, activeCompassSessionId),
    answers: row.answers ?? {},
  };
}

function mapAchievedCompassSummary(row: CompassSessionRow) {
  if (!row.completedAt || !row.achievedAt) {
    return null;
  }

  return {
    sessionId: row.id,
    title: row.title,
    planningYear: row.planningYear,
    completedAt: row.completedAt.toISOString(),
    achievedAt: row.achievedAt.toISOString(),
  };
}

function buildCompassAdvisorContext(row: CompassSessionRow) {
  if (!row.completedAt) {
    return null;
  }

  return extractCompassAdvisorContext({
    sessionId: row.id,
    planningYear: row.planningYear,
    completedAt: row.completedAt.toISOString(),
    answers: row.answers ?? {},
  });
}

function deriveActiveCompletedCompassSessionId(
  completedSessions: CompassSessionRow[],
  preferredActiveCompassSessionId: string | null | undefined,
): string | null {
  if (
    preferredActiveCompassSessionId &&
    completedSessions.some(session => session.id === preferredActiveCompassSessionId)
  ) {
    return preferredActiveCompassSessionId;
  }

  return completedSessions[0]?.id ?? null;
}

function reconcileStrategicDashboardCompassState(
  strategicDashboardInput: AppState['strategicDashboard'] | null | undefined,
  completedSessions: CompassSessionRow[],
  options: {
    activeCompassSessionId?: string | null;
  } = {},
): AppState['strategicDashboard'] {
  const strategicDashboard = normalizeStrategicDashboardState(
    strategicDashboardInput ?? createDefaultStrategicDashboardState(),
  );
  const activeCompassSessionId = deriveActiveCompletedCompassSessionId(
    completedSessions,
    options.activeCompassSessionId !== undefined
      ? options.activeCompassSessionId
      : strategicDashboard.activeCompassSessionId,
  );
  const activeSession = completedSessions.find(session => session.id === activeCompassSessionId) ?? null;

  return {
    ...strategicDashboard,
    activeCompassSessionId,
    latestCompassInsights: activeSession?.insights ?? null,
    latestCompassAdvisorContext: activeSession ? buildCompassAdvisorContext(activeSession) : null,
    achievedCompassSummaries: completedSessions
      .map(mapAchievedCompassSummary)
      .filter((summary): summary is NonNullable<ReturnType<typeof mapAchievedCompassSummary>> => summary !== null)
      .sort((a, b) => b.achievedAt.localeCompare(a.achievedAt)),
  };
}

function hasUsableGoogleCalendarProfile(
  profile: UserProfileRow | undefined,
): profile is UserProfileRow & { googleCalendarRefreshToken: string } {
  return !!(
    profile?.googleCalendarConnected &&
    profile.googleCalendarRefreshToken &&
    isGoogleCalendarConfigured()
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {};
}

function normalizeEmail(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLowerCase() ?? '';
  return normalized.length > 0 ? normalized : null;
}

function getAdminEmailAllowlist(): Set<string> {
  return new Set(
    (env.labAdminEmails ?? '')
      .split(',')
      .map(email => normalizeEmail(email))
      .filter((email): email is string => Boolean(email)),
  );
}

function resolveDisplayName(
  fullName: string,
  primaryEmail: string | null,
): string | null {
  if (fullName) {
    return fullName;
  }

  return primaryEmail?.split('@')[0] ?? null;
}

function resolveAccountTier(
  existingTier: AccountTier | null | undefined,
  primaryEmail: string | null,
  defaultTier: AccountTier,
): AccountTier {
  if (primaryEmail && getAdminEmailAllowlist().has(primaryEmail)) {
    return 'admin';
  }

  if (defaultTier === 'premium' && existingTier !== 'admin') {
    return 'premium';
  }

  return existingTier ?? defaultTier;
}

async function loadClerkIdentity(userId: string): Promise<{
  displayName: string | null;
  primaryEmail: string | null;
  defaultTier: AccountTier;
}> {
  try {
    const user = await clerkClient.users.getUser(userId);
    const primaryEmail = normalizeEmail(user.primaryEmailAddress?.emailAddress ?? null);
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    const privateMetadata = asRecord(user.privateMetadata);
    const defaultTier =
      privateMetadata[PLAYWRIGHT_PREMIUM_METADATA_KEY] === true
        ? 'premium'
        : 'free';

    return {
      displayName: resolveDisplayName(fullName, primaryEmail),
      primaryEmail,
      defaultTier,
    };
  } catch (error) {
    console.error('[bootstrap] Failed to sync Clerk identity.', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      displayName: null,
      primaryEmail: null,
      defaultTier: 'free',
    };
  }
}

async function syncUserProfileIdentity(
  userId: string,
  existingProfile?: UserProfileRow,
): Promise<UserProfileRow> {
  const profile = existingProfile ?? await db.query.userProfiles.findFirst({
    where: eq(userProfiles.id, userId),
  });
  const clerkIdentity = await loadClerkIdentity(userId);
  const nextDisplayName = clerkIdentity.displayName ?? profile?.displayName ?? null;
  const nextPrimaryEmail = clerkIdentity.primaryEmail ?? profile?.primaryEmail ?? null;
  const nextAccountTier = resolveAccountTier(
    profile?.accountTier,
    nextPrimaryEmail,
    clerkIdentity.defaultTier,
  );

  if (!profile) {
    await db
      .insert(userProfiles)
      .values({
        id: userId,
        displayName: nextDisplayName,
        primaryEmail: nextPrimaryEmail,
        accountTier: nextAccountTier,
      })
      .onConflictDoNothing();

    const insertedProfile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.id, userId),
    });

    if (!insertedProfile) {
      throw new Error(`Failed to create user profile for ${userId}.`);
    }

    return insertedProfile;
  }

  const nextValues: Partial<typeof userProfiles.$inferInsert> = {};

  if (nextDisplayName !== profile.displayName) {
    nextValues.displayName = nextDisplayName;
  }

  if (nextPrimaryEmail !== profile.primaryEmail) {
    nextValues.primaryEmail = nextPrimaryEmail;
  }

  if (nextAccountTier !== profile.accountTier) {
    nextValues.accountTier = nextAccountTier;
  }

  if (Object.keys(nextValues).length === 0) {
    return profile;
  }

  await db
    .update(userProfiles)
    .set({
      ...nextValues,
      updatedAt: new Date(),
    })
    .where(eq(userProfiles.id, userId));

  const updatedProfile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.id, userId),
  });

  if (!updatedProfile) {
    throw new Error(`Failed to reload user profile for ${userId}.`);
  }

  return updatedProfile;
}

export async function ensureUserRecords(userId: string): Promise<void> {
  await syncUserProfileIdentity(userId);

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

async function loadCompletedCompassSessions(
  userId: string,
): Promise<CompassSessionRow[]> {
  return db
    .select()
    .from(compassSessions)
    .where(
      and(
        eq(compassSessions.userId, userId),
        eq(compassSessions.status, 'completed'),
      ),
    )
    .orderBy(desc(compassSessions.completedAt), desc(compassSessions.updatedAt));
}

async function hydrateActiveCompassState(
  userId: string,
  appState: AppState,
): Promise<AppState> {
  const completedSessions = await loadCompletedCompassSessions(userId);
  const strategicDashboard = reconcileStrategicDashboardCompassState(
    appState.strategicDashboard,
    completedSessions,
  );

  if (JSON.stringify(strategicDashboard) !== JSON.stringify(appState.strategicDashboard)) {
    await db
      .update(userAppMeta)
      .set({
        strategicDashboard,
        updatedAt: new Date(),
      })
      .where(eq(userAppMeta.userId, userId));
  }

  return {
    ...appState,
    strategicDashboard,
  };
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
  const hydratedAppState = await hydrateActiveCompassState(userId, appState);

  return {
    profile: mapProfile(profileRow),
    appState: hydratedAppState,
    scheduledSessions: sessionRows.map(mapScheduledSession),
    buildVersion: env.buildVersion,
  };
}

export async function getUserAccountTier(userId: string): Promise<AccountTier> {
  const profile = await syncUserProfileIdentity(userId);
  return profile.accountTier;
}

export async function updateUserProfile(
  userId: string,
  updates: UpdateUserProfileInput,
): Promise<UserProfile> {
  await ensureUserRecords(userId);

  const nextValues: Partial<typeof userProfiles.$inferInsert> = {};

  if (updates.displayName !== undefined) {
    nextValues.displayName = updates.displayName;
  }

  if (updates.schedulingEnabled !== undefined) {
    nextValues.schedulingEnabled = updates.schedulingEnabled;
  }

  if (Object.keys(nextValues).length === 0) {
    const existingProfile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.id, userId),
    });

    return mapProfile(existingProfile);
  }

  await db
    .update(userProfiles)
    .set({
      ...nextValues,
      updatedAt: new Date(),
    })
    .where(eq(userProfiles.id, userId));

  const updated = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.id, userId),
  });

  return mapProfile(updated);
}

async function hydrateAdminUserIdentity(row: UserProfileRow): Promise<UserProfileRow> {
  if (row.primaryEmail) {
    const nextAccountTier = resolveAccountTier(row.accountTier, row.primaryEmail, row.accountTier);

    if (nextAccountTier === row.accountTier) {
      return row;
    }

    await db
      .update(userProfiles)
      .set({
        accountTier: nextAccountTier,
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.id, row.id));

    return {
      ...row,
      accountTier: nextAccountTier,
      updatedAt: new Date(),
    };
  }

  return syncUserProfileIdentity(row.id, row);
}

export async function listAdminUsers(): Promise<AdminUserSummary[]> {
  const rows = await db
    .select()
    .from(userProfiles)
    .orderBy(desc(userProfiles.createdAt));

  const hydratedRows = await Promise.all(rows.map(hydrateAdminUserIdentity));
  return hydratedRows.map(mapAdminUserSummary);
}

export async function updateAdminUserTier(
  userId: string,
  accountTier: ManagedAccountTier,
): Promise<AdminUserSummary | null> {
  if (!isManagedAccountTier(accountTier)) {
    throw new Error('INVALID_ACCOUNT_TIER');
  }

  const existingProfile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.id, userId),
  });

  if (!existingProfile) {
    return null;
  }

  const hydratedProfile = await hydrateAdminUserIdentity(existingProfile);

  if (hydratedProfile.accountTier === 'admin') {
    throw new Error('ADMIN_ACCOUNT_TIER_LOCKED');
  }

  await db
    .update(userProfiles)
    .set({
      accountTier,
      updatedAt: new Date(),
    })
    .where(eq(userProfiles.id, userId));

  const updatedProfile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.id, userId),
  });

  if (!updatedProfile) {
    return null;
  }

  return mapAdminUserSummary(updatedProfile);
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

export async function listCompassSessions(userId: string): Promise<CompassSessionSummary[]> {
  await ensureUserRecords(userId);

  const metaRow = await db.query.userAppMeta.findFirst({
    where: eq(userAppMeta.userId, userId),
  });
  const rows = await db
    .select()
    .from(compassSessions)
    .where(eq(compassSessions.userId, userId))
    .orderBy(desc(compassSessions.updatedAt));

  const activeCompassSessionId = deriveActiveCompletedCompassSessionId(
    rows.filter((row): row is CompassSessionRow & { completedAt: Date } => row.status === 'completed' && row.completedAt !== null),
    normalizeStrategicDashboardState(metaRow?.strategicDashboard ?? createDefaultStrategicDashboardState()).activeCompassSessionId,
  );

  return rows.map(row => mapCompassSessionSummary(row, activeCompassSessionId));
}

export async function createCompassSession(
  userId: string,
  input: CreateCompassSessionInput,
): Promise<CompassSessionDetail> {
  await ensureUserRecords(userId);

  const [created] = await db
    .insert(compassSessions)
    .values({
      userId,
      planningYear: input.planningYear,
      title: createCompassSessionTitle(input.planningYear),
      status: 'in_progress',
      currentScreen: 0,
      answers: {},
      insights: null,
      updatedAt: new Date(),
    })
    .returning();

  return mapCompassSessionDetail(created, null);
}

export async function getCompassSession(
  userId: string,
  sessionId: string,
): Promise<CompassSessionDetail | null> {
  await ensureUserRecords(userId);

  const row = await db.query.compassSessions.findFirst({
    where: and(
      eq(compassSessions.userId, userId),
      eq(compassSessions.id, sessionId),
    ),
  });

  if (!row) {
    return null;
  }

  const metaRow = await db.query.userAppMeta.findFirst({
    where: eq(userAppMeta.userId, userId),
  });
  const activeCompassSessionId = deriveActiveCompletedCompassSessionId(
    await loadCompletedCompassSessions(userId),
    normalizeStrategicDashboardState(metaRow?.strategicDashboard ?? createDefaultStrategicDashboardState()).activeCompassSessionId,
  );

  return mapCompassSessionDetail(row, activeCompassSessionId);
}

export async function updateCompassSession(
  userId: string,
  sessionId: string,
  input: UpdateCompassSessionInput,
): Promise<CompassSessionDetail | null> {
  await ensureUserRecords(userId);

  const existing = await db.query.compassSessions.findFirst({
    where: and(
      eq(compassSessions.userId, userId),
      eq(compassSessions.id, sessionId),
    ),
  });

  if (!existing) {
    return null;
  }

  const nextAnswers = input.answers ?? existing.answers ?? {};
  const nextStatus = input.status ?? existing.status;
  const requiresCompletedSession = input.achieved !== undefined || input.setActive === true;
  if (requiresCompletedSession && nextStatus !== 'completed') {
    throw new Error(COMPASS_COMPLETED_REQUIRED_ERROR);
  }
  const completingNow = existing.status !== 'completed' && nextStatus === 'completed';
  const nextInsights =
    nextStatus === 'completed'
      ? completingNow
        ? deriveCompassInsights(nextAnswers)
        : (existing.insights ?? deriveCompassInsights(nextAnswers))
      : existing.insights ?? null;
  const nextAchievedAt =
    nextStatus !== 'completed'
      ? null
      : input.achieved === undefined
        ? existing.achievedAt ?? null
        : input.achieved
          ? (existing.achievedAt ?? new Date())
          : null;

  const [updated] = await db
    .update(compassSessions)
    .set({
      currentScreen: input.currentScreen ?? existing.currentScreen,
      answers: nextAnswers,
      status: nextStatus,
      insights: nextInsights,
      completedAt:
        nextStatus === 'completed'
          ? existing.completedAt ?? new Date()
          : null,
      achievedAt: nextAchievedAt,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(compassSessions.userId, userId),
        eq(compassSessions.id, sessionId),
      ),
    )
    .returning();

  const metaRow = await db.query.userAppMeta.findFirst({
    where: eq(userAppMeta.userId, userId),
  });
  let strategicDashboard = metaRow?.strategicDashboard ?? createDefaultStrategicDashboardState();

  if (completingNow && nextInsights) {
    strategicDashboard = applyCompassInsightsToStrategicDashboard(
      strategicDashboard,
      updated.planningYear,
      nextInsights,
      updated.updatedAt.toISOString(),
      buildCompassAdvisorContext(updated),
    );
  }

  const completedSessions = await loadCompletedCompassSessions(userId);
  const reconciledStrategicDashboard = reconcileStrategicDashboardCompassState(
    strategicDashboard,
    completedSessions,
    {
      activeCompassSessionId:
        nextStatus === 'completed' && (completingNow || input.setActive === true)
          ? updated.id
          : undefined,
    },
  );

  await db
    .update(userAppMeta)
    .set({
      strategicDashboard: reconciledStrategicDashboard,
      updatedAt: new Date(),
    })
    .where(eq(userAppMeta.userId, userId));

  return mapCompassSessionDetail(updated, reconciledStrategicDashboard.activeCompassSessionId);
}

export async function deleteCompassSession(userId: string, sessionId: string): Promise<boolean> {
  await ensureUserRecords(userId);

  const existing = await db.query.compassSessions.findFirst({
    where: and(
      eq(compassSessions.userId, userId),
      eq(compassSessions.id, sessionId),
    ),
  });

  if (!existing) {
    return false;
  }

  await db
    .delete(compassSessions)
    .where(
      and(
        eq(compassSessions.userId, userId),
        eq(compassSessions.id, sessionId),
      ),
    );

  const metaRow = await db.query.userAppMeta.findFirst({
    where: eq(userAppMeta.userId, userId),
  });
  const completedSessions = await loadCompletedCompassSessions(userId);
  const strategicDashboard = reconcileStrategicDashboardCompassState(
    metaRow?.strategicDashboard ?? createDefaultStrategicDashboardState(),
    completedSessions,
  );

  await db
    .update(userAppMeta)
    .set({
      strategicDashboard,
      updatedAt: new Date(),
    })
    .where(eq(userAppMeta.userId, userId));

  return true;
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
