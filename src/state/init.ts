import type { AdvisorId, AdvisorState } from '../types/advisor.js';
import type { AppState } from '../types/app-state.js';
import { ALL_ADVISOR_IDS, ADVISOR_CONFIGS } from '../advisors/registry.js';
import { today } from '../utils/date.js';
import { CURRENT_SCHEMA_VERSION } from '../constants/schema.js';

export interface AppPersistence {
  loadAdvisorState(id: AdvisorId): Promise<AdvisorState | null>;
  saveAdvisorState(id: AdvisorId, state: AdvisorState): Promise<void>;
  loadSharedMetrics(): Promise<AppState['sharedMetrics']>;
  saveSharedMetrics(metrics: AppState['sharedMetrics']): Promise<void>;
  loadQuickLogs(): Promise<AppState['quickLogs']>;
  saveQuickLogs(logs: AppState['quickLogs']): Promise<void>;
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

  const [sharedMetrics, quickLogs] = await Promise.all([
    storage.loadSharedMetrics(),
    storage.loadQuickLogs(),
  ]);

  return {
    advisors,
    sharedMetrics,
    quickLogs,
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

  await Promise.all(saves);
}
