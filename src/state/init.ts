import type { AdvisorId, AdvisorState } from '../types/advisor.js';
import type { AppState } from '../types/app-state.js';
import { ALL_ADVISOR_IDS, ADVISOR_CONFIGS } from '../advisors/registry.js';
import { today } from '../utils/date.js';
import { CURRENT_SCHEMA_VERSION } from '../constants/schema.js';
import {
  createDefaultDailyPlanningState,
  normalizeDailyPlanningState,
} from '../types/daily-planning.js';
import {
  createDefaultStrategicDashboardState,
  normalizeStrategicDashboardState,
} from '../types/strategic-dashboard.js';
import { createDefaultWeeklyFocusState } from '../types/weekly-focus.js';
import { createDefaultWeeklyReviewState, normalizeWeeklyReviewState } from '../types/weekly-review.js';

export interface AppPersistence {
  loadAdvisorState(id: AdvisorId): Promise<AdvisorState | null>;
  saveAdvisorState(id: AdvisorId, state: AdvisorState): Promise<void>;
  loadSharedMetrics(): Promise<AppState['sharedMetrics']>;
  saveSharedMetrics(metrics: AppState['sharedMetrics']): Promise<void>;
  loadQuickLogs(): Promise<AppState['quickLogs']>;
  saveQuickLogs(logs: AppState['quickLogs']): Promise<void>;
  loadTaskPlanning(): Promise<AppState['taskPlanning']>;
  saveTaskPlanning(taskPlanning: AppState['taskPlanning']): Promise<void>;
  loadDailyPlanning(): Promise<AppState['dailyPlanning']>;
  saveDailyPlanning(dailyPlanning: AppState['dailyPlanning']): Promise<void>;
  loadWeeklyFocus(): Promise<AppState['weeklyFocus']>;
  saveWeeklyFocus(weeklyFocus: AppState['weeklyFocus']): Promise<void>;
  loadWeeklyReview(): Promise<AppState['weeklyReview']>;
  saveWeeklyReview(weeklyReview: AppState['weeklyReview']): Promise<void>;
  loadStrategicDashboard(): Promise<AppState['strategicDashboard']>;
  saveStrategicDashboard(strategicDashboard: AppState['strategicDashboard']): Promise<void>;
}

export function createDefaultAdvisorState(advisorId: AdvisorId): AdvisorState {
  const config = ADVISOR_CONFIGS[advisorId];
  return {
    advisorId,
    activated: false,
    narrative: '',
    lastSessionDate: null,
    lastSessionSummary: null,
    tasks: config.initialActionItems.map(item => ({
      id: item.id,
      task: item.task,
      dueDate: item.dueDate ?? item.due ?? 'ongoing',
      priority: item.priority,
      status: item.status === 'closed' ? 'closed' : item.status,
      createdDate: item.createdDate,
      completedDate: item.completedDate,
      deferredReason: item.deferredReason,
      sourceSessionDate: item.sourceSessionDate,
    })),
    habits: [],
    metricsLatest: {},
    metricsHistory: [],
    sessions: [],
    streak: 0,
    nextDueDate: today(), // Due immediately on first setup
    contextForNextSession: null,
    cardPreview: null,
    checkInConfig: config.metricDefinitions.filter(metric => metric.quickLoggable),
  };
}

export function createDefaultAppState(): AppState {
  const advisors = {} as Record<AdvisorId, AdvisorState>;
  for (const id of ALL_ADVISOR_IDS) {
    advisors[id] = createDefaultAdvisorState(id);
  }

  return {
    advisors,
    sharedMetrics: {},
    quickLogs: [],
    taskPlanning: {},
    dailyPlanning: createDefaultDailyPlanningState(),
    weeklyFocus: createDefaultWeeklyFocusState(),
    weeklyReview: createDefaultWeeklyReviewState(),
    strategicDashboard: createDefaultStrategicDashboardState(),
    initialized: true,
    schemaVersion: CURRENT_SCHEMA_VERSION,
  };
}

export async function loadAppStateFromStorage(
  storage: AppPersistence,
): Promise<AppState> {
  const advisors = {} as Record<AdvisorId, AdvisorState>;

  const results = await Promise.all(
    ALL_ADVISOR_IDS.map(async id => {
      const saved = await storage.loadAdvisorState(id);
      return { id, state: saved };
    }),
  );

  for (const { id, state: saved } of results) {
    advisors[id] = saved ?? createDefaultAdvisorState(id);
  }

  const [
    sharedMetrics,
    quickLogs,
    taskPlanning,
    dailyPlanning,
    weeklyFocus,
    weeklyReview,
    strategicDashboard,
  ] = await Promise.all([
    storage.loadSharedMetrics(),
    storage.loadQuickLogs(),
    storage.loadTaskPlanning(),
    storage.loadDailyPlanning(),
    storage.loadWeeklyFocus(),
    storage.loadWeeklyReview(),
    storage.loadStrategicDashboard(),
  ]);

  return {
    advisors,
    sharedMetrics,
    quickLogs,
    taskPlanning,
    dailyPlanning: normalizeDailyPlanningState(dailyPlanning ?? createDefaultDailyPlanningState()),
    weeklyFocus: weeklyFocus ?? createDefaultWeeklyFocusState(),
    weeklyReview: normalizeWeeklyReviewState(weeklyReview ?? createDefaultWeeklyReviewState()),
    strategicDashboard: normalizeStrategicDashboardState(
      strategicDashboard ?? createDefaultStrategicDashboardState(),
    ),
    initialized: true,
    schemaVersion: CURRENT_SCHEMA_VERSION,
  };
}

export async function saveAppStateToStorage(
  storage: AppPersistence,
  state: AppState,
): Promise<void> {
  const saves = ALL_ADVISOR_IDS.map(id =>
    storage.saveAdvisorState(id, state.advisors[id]),
  );
  saves.push(storage.saveSharedMetrics(state.sharedMetrics));
  saves.push(storage.saveQuickLogs(state.quickLogs));
  saves.push(storage.saveTaskPlanning(state.taskPlanning));
  saves.push(storage.saveDailyPlanning(state.dailyPlanning));
  saves.push(storage.saveWeeklyFocus(state.weeklyFocus));
  saves.push(storage.saveWeeklyReview(state.weeklyReview));
  saves.push(storage.saveStrategicDashboard(state.strategicDashboard));

  await Promise.all(saves);
}
