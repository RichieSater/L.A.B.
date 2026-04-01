import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import type { AdvisorState } from '../../src/types/advisor.js';
import { CURRENT_SCHEMA_VERSION } from '../../src/constants/schema.js';
import type { SharedMetricsStore } from '../../src/types/metrics.js';
import type { QuickLogEntry } from '../../src/types/quick-log.js';
import type { CalendarSyncStatus, ScheduledSessionStatus } from '../../src/types/scheduled-session.js';
import type { TaskPlanningStore } from '../../src/types/task-planning.js';
import type { DailyPlanningState } from '../../src/types/daily-planning.js';
import type { StrategicDashboardState } from '../../src/types/strategic-dashboard.js';
import type { WeeklyFocusState } from '../../src/types/weekly-focus.js';
import type { WeeklyReviewState } from '../../src/types/weekly-review.js';
import type {
  CompassAnswers,
  CompassInsights,
  CompassSessionStatus,
} from '../../src/types/compass.js';

export const scheduledSessionStatusEnum = pgEnum('scheduled_session_status', [
  'scheduled',
  'completed',
  'missed',
  'cancelled',
]);

export const calendarSyncStatusEnum = pgEnum('calendar_sync_status', [
  'disabled',
  'pending',
  'synced',
  'failed',
]);

export const compassSessionStatusEnum = pgEnum('compass_session_status', [
  'in_progress',
  'completed',
  'abandoned',
]);

export const userProfiles = pgTable('user_profiles', {
  id: text('id').primaryKey(),
  displayName: text('display_name'),
  schedulingEnabled: boolean('scheduling_enabled').notNull().default(false),
  googleCalendarConnected: boolean('google_calendar_connected').notNull().default(false),
  googleCalendarEmail: text('google_calendar_email'),
  googleCalendarRefreshToken: text('google_calendar_refresh_token'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const advisorStates = pgTable(
  'advisor_states',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => userProfiles.id, { onDelete: 'cascade' }),
    advisorId: text('advisor_id').notNull(),
    state: jsonb('state').$type<AdvisorState>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  table => ({
    advisorStateUserAdvisorIdx: uniqueIndex('advisor_states_user_advisor_idx').on(table.userId, table.advisorId),
  }),
);

export const sharedMetrics = pgTable('shared_metrics', {
  userId: text('user_id').primaryKey().references(() => userProfiles.id, { onDelete: 'cascade' }),
  metrics: jsonb('metrics').$type<SharedMetricsStore>().notNull().default(sql`'{}'::jsonb`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const quickLogs = pgTable('quick_logs', {
  userId: text('user_id').primaryKey().references(() => userProfiles.id, { onDelete: 'cascade' }),
  logs: jsonb('logs').$type<QuickLogEntry[]>().notNull().default(sql`'[]'::jsonb`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const taskPlanningAssignments = pgTable('task_planning_assignments', {
  userId: text('user_id').primaryKey().references(() => userProfiles.id, { onDelete: 'cascade' }),
  assignments: jsonb('assignments').$type<TaskPlanningStore>().notNull().default(sql`'{}'::jsonb`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const scheduledSessions = pgTable('scheduled_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => userProfiles.id, { onDelete: 'cascade' }),
  advisorId: text('advisor_id').notNull(),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
  durationMinutes: integer('duration_minutes').notNull().default(60),
  windowMinutes: integer('window_minutes').notNull().default(60),
  status: scheduledSessionStatusEnum('status').$type<ScheduledSessionStatus>().notNull().default('scheduled'),
  calendarSyncStatus: calendarSyncStatusEnum('calendar_sync_status').$type<CalendarSyncStatus>().notNull().default('disabled'),
  googleCalendarEventId: text('google_calendar_event_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const compassSessions = pgTable('compass_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => userProfiles.id, { onDelete: 'cascade' }),
  planningYear: integer('planning_year').notNull(),
  title: text('title').notNull(),
  status: compassSessionStatusEnum('status').$type<CompassSessionStatus>().notNull().default('in_progress'),
  currentScreen: integer('current_screen').notNull().default(0),
  answers: jsonb('answers').$type<CompassAnswers>().notNull().default(sql`'{}'::jsonb`),
  insights: jsonb('insights').$type<CompassInsights | null>().default(sql`null`),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

export const userAppMeta = pgTable('user_app_meta', {
  userId: text('user_id').primaryKey().references(() => userProfiles.id, { onDelete: 'cascade' }),
  schemaVersion: integer('schema_version').notNull().default(CURRENT_SCHEMA_VERSION),
  dailyPlanning: jsonb('daily_planning')
    .$type<DailyPlanningState>()
    .notNull()
    .default(sql`'{"entries":[]}'::jsonb`),
  weeklyFocus: jsonb('weekly_focus')
    .$type<WeeklyFocusState>()
    .notNull()
    .default(sql`'{"weeks":[]}'::jsonb`),
  weeklyReview: jsonb('weekly_review')
    .$type<WeeklyReviewState>()
    .notNull()
    .default(sql`'{"entries":[]}'::jsonb`),
  strategicDashboard: jsonb('strategic_dashboard')
    .$type<StrategicDashboardState>()
    .notNull()
    .default(sql`'{"years":[],"latestCompassInsights":null}'::jsonb`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const userProfileRelations = relations(userProfiles, ({ many, one }) => ({
  advisorStates: many(advisorStates),
  sharedMetrics: one(sharedMetrics, {
    fields: [userProfiles.id],
    references: [sharedMetrics.userId],
  }),
  quickLogs: one(quickLogs, {
    fields: [userProfiles.id],
    references: [quickLogs.userId],
  }),
  taskPlanningAssignments: one(taskPlanningAssignments, {
    fields: [userProfiles.id],
    references: [taskPlanningAssignments.userId],
  }),
  userAppMeta: one(userAppMeta, {
    fields: [userProfiles.id],
    references: [userAppMeta.userId],
  }),
  scheduledSessions: many(scheduledSessions),
  compassSessions: many(compassSessions),
}));

export const advisorStateRelations = relations(advisorStates, ({ one }) => ({
  userProfile: one(userProfiles, {
    fields: [advisorStates.userId],
    references: [userProfiles.id],
  }),
}));

export const sharedMetricsRelations = relations(sharedMetrics, ({ one }) => ({
  userProfile: one(userProfiles, {
    fields: [sharedMetrics.userId],
    references: [userProfiles.id],
  }),
}));

export const quickLogsRelations = relations(quickLogs, ({ one }) => ({
  userProfile: one(userProfiles, {
    fields: [quickLogs.userId],
    references: [userProfiles.id],
  }),
}));

export const taskPlanningAssignmentsRelations = relations(taskPlanningAssignments, ({ one }) => ({
  userProfile: one(userProfiles, {
    fields: [taskPlanningAssignments.userId],
    references: [userProfiles.id],
  }),
}));

export const scheduledSessionsRelations = relations(scheduledSessions, ({ one }) => ({
  userProfile: one(userProfiles, {
    fields: [scheduledSessions.userId],
    references: [userProfiles.id],
  }),
}));

export const compassSessionsRelations = relations(compassSessions, ({ one }) => ({
  userProfile: one(userProfiles, {
    fields: [compassSessions.userId],
    references: [userProfiles.id],
  }),
}));

export const userAppMetaRelations = relations(userAppMeta, ({ one }) => ({
  userProfile: one(userProfiles, {
    fields: [userAppMeta.userId],
    references: [userProfiles.id],
  }),
}));
