import type { AppState } from '../types/app-state';
import type { AdvisorId } from '../types/advisor';
import type { HabitItem, TaskItem } from '../types/action-item';
import type { ScheduleEntry } from '../types/schedule';
import type { QuickLogEntry } from '../types/quick-log';
import type { TaskListPreset } from '../types/dashboard-navigation';
import {
  TASK_PLANNING_BUCKETS,
  getTaskPlanningKey,
  type TaskPlanningAssignment,
  type TaskPlanningBucket,
} from '../types/task-planning';
import {
  createDailyPlanningEntry,
  type DailyPlanningEntry,
} from '../types/daily-planning';
import {
  MAX_WEEKLY_FOCUS_ITEMS,
  type WeeklyFocusTaskRef,
} from '../types/weekly-focus';
import type { WeeklyReviewEntry } from '../types/weekly-review';
import { ADVISOR_CONFIGS, ACTIVE_ADVISOR_IDS } from '../advisors/registry';
import { addDays, daysAgo, daysBetween, endOfWeek, formatDateKey, startOfWeek, today } from '../utils/date';

export type DomainHealth = 'healthy' | 'attention' | 'critical';

const PINNED_ADVISOR_ORDER: AdvisorId[] = ['performance', 'prioritization'];
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 } as const;

function compareTaskItems(a: TaskItem, b: TaskItem): number {
  const pa = PRIORITY_ORDER[a.priority];
  const pb = PRIORITY_ORDER[b.priority];
  if (pa !== pb) return pa - pb;
  if (a.dueDate === 'ongoing') return 1;
  if (b.dueDate === 'ongoing') return -1;
  return a.dueDate.localeCompare(b.dueDate);
}

/**
 * Returns advisor IDs that are both in ACTIVE_ADVISOR_IDS (phase-gated)
 * AND activated by the user.
 */
export function selectActivatedAdvisorIds(state: AppState): AdvisorId[] {
  return ACTIVE_ADVISOR_IDS.filter(id => state.advisors[id]?.activated);
}

/**
 * Returns advisor IDs that are in ACTIVE_ADVISOR_IDS but NOT activated.
 * Used for the "available to activate" section on the dashboard.
 */
export function selectInactiveAdvisorIds(state: AppState): AdvisorId[] {
  return ACTIVE_ADVISOR_IDS.filter(id => !state.advisors[id]?.activated);
}

export function selectScheduleEntries(state: AppState): ScheduleEntry[] {
  const now = today();
  const entries: ScheduleEntry[] = [];
  const activatedIds = selectActivatedAdvisorIds(state);

  for (const id of activatedIds) {
    const advisor = state.advisors[id];
    const config = ADVISOR_CONFIGS[id];

    let isOverdue = false;
    let daysUntilDue = 0;

    if (!advisor.nextDueDate) {
      // Never had a session — due now
      isOverdue = true;
      daysUntilDue = 0;
    } else {
      daysUntilDue = daysBetween(now, advisor.nextDueDate);
      isOverdue = daysUntilDue < -config.defaultCadence.windowDays;
    }

    entries.push({
      advisorId: id,
      nextDueDate: advisor.nextDueDate,
      isOverdue,
      daysUntilDue,
      streak: advisor.streak,
      lastSessionDate: advisor.lastSessionDate,
    });
  }

  // Sort: overdue first (by most overdue), then by days until due ascending
  return entries.sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    return a.daysUntilDue - b.daysUntilDue;
  });
}

export function selectAdvisorsByUrgency(state: AppState): AdvisorId[] {
  return selectScheduleEntries(state).map(e => e.advisorId);
}

export function selectAdvisorsWithPinnedOrder(state: AppState): AdvisorId[] {
  const urgencySorted = selectAdvisorsByUrgency(state);
  const pinned = PINNED_ADVISOR_ORDER.filter(id => urgencySorted.includes(id));
  const rest = urgencySorted.filter(id => !PINNED_ADVISOR_ORDER.includes(id));
  return [...pinned, ...rest];
}

export interface EnrichedTaskItem extends TaskItem {
  advisorId: AdvisorId;
  advisorIcon: string;
  advisorName: string;
  advisorColor: string;
  planningBucket: TaskPlanningBucket | null;
  planningUpdatedAt: string | null;
}

export function selectAllTaskItems(state: AppState): EnrichedTaskItem[] {
  const items: EnrichedTaskItem[] = [];
  const activatedIds = selectActivatedAdvisorIds(state);

  for (const id of activatedIds) {
    const advisor = state.advisors[id];
    const config = ADVISOR_CONFIGS[id];
    for (const item of advisor.tasks) {
      const assignment = state.taskPlanning[getTaskPlanningKey(id, item.id)];
      items.push({
        ...item,
        advisorId: id,
        advisorIcon: config.icon,
        advisorName: config.shortName,
        advisorColor: config.domainColor,
        planningBucket: assignment?.bucket ?? null,
        planningUpdatedAt: assignment?.updatedAt ?? null,
      });
    }
  }

  return items.sort(compareTaskItems);
}

export interface EnrichedHabitItem extends HabitItem {
  advisorId: AdvisorId;
  advisorIcon: string;
  advisorName: string;
  advisorColor: string;
}

export function selectAllHabits(state: AppState): EnrichedHabitItem[] {
  const habits: EnrichedHabitItem[] = [];
  const activatedIds = selectActivatedAdvisorIds(state);

  for (const id of activatedIds) {
    const advisor = state.advisors[id];
    const config = ADVISOR_CONFIGS[id];
    for (const habit of advisor.habits) {
      habits.push({
        ...habit,
        advisorId: id,
        advisorIcon: config.icon,
        advisorName: config.shortName,
        advisorColor: config.domainColor,
      });
    }
  }

  return habits.sort((a, b) => a.name.localeCompare(b.name));
}

export interface CalendarEvent {
  date: string;
  type: 'task' | 'session' | 'scheduled';
  label: string;
  advisorId: AdvisorId;
  advisorIcon: string;
  advisorName: string;
  advisorColor: string;
  priority?: 'high' | 'medium' | 'low';
  scheduledTime?: string; // ISO time for scheduled sessions
  itemId?: string; // action item ID for task completion toggle
}

export function selectCalendarEvents(state: AppState): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const activatedIds = selectActivatedAdvisorIds(state);

  for (const id of activatedIds) {
    const advisor = state.advisors[id];
    const config = ADVISOR_CONFIGS[id];

    // Task due dates
    for (const item of advisor.tasks) {
      if (item.status === 'open' && item.dueDate !== 'ongoing') {
        events.push({
          date: item.dueDate,
          type: 'task',
          label: item.task,
          advisorId: id,
          advisorIcon: config.icon,
          advisorName: config.shortName,
          advisorColor: config.domainColor,
          priority: item.priority,
          itemId: item.id,
        });
      }
    }

    // Next session due date
    if (advisor.nextDueDate) {
      events.push({
        date: advisor.nextDueDate,
        type: 'session',
        label: `${config.shortName} session due`,
        advisorId: id,
        advisorIcon: config.icon,
        advisorName: config.shortName,
        advisorColor: config.domainColor,
      });
    }
  }

  return events.sort((a, b) => a.date.localeCompare(b.date));
}

