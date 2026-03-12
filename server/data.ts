import { and, eq, lte, sql } from 'drizzle-orm';
import type { AppState } from '../src/types/app-state';
import type { AdvisorId } from '../src/types/advisor';
import { ALL_ADVISOR_IDS } from '../src/advisors/registry';
import { CURRENT_SCHEMA_VERSION } from '../src/constants/schema';
import { env } from './env';
import type {
  BootstrapResponse,
  CreateScheduledSessionInput,
  UpdateScheduledSessionInput,
  UserProfile,
} from '../src/types/api';
import type { ScheduledSession } from '../src/types/scheduled-session';
import { createDefaultAppState, createDefaultAdvisorState } from '../src/state/init';
import { clerkClient } from './auth';
import { db } from './db/client';
import {
  deleteCalendarEvent,
  exchangeGoogleCalendarCode,
  isGoogleCalendarConfigured,
  upsertCalendarEvent,
} from './google-calendar';
import {
  advisorStates,
  quickLogs,
  scheduledSessions,
  sharedMetrics,
  userAppMeta,
  userProfiles,
} from './db/schema';

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

async function deriveDisplayName(userId: string): Promise<string | null> {
  const user = await clerkClient.users.getUser(userId);
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();

  if (fullName) {
    return fullName;
  }

  return user.primaryEmailAddress?.emailAddress?.split('@')[0] ?? null;
}

export async function ensureUserRecords(userId: string): Promise<void> {
  const existingProfile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.id, userId),
  });

  if (!existingProfile) {
    const displayName = await deriveDisplayName(userId);

    await db.insert(userProfiles).values({
      id: userId,
      displayName,
    }).onConflictDoNothing();
  }

  await Promise.all([
    db.insert(sharedMetrics).values({
      userId,
      metrics: {},
    }).onConflictDoNothing(),
    db.insert(quickLogs).values({
      userId,
      logs: [],
    }).onConflictDoNothing(),
    db.insert(userAppMeta).values({
      userId,
      schemaVersion: CURRENT_SCHEMA_VERSION,
    }).onConflictDoNothing(),
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
      .update(userAppMeta)
      .set({ schemaVersion: CURRENT_SCHEMA_VERSION, updatedAt: new Date() })
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

  const [advisorRows, sharedMetricsRow, quickLogsRow, metaRow] = await Promise.all([
    db.select().from(advisorStates).where(eq(advisorStates.userId, userId)),
    db.query.sharedMetrics.findFirst({ where: eq(sharedMetrics.userId, userId) }),
    db.query.quickLogs.findFirst({ where: eq(quickLogs.userId, userId) }),
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
  baseState.schemaVersion = metaRow?.schemaVersion ?? CURRENT_SCHEMA_VERSION;
  baseState.initialized = true;

  return baseState;
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

  if (!profile?.googleCalendarConnected || !profile.googleCalendarRefreshToken || !isGoogleCalendarConfigured()) {
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
      .insert(userAppMeta)
      .values({
        userId,
        schemaVersion: appState.schemaVersion,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userAppMeta.userId,
        set: {
          schemaVersion: appState.schemaVersion,
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

  return mapProfile(updated);
}

export async function disconnectGoogleCalendar(userId: string): Promise<UserProfile> {
  await ensureUserRecords(userId);

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