export function selectDomainHealth(state: AppState): Record<AdvisorId, DomainHealth> {
  const health = {} as Record<AdvisorId, DomainHealth>;
  const activatedIds = selectActivatedAdvisorIds(state);

  for (const id of activatedIds) {
    const advisor = state.advisors[id];
    const config = ADVISOR_CONFIGS[id];

    // No sessions ever = attention
    if (!advisor.lastSessionDate) {
      health[id] = 'attention';
      continue;
    }

    const daysSinceSession = daysAgo(advisor.lastSessionDate);
    const interval = config.defaultCadence.intervalDays;
    const window = config.defaultCadence.windowDays;

    if (daysSinceSession > interval + window) {
      health[id] = 'critical';
    } else if (daysSinceSession > interval) {
      health[id] = 'attention';
    } else {
      health[id] = 'healthy';
    }
  }

  return health;
}

export function selectOverallStreak(state: AppState): number {
  const activatedIds = selectActivatedAdvisorIds(state);
  const streaks = activatedIds.map(id => state.advisors[id].streak);
  if (streaks.length === 0) return 0;
  return Math.min(...streaks);
}

export function selectAllOpenTasks(
  state: AppState,
): (TaskItem & { advisorId: AdvisorId })[] {
  const items: (TaskItem & { advisorId: AdvisorId })[] = [];
  const activatedIds = selectActivatedAdvisorIds(state);

  for (const id of activatedIds) {
    const advisor = state.advisors[id];
    for (const item of advisor.tasks) {
      if (item.status === 'open') {
        items.push({ ...item, advisorId: id });
      }
    }
  }

  return items.sort(compareTaskItems);
}

export interface TaskPlanningLane {
  bucket: TaskPlanningBucket;
  label: string;
  description: string;
  items: EnrichedTaskItem[];
}

export interface TaskPlanningSummary {
  lanes: TaskPlanningLane[];
  unplanned: EnrichedTaskItem[];
  totalPlanned: number;
}

export interface WeeklyFocusTask extends EnrichedTaskItem {
  focusAddedAt: string;
  carriedForwardFromWeekStart: string | null;
}

export interface WeeklyFocusSummary {
  weekStart: string;
  items: WeeklyFocusTask[];
  completedCount: number;
  openCount: number;
  remainingSlots: number;
  previousWeekStart: string | null;
  carryForwardCandidates: WeeklyFocusTask[];
  suggestedTasks: EnrichedTaskItem[];
}

export interface DailyPlanningSummary {
  date: string;
  entry: DailyPlanningEntry;
  previousEntry: DailyPlanningEntry | null;
  completedToday: boolean;
  completedAt: string | null;
  counts: {
    today: number;
    carryOver: number;
    focusOutsideToday: number;
    overdueOpen: number;
    pullInCandidates: number;
  };
  carryOverToday: EnrichedTaskItem[];
  focusOutsideToday: WeeklyFocusTask[];
  pullInCandidates: EnrichedTaskItem[];
  actionGroups: DailyPlanningActionGroup[];
}

export interface DailyPlanningActionGroup {
  id: 'carry_over' | 'focus_outside_today' | 'pull_into_today';
  title: string;
  description: string;
  items: EnrichedTaskItem[];
  remainingCount: number;
}

export interface WeeklyReviewSummary {
  weekStart: string;
  weekEnd: string;
  entry: WeeklyReviewEntry;
  previousEntry: WeeklyReviewEntry | null;
  completedThisWeek: boolean;
  completedAt: string | null;
  counts: {
    today: number;
    thisWeek: number;
    later: number;
    unplanned: number;
    overdueOpen: number;
  };
  momentum: {
    completedTasks: number;
    completedFocusTasks: number;
    sessions: number;
    quickLogDays: number;
    activeAdvisors: number;
  };
  staleToday: EnrichedTaskItem[];
  overduePlanned: EnrichedTaskItem[];
  highPriorityUnplanned: EnrichedTaskItem[];
  recentWins: WeeklyReviewWin[];
  advisorSnapshots: WeeklyReviewAdvisorSnapshot[];
  recapSections: WeeklyReviewRecapSection[];
  actionGroups: WeeklyReviewActionGroup[];
}

export interface WeeklyReviewActionGroup {
  id: 'stale_today' | 'overdue_planned' | 'high_priority_unplanned';
  title: string;
  description: string;
  items: EnrichedTaskItem[];
  remainingCount: number;
}

export interface WeeklyReviewWin extends EnrichedTaskItem {
  completedDate: string;
}

export interface WeeklyReviewAdvisorSnapshot {
  advisorId: AdvisorId;
  advisorIcon: string;
  advisorName: string;
  advisorColor: string;
  completedTasks: number;
  sessions: number;
  quickLogs: number;
  openTasks: number;
  plannedOpen: number;
  overdueOpen: number;
  status: 'attention' | 'momentum' | 'quiet';
  note: string;
}

export interface WeeklyReviewRecapSection {
  id: 'wins' | 'advisors' | 'pressure' | 'focus';
  title: string;
  description: string;
  lines: string[];
  emptyState: string;
  tone: 'success' | 'primary' | 'attention' | 'neutral';
}

export type RecentActivityWindow = 'today' | 'last_7_days' | 'this_week';
export type RecentActivityType = 'task_complete' | 'session' | 'quick_log' | 'daily_plan' | 'weekly_review';

export interface RecentActivityItem {
  id: string;
  type: RecentActivityType;
  title: string;
  detail: string;
  occurredAt: string;
  occurredDate: string;
  advisorId: AdvisorId | null;
  advisorIcon: string | null;
  advisorName: string | null;
  advisorColor: string | null;
}

export interface RecentActivitySummary {
  window: RecentActivityWindow;
  windowLabel: string;
  rangeStart: string;
  rangeEnd: string;
  scopeAdvisorId: AdvisorId | null;
  scopeAdvisorName: string | null;
  total: number;
  remainingCount: number;
  counts: {
    completedTasks: number;
    sessions: number;
    quickLogs: number;
    rituals: number;
  };
  items: RecentActivityItem[];
}

export interface AdvisorAttentionItem {
  advisorId: AdvisorId;
  advisorIcon: string;
  advisorName: string;
  advisorColor: string;
  status: 'urgent' | 'attention' | 'steady';
  primaryAction: 'schedule' | 'plan' | 'quick_log' | 'review';
  planningPreset: Exclude<TaskListPreset, 'all_open'> | null;
  planningLabel: string | null;
  planningCount: number;
  alternatePlanningShortcuts: AdvisorAttentionPlanningShortcut[];
  headline: string;
  reason: string;
  lastSessionDate: string | null;
  nextDueDate: string | null;
  lastQuickLogDate: string | null;
  openTasks: number;
  plannedOpen: number;
  unplannedOpen: number;
  overdueOpen: number;
  highPriorityUnplanned: number;
  completedTasksThisWeek: number;
  sessionsThisWeek: number;
  quickLogsThisWeek: number;
}

export interface AdvisorAttentionPlanningShortcut {
  preset: AdvisorPlanningPreset;
  label: string;
  count: number;
  headline: string;
  reason: string;
}

export interface AdvisorAttentionSummary {
  items: AdvisorAttentionItem[];
  needsAttentionCount: number;
  scheduleCount: number;
  planCount: number;
  quickLogCount: number;
  quietCount: number;
}

type AdvisorPlanningPreset = Exclude<TaskListPreset, 'all_open'>;

const TASK_PLANNING_LABELS: Record<TaskPlanningBucket, { label: string; description: string }> = {
  today: {
    label: 'Today',
    description: 'Needs attention in the current workday.',
  },
  this_week: {
    label: 'This Week',
    description: 'Important soon, but not committed to a specific slot yet.',
  },
  later: {
    label: 'Later',
    description: 'Keep visible without crowding the near-term queue.',
  },
};

const RECENT_ACTIVITY_WINDOW_LABELS: Record<RecentActivityWindow, string> = {
  today: 'Today',
  last_7_days: 'Last 7 Days',
  this_week: 'This Week',
};

const ADVISOR_PLANNING_PRESET_LABELS: Record<AdvisorPlanningPreset, string> = {
  needs_triage: 'Needs Triage',
  carry_over: 'Carry Over',
  overdue: 'Overdue',
  weekly_focus: 'Weekly Focus',
};

function getAdvisorPlanningLaneCopy(input: {
  preset: AdvisorPlanningPreset;
  highPriorityUnplanned: number;
  unplannedOpen: number;
  staleTodayOpen: number;
  overdueOpen: number;
  weeklyFocusOpen: number;
}): { headline: string; reason: string } {
  const {
    preset,
    highPriorityUnplanned,
    unplannedOpen,
    staleTodayOpen,
    overdueOpen,
    weeklyFocusOpen,
  } = input;

  if (preset === 'needs_triage') {
    const planSignals = [
      highPriorityUnplanned > 0 ? `${highPriorityUnplanned} high-priority unplanned` : null,
      unplannedOpen > 0 ? `${unplannedOpen} unplanned total` : null,
    ].filter(Boolean) as string[];

    return {
      headline: 'Queue needs a decision',
      reason: `${planSignals.join(' • ')}. Move this work into a real bucket before it turns into background guilt.`,
    };
  }

  if (preset === 'carry_over') {
    return {
      headline: 'Today work is stalling',
      reason: `${staleTodayOpen} task${staleTodayOpen === 1 ? ' is' : 's are'} still sitting in Today from an earlier sweep. Rebucket or schedule the real commitment before adding more.`,
    };
  }

  if (preset === 'overdue') {
    return {
      headline: 'Task pressure is building',
      reason: `${overdueOpen} overdue task${overdueOpen === 1 ? ' is' : 's are'} still open. Clear the slipped commitment before it becomes ambient stress.`,
    };
  }

  return {
    headline: 'Weekly focus is stuck',
    reason: `${weeklyFocusOpen} weekly focus task${weeklyFocusOpen === 1 ? ' is' : 's are'} still open for this advisor. Move the current commitment before promoting fresh work.`,
  };
}

function getTaskIdentity(advisorId: AdvisorId, taskId: string): string {
  return `${advisorId}:${taskId}`;
}

function buildEnrichedTaskLookup(state: AppState): Map<string, EnrichedTaskItem> {
  return new Map(
    selectAllTaskItems(state).map(item => [getTaskIdentity(item.advisorId, item.id), item]),
  );
}

function enrichWeeklyFocusTask(
  ref: WeeklyFocusTaskRef,
  taskLookup: Map<string, EnrichedTaskItem>,
): WeeklyFocusTask | null {
  const item = taskLookup.get(getTaskIdentity(ref.advisorId, ref.taskId));
  if (!item) {
    return null;
  }

  return {
    ...item,
    focusAddedAt: ref.addedAt,
    carriedForwardFromWeekStart: ref.carriedForwardFromWeekStart,
  };
}

function getRecentActivityRange(
  window: RecentActivityWindow,
  todayDate: string,
): { start: string; end: string } {
  if (window === 'today') {
    return {
      start: todayDate,
      end: todayDate,
    };
  }

  if (window === 'this_week') {
    return {
      start: startOfWeek(todayDate),
      end: endOfWeek(todayDate),
    };
  }

  return {
    start: addDays(todayDate, -6),
    end: todayDate,
  };
}

function summarizeTaskNames(items: EnrichedTaskItem[], maxItems: number = 2): string {
  const visible = items.slice(0, maxItems).map(item => item.task);
  const remainingCount = Math.max(items.length - visible.length, 0);
  if (visible.length === 0) {
    return '';
  }

  if (remainingCount === 0) {
    return visible.join(', ');
  }

  return `${visible.join(', ')} (+${remainingCount} more)`;
}

function buildWeeklyReviewRecapSections(input: {
  recentWins: WeeklyReviewWin[];
  advisorSnapshots: WeeklyReviewAdvisorSnapshot[];
  staleToday: EnrichedTaskItem[];
  overduePlanned: EnrichedTaskItem[];
  highPriorityUnplanned: EnrichedTaskItem[];
}): WeeklyReviewRecapSection[] {
  const {
    recentWins,
    advisorSnapshots,
    staleToday,
    overduePlanned,
    highPriorityUnplanned,
  } = input;

  const topMomentumAdvisor = advisorSnapshots.find(snapshot => snapshot.status === 'momentum');
  const quietAdvisorWithOpenTasks = advisorSnapshots.find(
    snapshot => snapshot.status === 'quiet' && snapshot.openTasks > 0,
  );

  const focusLines = [
    overduePlanned[0]
      ? `Resolve ${overduePlanned[0].task} before adding fresh commitments.`
      : null,
    highPriorityUnplanned[0]
      ? `Give ${highPriorityUnplanned[0].task} a real bucket before next week starts.`
      : null,
    !highPriorityUnplanned[0] && staleToday[0]
      ? `Either schedule or rebucket ${staleToday[0].task} instead of carrying it again.`
      : null,
    topMomentumAdvisor
      ? `Keep ${topMomentumAdvisor.advisorName} active; it produced visible momentum this week.`
      : quietAdvisorWithOpenTasks
        ? `Unstick ${quietAdvisorWithOpenTasks.advisorName} with one concrete next task instead of vague carry-forward.`
        : null,
  ].filter((line): line is string => !!line);

  return [
    {
      id: 'wins',
      title: 'What moved',
      description: 'Concrete wins from the week so the review starts from evidence.',
      lines: recentWins.slice(0, 3).map(item => `${item.task} (${item.advisorName})`),
      emptyState: 'No completed task wins were captured this week yet.',
      tone: 'success',
    },
    {
      id: 'advisors',
      title: 'Active domains',
      description: 'Which advisors generated momentum or still need attention.',
      lines: advisorSnapshots
        .filter(snapshot => snapshot.status !== 'quiet' || snapshot.openTasks > 0)
        .slice(0, 3)
        .map(snapshot => `${snapshot.advisorName}: ${snapshot.note}`),
      emptyState: 'No advisor-specific movement is standing out yet.',
      tone: 'primary',
    },
    {
      id: 'pressure',
      title: 'Unfinished pressure',
      description: 'The queue or planning friction most likely to leak into next week.',
      lines: [
        overduePlanned.length > 0
          ? `Overdue planned: ${summarizeTaskNames(overduePlanned)}.`
          : null,
        staleToday.length > 0
          ? `Still sitting in Today: ${summarizeTaskNames(staleToday)}.`
          : null,
        highPriorityUnplanned.length > 0
          ? `High-priority but unplanned: ${summarizeTaskNames(highPriorityUnplanned)}.`
          : null,
      ].filter((line): line is string => !!line),
      emptyState: 'The queue is balanced right now; there is no obvious spillover pressure.',
      tone: 'attention',
    },
    {
      id: 'focus',
      title: 'Next week focus',
      description: 'Deterministic prompts for what deserves the first planning decision next.',
      lines: focusLines.slice(0, 3),
      emptyState: 'Protect momentum and schedule from the current Today bucket before adding more backlog.',
      tone: 'neutral',
    },
  ];
}

function getActivityDateKey(value: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : formatDateKey(new Date(value));
}

function isActivityWithinRange(value: string, start: string, end: string): boolean {
  const dateKey = getActivityDateKey(value);
  return dateKey >= start && dateKey <= end;
}

function getActivitySortTimestamp(value: string): number {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T12:00:00`).getTime();
  }

  return new Date(value).getTime();
}

function summarizeQuickLog(log: QuickLogEntry): string {
  const entries = Object.entries(log.logs);
  if (entries.length === 0) {
    return 'Captured a quick check-in.';
  }

  const [firstKey, firstValue] = entries[0];
  const label = firstKey.replace(/_/g, ' ');
  const extraCount = entries.length - 1;

  return `${label}: ${String(firstValue)}${extraCount > 0 ? ` +${extraCount} more` : ''}`;
}

export function selectTaskPlanningSummary(state: AppState): TaskPlanningSummary {
  const openItems = selectAllTaskItems(state).filter(item => item.status === 'open');
  const laneItems = Object.fromEntries(
    TASK_PLANNING_BUCKETS.map(bucket => [bucket, [] as EnrichedTaskItem[]]),
  ) as Record<TaskPlanningBucket, EnrichedTaskItem[]>;
  const unplanned: EnrichedTaskItem[] = [];

  for (const item of openItems) {
    if (!item.planningBucket) {
      unplanned.push(item);
      continue;
    }

    laneItems[item.planningBucket].push(item);
  }

  const lanes = TASK_PLANNING_BUCKETS.map(bucket => ({
    bucket,
    label: TASK_PLANNING_LABELS[bucket].label,
    description: TASK_PLANNING_LABELS[bucket].description,
    items: [...laneItems[bucket]].sort(compareTaskItems),
  }));

  return {
    lanes,
    unplanned: [...unplanned].sort(compareTaskItems),
    totalPlanned: lanes.reduce((sum, lane) => sum + lane.items.length, 0),
  };
}

export function selectTaskPlanningAssignments(state: AppState): TaskPlanningAssignment[] {
  return [...Object.values(state.taskPlanning)].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function selectDailyPlanningSummary(
  state: AppState,
  todayDate: string = today(),
): DailyPlanningSummary {
  const planning = selectTaskPlanningSummary(state);
  const focus = selectWeeklyFocusSummary(state, todayDate);
  const openItems = selectAllTaskItems(state).filter(item => item.status === 'open');
  const todayLane = planning.lanes.find(lane => lane.bucket === 'today');
  const entry =
    state.dailyPlanning.entries.find(dailyEntry => dailyEntry.date === todayDate)
    ?? createDailyPlanningEntry(todayDate);
  const previousEntry =
    state.dailyPlanning.entries.find(
      dailyEntry =>
        dailyEntry.date < todayDate
        && (
          dailyEntry.completedAt !== null
          || dailyEntry.headline.trim().length > 0
          || dailyEntry.guardrail.trim().length > 0
        ),
    ) ?? null;
  const carryOverToday =
    todayLane?.items
      .filter(item => {
        if (!item.planningUpdatedAt) {
          return false;
        }

        return formatDateKey(new Date(item.planningUpdatedAt)) < todayDate;
      })
      .sort((a, b) => (a.planningUpdatedAt ?? '').localeCompare(b.planningUpdatedAt ?? '')) ?? [];
  const focusOutsideToday = focus.items
    .filter(item => item.status === 'open' && item.planningBucket !== 'today')
    .sort(compareTaskItems);
  const takenKeys = new Set<string>([
    ...carryOverToday.map(item => getTaskIdentity(item.advisorId, item.id)),
    ...focusOutsideToday.map(item => getTaskIdentity(item.advisorId, item.id)),
    ...(todayLane?.items ?? []).map(item => getTaskIdentity(item.advisorId, item.id)),
  ]);
  const thisWeekItems = planning.lanes.find(lane => lane.bucket === 'this_week')?.items ?? [];
  const pullInPool = [
    ...thisWeekItems,
    ...planning.unplanned.filter(item => item.priority === 'high'),
    ...openItems.filter(
      item =>
        item.planningBucket === 'later'
        && item.dueDate !== 'ongoing'
        && item.dueDate <= addDays(todayDate, 2),
    ),
  ];
  const seenPullIns = new Set<string>();
  const pullInCandidates = pullInPool
    .filter(item => item.status === 'open')
    .filter(item => {
      const key = getTaskIdentity(item.advisorId, item.id);
      if (takenKeys.has(key) || seenPullIns.has(key)) {
        return false;
      }

      seenPullIns.add(key);
      return true;
    })
    .sort(compareTaskItems)
    .slice(0, 6);
  const seen = new Set<string>();
  const buildActionGroup = (
    id: DailyPlanningActionGroup['id'],
    title: string,
    description: string,
    items: EnrichedTaskItem[],
  ): DailyPlanningActionGroup | null => {
    const deduped = items.filter(item => {
      const key = getTaskIdentity(item.advisorId, item.id);
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });

    if (deduped.length === 0) {
      return null;
    }

    const visible = deduped.slice(0, 3);
    return {
      id,
      title,
      description,
      items: visible,
      remainingCount: Math.max(deduped.length - visible.length, 0),
    };
  };
  const actionGroups = [
    buildActionGroup(
      'carry_over',
      'Carry Over Cleanup',
      'These tasks are still sitting in Today from an earlier sweep.',
      carryOverToday,
    ),
    buildActionGroup(
      'focus_outside_today',
      'Focus Needs a Today Decision',
      'Weekly focus only works if the important tasks actually land in Today or get consciously deferred.',
      focusOutsideToday,
    ),
    buildActionGroup(
      'pull_into_today',
      'Pull Into Today',
      'High-signal work that deserves a same-day decision before the day gets reactive.',
      pullInCandidates,
    ),
  ].filter((group): group is DailyPlanningActionGroup => group !== null);

  return {
    date: todayDate,
    entry,
    previousEntry,
    completedToday: entry.completedAt !== null,
    completedAt: entry.completedAt,
    counts: {
      today: todayLane?.items.length ?? 0,
      carryOver: carryOverToday.length,
      focusOutsideToday: focusOutsideToday.length,
      overdueOpen: openItems.filter(item => item.dueDate !== 'ongoing' && item.dueDate < todayDate).length,
      pullInCandidates: pullInCandidates.length,
    },
    carryOverToday,
    focusOutsideToday,
    pullInCandidates,
    actionGroups,
  };
}

export function selectWeeklyFocusSummary(
  state: AppState,
  todayDate: string = today(),
): WeeklyFocusSummary {
  const weekStart = startOfWeek(todayDate);
  const taskLookup = buildEnrichedTaskLookup(state);
  const currentWeek = state.weeklyFocus.weeks.find(week => week.weekStart === weekStart);
  const previousWeek = state.weeklyFocus.weeks.find(week => week.weekStart < weekStart)
    ?? state.weeklyFocus.weeks.find(week => week.weekStart === addDays(weekStart, -7));
  const currentItems = (currentWeek?.items ?? [])
    .map(ref => enrichWeeklyFocusTask(ref, taskLookup))
    .filter((item): item is WeeklyFocusTask => item !== null)
    .sort(compareTaskItems);
  const currentKeys = new Set(
    currentItems.map(item => getTaskIdentity(item.advisorId, item.id)),
  );
  const carryForwardCandidates = (previousWeek?.items ?? [])
    .map(ref => enrichWeeklyFocusTask(ref, taskLookup))
    .filter(
      (item): item is WeeklyFocusTask =>
        item !== null &&
        item.status === 'open' &&
        !currentKeys.has(getTaskIdentity(item.advisorId, item.id)),
    )
    .sort(compareTaskItems);
  const planning = selectTaskPlanningSummary(state);
  const review = selectWeeklyReviewSummary(state, todayDate);
  const suggestionPool = [
    ...review.overduePlanned,
    ...(planning.lanes.find(lane => lane.bucket === 'this_week')?.items ?? []),
    ...review.highPriorityUnplanned,
    ...(planning.lanes.find(lane => lane.bucket === 'today')?.items ?? []),
    ...planning.unplanned,
  ];
  const seenSuggestions = new Set<string>();
  const suggestedTasks = suggestionPool
    .filter(item => item.status === 'open')
    .filter(item => {
      const key = getTaskIdentity(item.advisorId, item.id);
      if (currentKeys.has(key) || seenSuggestions.has(key)) {
        return false;
      }

      seenSuggestions.add(key);
      return true;
    })
    .sort(compareTaskItems)
    .slice(0, 6);

  return {
    weekStart,
    items: currentItems,
    completedCount: currentItems.filter(item => item.status === 'completed').length,
    openCount: currentItems.filter(item => item.status === 'open').length,
    remainingSlots: Math.max(MAX_WEEKLY_FOCUS_ITEMS - currentItems.length, 0),
    previousWeekStart: previousWeek?.weekStart ?? null,
    carryForwardCandidates,
    suggestedTasks,
  };
}

export function selectWeeklyReviewSummary(
  state: AppState,
  todayDate: string = today(),
): WeeklyReviewSummary {
  const planning = selectTaskPlanningSummary(state);
  const taskLookup = buildEnrichedTaskLookup(state);
  const openItems = selectAllTaskItems(state).filter(item => item.status === 'open');
  const completedItems = selectAllTaskItems(state).filter(
    item =>
      item.status === 'completed'
      && !!item.completedDate
      && item.completedDate >= startOfWeek(todayDate)
      && item.completedDate <= endOfWeek(todayDate),
  );
  const weekStart = startOfWeek(todayDate);
  const weekEnd = endOfWeek(todayDate);
  const quickLogsThisWeek = state.quickLogs.filter(
    log => log.date >= weekStart && log.date <= weekEnd,
  );
  const todayLane = planning.lanes.find(lane => lane.bucket === 'today');
  const entry = state.weeklyReview.entries.find(reviewEntry => reviewEntry.weekStart === weekStart) ?? {
    weekStart,
    completedAt: null,
    biggestWin: '',
    biggestLesson: '',
    nextWeekNote: '',
  };
  const previousEntry =
    state.weeklyReview.entries.find(
      reviewEntry =>
        reviewEntry.weekStart < weekStart
        && (
          reviewEntry.completedAt !== null
          || reviewEntry.biggestWin.trim().length > 0
          || reviewEntry.biggestLesson.trim().length > 0
          || reviewEntry.nextWeekNote.trim().length > 0
        ),
    ) ?? null;
  const completedThisWeek = entry.completedAt !== null;
  const staleToday =
    todayLane?.items
      .filter(item => {
        if (!item.planningUpdatedAt) {
          return false;
        }

        return formatDateKey(new Date(item.planningUpdatedAt)) < todayDate;
      })
      .sort((a, b) => (a.planningUpdatedAt ?? '').localeCompare(b.planningUpdatedAt ?? '')) ?? [];
  const overduePlanned = openItems
    .filter(
      item =>
        !!item.planningBucket &&
        item.dueDate !== 'ongoing' &&
        item.dueDate < todayDate,
    )
    .sort(compareTaskItems);
  const highPriorityUnplanned = planning.unplanned
    .filter(item => item.priority === 'high')
    .sort(compareTaskItems);
  const focusTaskRefs =
    state.weeklyFocus.weeks.find(week => week.weekStart === weekStart)?.items ?? [];
  const completedFocusTasks = focusTaskRefs
    .map(ref => taskLookup.get(getTaskIdentity(ref.advisorId, ref.taskId)))
    .filter(
      (item): item is EnrichedTaskItem =>
        !!item &&
        item.status === 'completed' &&
        !!item.completedDate &&
        item.completedDate >= weekStart &&
        item.completedDate <= weekEnd,
    );
  const recentWins = [...completedItems]
    .sort((a, b) => {
      const completedCompare = (b.completedDate ?? '').localeCompare(a.completedDate ?? '');
      if (completedCompare !== 0) {
        return completedCompare;
      }

      return compareTaskItems(a, b);
    })
    .map(item => ({
      ...item,
      completedDate: item.completedDate as string,
    }))
    .slice(0, 4);
  const advisorQuickLogCounts = quickLogsThisWeek.reduce<Record<AdvisorId, number>>((acc, log) => {
    acc[log.advisorId] = (acc[log.advisorId] ?? 0) + 1;
    return acc;
  }, {} as Record<AdvisorId, number>);
  const advisorSnapshots = selectActivatedAdvisorIds(state)
    .map<WeeklyReviewAdvisorSnapshot>(advisorId => {
      const config = ADVISOR_CONFIGS[advisorId];
      const advisorState = state.advisors[advisorId];
      const completedTasks = completedItems.filter(item => item.advisorId === advisorId).length;
      const sessions = advisorState.sessions.filter(
        session => session.date >= weekStart && session.date <= weekEnd,
      ).length;
      const quickLogs = advisorQuickLogCounts[advisorId] ?? 0;
      const advisorOpenItems = openItems.filter(item => item.advisorId === advisorId);
      const openTasks = advisorOpenItems.length;
      const plannedOpen = advisorOpenItems.filter(item => !!item.planningBucket).length;
      const overdueOpen = advisorOpenItems.filter(
        item => item.dueDate !== 'ongoing' && item.dueDate < todayDate,
      ).length;
      const activityScore = completedTasks * 3 + sessions * 2 + quickLogs;
      const status: WeeklyReviewAdvisorSnapshot['status'] =
        overdueOpen > 0 ? 'attention' : activityScore > 0 ? 'momentum' : 'quiet';
      const activityParts = [
        completedTasks > 0 ? `${completedTasks} completed` : null,
        sessions > 0 ? `${sessions} session${sessions === 1 ? '' : 's'}` : null,
        quickLogs > 0 ? `${quickLogs} quick log${quickLogs === 1 ? '' : 's'}` : null,
      ].filter(Boolean) as string[];

      let note = 'No new momentum captured this week yet.';
      if (status === 'attention') {
        note =
          activityParts.length > 0
            ? `${activityParts.join(', ')}, but ${overdueOpen} overdue task${overdueOpen === 1 ? '' : 's'} still open.`
            : `${overdueOpen} overdue open task${overdueOpen === 1 ? '' : 's'} still need attention.`;
      } else if (status === 'momentum') {
        note = activityParts.join(', ');
      } else if (openTasks > 0) {
        note = `${openTasks} open task${openTasks === 1 ? '' : 's'} remain, but this advisor had no sessions, wins, or quick logs this week.`;
      }

      return {
        advisorId,
        advisorIcon: config.icon,
        advisorName: config.shortName,
        advisorColor: config.domainColor,
        completedTasks,
        sessions,
        quickLogs,
        openTasks,
        plannedOpen,
        overdueOpen,
        status,
        note,
      };
    })
    .sort((a, b) => {
      const statusRank = { attention: 0, momentum: 1, quiet: 2 } as const;
      if (statusRank[a.status] !== statusRank[b.status]) {
        return statusRank[a.status] - statusRank[b.status];
      }

      if (a.overdueOpen !== b.overdueOpen) {
        return b.overdueOpen - a.overdueOpen;
      }

      const activityA = a.completedTasks * 3 + a.sessions * 2 + a.quickLogs;
      const activityB = b.completedTasks * 3 + b.sessions * 2 + b.quickLogs;
      if (activityA !== activityB) {
        return activityB - activityA;
      }

      return a.advisorName.localeCompare(b.advisorName);
    });
  const seen = new Set<string>();
  const buildActionGroup = (
    id: WeeklyReviewActionGroup['id'],
    title: string,
    description: string,
    items: EnrichedTaskItem[],
  ): WeeklyReviewActionGroup | null => {
    const deduped = items.filter(item => {
      const key = `${item.advisorId}:${item.id}`;
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });

    if (deduped.length === 0) {
      return null;
    }

    const visible = deduped.slice(0, 3);
    return {
      id,
      title,
      description,
      items: visible,
      remainingCount: Math.max(deduped.length - visible.length, 0),
    };
  };
  const actionGroups = [
    buildActionGroup(
      'stale_today',
      'Rescue Today',
      'These tasks have been sitting in Today since an earlier sweep.',
      staleToday,
    ),
    buildActionGroup(
      'overdue_planned',
      'Rebalance Due Work',
      'Queued tasks that are already past due and need a real decision now.',
      overduePlanned,
    ),
    buildActionGroup(
      'high_priority_unplanned',
      'Promote Important Backlog',
      'High-priority tasks still need a queue bucket before the week gets away from you.',
      highPriorityUnplanned,
    ),
  ].filter((group): group is WeeklyReviewActionGroup => group !== null);
  const recapSections = buildWeeklyReviewRecapSections({
    recentWins,
    advisorSnapshots,
    staleToday,
    overduePlanned,
    highPriorityUnplanned,
  });

  return {
    weekStart,
    weekEnd,
    entry,
    previousEntry,
    completedThisWeek,
    completedAt: entry.completedAt,
    counts: {
      today: todayLane?.items.length ?? 0,
      thisWeek: planning.lanes.find(lane => lane.bucket === 'this_week')?.items.length ?? 0,
      later: planning.lanes.find(lane => lane.bucket === 'later')?.items.length ?? 0,
      unplanned: planning.unplanned.length,
      overdueOpen: openItems.filter(item => item.dueDate !== 'ongoing' && item.dueDate < todayDate).length,
    },
    momentum: {
      completedTasks: completedItems.length,
      completedFocusTasks: completedFocusTasks.length,
      sessions: advisorSnapshots.reduce((sum, snapshot) => sum + snapshot.sessions, 0),
      quickLogDays: new Set(quickLogsThisWeek.map(log => log.date)).size,
      activeAdvisors: advisorSnapshots.filter(
        snapshot => snapshot.completedTasks + snapshot.sessions + snapshot.quickLogs > 0,
      ).length,
    },
    staleToday,
    overduePlanned,
    highPriorityUnplanned,
    recentWins,
    advisorSnapshots,
    recapSections,
    actionGroups,
  };
}

export function selectRecentActivitySummary(
  state: AppState,
  window: RecentActivityWindow = 'last_7_days',
  todayDate: string = today(),
  advisorScope: AdvisorId | null = null,
): RecentActivitySummary {
  const { start, end } = getRecentActivityRange(window, todayDate);
  const entries: Array<RecentActivityItem & { sortTimestamp: number }> = [];
  const activatedIds = advisorScope
    ? selectActivatedAdvisorIds(state).filter(advisorId => advisorId === advisorScope)
    : selectActivatedAdvisorIds(state);

  for (const advisorId of activatedIds) {
    const config = ADVISOR_CONFIGS[advisorId];
    const advisorState = state.advisors[advisorId];

    for (const task of advisorState.tasks) {
      if (
        task.status !== 'completed'
        || !task.completedDate
        || !isActivityWithinRange(task.completedDate, start, end)
      ) {
        continue;
      }

      entries.push({
        id: `task:${advisorId}:${task.id}:${task.completedDate}`,
        type: 'task_complete',
        title: task.task,
        detail: `Completed ${task.priority} priority task.`,
        occurredAt: task.completedDate,
        occurredDate: task.completedDate,
        advisorId,
        advisorIcon: config.icon,
        advisorName: config.shortName,
        advisorColor: config.domainColor,
        sortTimestamp: getActivitySortTimestamp(task.completedDate),
      });
    }

    for (const session of advisorState.sessions) {
      if (!isActivityWithinRange(session.date, start, end)) {
        continue;
      }

      entries.push({
        id: `session:${advisorId}:${session.id}:${session.date}`,
        type: 'session',
        title: `${config.shortName} session`,
        detail: session.summary,
        occurredAt: session.date,
        occurredDate: session.date,
        advisorId,
        advisorIcon: config.icon,
        advisorName: config.shortName,
        advisorColor: config.domainColor,
        sortTimestamp: getActivitySortTimestamp(session.date),
      });
    }
  }

  for (const log of state.quickLogs) {
    if (advisorScope && log.advisorId !== advisorScope) {
      continue;
    }

    if (!isActivityWithinRange(log.timestamp, start, end)) {
      continue;
    }

    const config = ADVISOR_CONFIGS[log.advisorId];
    if (!config) {
      continue;
    }

    entries.push({
      id: `quick-log:${log.advisorId}:${log.timestamp}`,
      type: 'quick_log',
      title: `${config.shortName} quick log`,
      detail: summarizeQuickLog(log),
      occurredAt: log.timestamp,
      occurredDate: log.date,
      advisorId: log.advisorId,
      advisorIcon: config.icon,
      advisorName: config.shortName,
      advisorColor: config.domainColor,
      sortTimestamp: getActivitySortTimestamp(log.timestamp),
    });
  }

  for (const entry of state.dailyPlanning.entries) {
    if (advisorScope) {
      continue;
    }

    if (!entry.completedAt || !isActivityWithinRange(entry.completedAt, start, end)) {
      continue;
    }

    entries.push({
      id: `daily-plan:${entry.date}:${entry.completedAt}`,
      type: 'daily_plan',
      title: 'Daily plan completed',
      detail:
        entry.headline.trim()
        || entry.guardrail.trim()
        || 'Closed the daily planning loop.',
      occurredAt: entry.completedAt,
      occurredDate: entry.date,
      advisorId: null,
      advisorIcon: null,
      advisorName: null,
      advisorColor: null,
      sortTimestamp: getActivitySortTimestamp(entry.completedAt),
    });
  }

  for (const entry of state.weeklyReview.entries) {
    if (advisorScope) {
      continue;
    }

    if (!entry.completedAt || !isActivityWithinRange(entry.completedAt, start, end)) {
      continue;
    }

    entries.push({
      id: `weekly-review:${entry.weekStart}:${entry.completedAt}`,
      type: 'weekly_review',
      title: 'Weekly review completed',
      detail:
        entry.biggestWin.trim()
        || entry.nextWeekNote.trim()
        || entry.biggestLesson.trim()
        || 'Closed the weekly review loop.',
      occurredAt: entry.completedAt,
      occurredDate: getActivityDateKey(entry.completedAt),
      advisorId: null,
      advisorIcon: null,
      advisorName: null,
      advisorColor: null,
      sortTimestamp: getActivitySortTimestamp(entry.completedAt),
    });
  }

  const sorted = entries.sort((a, b) => b.sortTimestamp - a.sortTimestamp);
  const visible: RecentActivityItem[] = sorted.slice(0, 10).map(item => ({
    id: item.id,
    type: item.type,
    title: item.title,
    detail: item.detail,
    occurredAt: item.occurredAt,
    occurredDate: item.occurredDate,
    advisorId: item.advisorId,
    advisorIcon: item.advisorIcon,
    advisorName: item.advisorName,
    advisorColor: item.advisorColor,
  }));

  return {
    window,
    windowLabel: RECENT_ACTIVITY_WINDOW_LABELS[window],
    rangeStart: start,
    rangeEnd: end,
    scopeAdvisorId: advisorScope,
    scopeAdvisorName: advisorScope ? ADVISOR_CONFIGS[advisorScope].shortName : null,
    total: sorted.length,
    remainingCount: Math.max(sorted.length - visible.length, 0),
    counts: {
      completedTasks: sorted.filter(item => item.type === 'task_complete').length,
      sessions: sorted.filter(item => item.type === 'session').length,
      quickLogs: sorted.filter(item => item.type === 'quick_log').length,
      rituals: sorted.filter(
        item => item.type === 'daily_plan' || item.type === 'weekly_review',
      ).length,
    },
    items: visible,
  };
}

export function selectAdvisorAttentionSummary(
  state: AppState,
  todayDate: string = today(),
): AdvisorAttentionSummary {
  const weekStart = startOfWeek(todayDate);
  const weekEnd = endOfWeek(todayDate);
  const currentWeekFocusRefs =
    state.weeklyFocus.weeks.find(week => week.weekStart === weekStart)?.items ?? [];
  const quickLogDatesByAdvisor = state.quickLogs.reduce<Record<AdvisorId, string[]>>((acc, log) => {
    const dates = acc[log.advisorId] ?? [];
    dates.push(log.date);
    acc[log.advisorId] = dates;
    return acc;
  }, {} as Record<AdvisorId, string[]>);

  const rankedItems = selectActivatedAdvisorIds(state).map(advisorId => {
    const config = ADVISOR_CONFIGS[advisorId];
    const advisorState = state.advisors[advisorId];
    const openTasks = advisorState.tasks.filter(task => task.status === 'open');
    const plannedOpen = openTasks.filter(task => !!state.taskPlanning[getTaskPlanningKey(advisorId, task.id)]).length;
    const unplannedOpen = openTasks.length - plannedOpen;
    const staleTodayOpen = openTasks.filter(task => {
      const assignment = state.taskPlanning[getTaskPlanningKey(advisorId, task.id)];
      if (!assignment || assignment.bucket !== 'today') {
        return false;
      }

      return formatDateKey(new Date(assignment.updatedAt)) < todayDate;
    }).length;
    const overdueOpen = openTasks.filter(
      task => task.dueDate !== 'ongoing' && task.dueDate < todayDate,
    ).length;
    const highPriorityUnplanned = openTasks.filter(
      task => task.priority === 'high' && !state.taskPlanning[getTaskPlanningKey(advisorId, task.id)],
    ).length;
    const completedTasksThisWeek = advisorState.tasks.filter(
      task =>
        task.status === 'completed'
        && !!task.completedDate
        && task.completedDate >= weekStart
        && task.completedDate <= weekEnd,
    ).length;
    const sessionsThisWeek = advisorState.sessions.filter(
      session => session.date >= weekStart && session.date <= weekEnd,
    ).length;
    const quickLogDates = [...(quickLogDatesByAdvisor[advisorId] ?? [])].sort((a, b) => a.localeCompare(b));
    const lastQuickLogDate = quickLogDates.at(-1) ?? null;
    const quickLogsThisWeek = quickLogDates.filter(date => date >= weekStart && date <= weekEnd).length;
    const weeklyFocusOpen = currentWeekFocusRefs.filter(ref => {
      if (ref.advisorId !== advisorId) {
        return false;
      }

      return openTasks.some(task => task.id === ref.taskId);
    }).length;
    const sessionStatus = selectAdvisorStatus(state, advisorId);
    const supportsQuickLog = selectSupportsQuickLog(advisorId);
    const needsSchedule =
      !advisorState.lastSessionDate || sessionStatus === 'overdue' || sessionStatus === 'due';
    const planningCandidates = ([
      {
        preset: 'needs_triage',
        count: highPriorityUnplanned > 0 || unplannedOpen >= 2 ? unplannedOpen : 0,
      },
      {
        preset: 'carry_over',
        count: staleTodayOpen,
      },
      {
        preset: 'overdue',
        count: overdueOpen,
      },
      {
        preset: 'weekly_focus',
        count: weeklyFocusOpen,
      },
    ] as const);
    const planningTarget = planningCandidates.find(candidate => candidate.count > 0) ?? null;
    const alternatePlanningShortcuts = planningCandidates
      .filter(
        candidate =>
          candidate.count > 0
          && candidate.preset !== planningTarget?.preset,
      )
      .map(candidate => {
        const copy = getAdvisorPlanningLaneCopy({
          preset: candidate.preset,
          highPriorityUnplanned,
          unplannedOpen,
          staleTodayOpen,
          overdueOpen,
          weeklyFocusOpen,
        });

        return {
          preset: candidate.preset,
          label: ADVISOR_PLANNING_PRESET_LABELS[candidate.preset],
          count: candidate.count,
          headline: copy.headline,
          reason: copy.reason,
        };
      });
    const needsPlan = planningTarget !== null;
    const needsQuickLog =
      supportsQuickLog
      && quickLogsThisWeek === 0
      && (openTasks.length > 0 || sessionsThisWeek > 0 || completedTasksThisWeek > 0);
    const primaryAction: AdvisorAttentionItem['primaryAction'] = needsSchedule
      ? 'schedule'
      : needsPlan
        ? 'plan'
        : needsQuickLog
          ? 'quick_log'
          : 'review';
    const status: AdvisorAttentionItem['status'] =
      primaryAction === 'review'
        ? 'steady'
        : needsSchedule || overdueOpen > 0 || highPriorityUnplanned > 0 || staleTodayOpen > 0
          ? 'urgent'
          : 'attention';

    let headline = 'Nothing urgent here';
    let reason = 'Sessions, quick logs, and queue pressure all look stable right now.';

    if (primaryAction === 'schedule') {
      if (!advisorState.lastSessionDate) {
        headline = 'No session captured yet';
        reason =
          openTasks.length > 0
            ? `${openTasks.length} open task${openTasks.length === 1 ? '' : 's'} are waiting for this domain to get real attention.`
            : 'Start the cadence here before this advisor turns into a placeholder.';
      } else if (sessionStatus === 'overdue') {
        headline = 'Session cadence slipped';
        reason =
          overdueOpen > 0
            ? `${overdueOpen} overdue task${overdueOpen === 1 ? '' : 's'} are still open on top of the missed cadence.`
            : `${daysBetween(advisorState.lastSessionDate, todayDate)} days have passed since the last session.`;
      } else {
        headline = 'Next session is due';
        reason =
          openTasks.length > 0
            ? `${openTasks.length} open task${openTasks.length === 1 ? '' : 's'} would benefit from a concrete session slot.`
            : 'Book the next touchpoint before this advisor goes quiet.';
      }
    } else if (primaryAction === 'plan' && planningTarget) {
      const copy = getAdvisorPlanningLaneCopy({
        preset: planningTarget.preset,
        highPriorityUnplanned,
        unplannedOpen,
        staleTodayOpen,
        overdueOpen,
        weeklyFocusOpen,
      });
      headline = copy.headline;
      reason = copy.reason;
    } else if (primaryAction === 'quick_log') {
      headline = lastQuickLogDate ? 'Quick pulse missing this week' : 'No quick log captured yet';
      reason =
        sessionsThisWeek + completedTasksThisWeek > 0
          ? 'You already moved this domain this week. Capture the signal while it is still fresh.'
          : 'A lightweight check-in keeps this domain visible without forcing a full session.';
    } else if (completedTasksThisWeek + sessionsThisWeek + quickLogsThisWeek > 0) {
      headline = 'Momentum is steady';
      reason = 'This advisor already has recent signal, so you can leave it alone unless priorities change.';
    }

    const attentionScore =
      (status === 'urgent' ? 100 : status === 'attention' ? 50 : 0)
      + (primaryAction === 'schedule' ? 20 : primaryAction === 'plan' ? 15 : primaryAction === 'quick_log' ? 10 : 0)
      + overdueOpen * 5
      + highPriorityUnplanned * 4
      + unplannedOpen * 2
      + (sessionStatus === 'overdue' ? 8 : sessionStatus === 'due' ? 4 : 0);

    return {
      attentionScore,
      item: {
        advisorId,
        advisorIcon: config.icon,
        advisorName: config.shortName,
        advisorColor: config.domainColor,
        status,
        primaryAction,
        planningPreset: planningTarget?.preset ?? null,
        planningLabel: planningTarget ? ADVISOR_PLANNING_PRESET_LABELS[planningTarget.preset] : null,
        planningCount: planningTarget?.count ?? 0,
        alternatePlanningShortcuts,
        headline,
        reason,
        lastSessionDate: advisorState.lastSessionDate,
        nextDueDate: advisorState.nextDueDate,
        lastQuickLogDate,
        openTasks: openTasks.length,
        plannedOpen,
        unplannedOpen,
        overdueOpen,
        highPriorityUnplanned,
        completedTasksThisWeek,
        sessionsThisWeek,
        quickLogsThisWeek,
      } satisfies AdvisorAttentionItem,
    };
  });

  const items = rankedItems
    .sort((a, b) => {
      if (a.attentionScore !== b.attentionScore) {
        return b.attentionScore - a.attentionScore;
      }

      return a.item.advisorName.localeCompare(b.item.advisorName);
    })
    .map(({ item }) => item);

  return {
    items,
    needsAttentionCount: items.filter(item => item.status !== 'steady').length,
    scheduleCount: items.filter(item => item.primaryAction === 'schedule').length,
    planCount: items.filter(item => item.primaryAction === 'plan').length,
    quickLogCount: items.filter(item => item.primaryAction === 'quick_log').length,
    quietCount: items.filter(item => item.status === 'steady').length,
  };
}

export function selectAdvisorStatus(
  state: AppState,
  advisorId: AdvisorId,
): 'due' | 'overdue' | 'upcoming' | 'completed' {
  const advisor = state.advisors[advisorId];
  const config = ADVISOR_CONFIGS[advisorId];

  if (!advisor.lastSessionDate) return 'due';

  const now = today();
  if (!advisor.nextDueDate) return 'due';

  const daysUntil = daysBetween(now, advisor.nextDueDate);

  if (daysUntil < -config.defaultCadence.windowDays) return 'overdue';
  if (daysUntil <= 0) return 'due';
  if (daysUntil <= 2) return 'upcoming';
  return 'completed';
}

export function selectQuickLogsSince(
  state: AppState,
  advisorId: AdvisorId,
  sinceDate: string | null,
): QuickLogEntry[] {
  return state.quickLogs.filter(
    log => log.advisorId === advisorId && (!sinceDate || log.date > sinceDate),
  );
}

export function selectLastQuickLogDate(
  state: AppState,
  advisorId: AdvisorId,
): string | null {
  const logs = state.quickLogs.filter(log => log.advisorId === advisorId);
  if (logs.length === 0) return null;
  return logs[logs.length - 1].date;
}

export function selectSupportsQuickLog(advisorId: AdvisorId): boolean {
  const config = ADVISOR_CONFIGS[advisorId];
  if (!config) return false;
  if (config.defaultCadence.quickLog === 'none') return false;
  return config.metricDefinitions.some(m => m.quickLoggable);
}
