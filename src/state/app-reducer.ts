import type { AppState } from '../types/app-state';
import type { AdvisorId } from '../types/advisor';
import type { AppAction } from './actions';
import type { SharedMetricsStore } from '../types/metrics';
import { applySessionImport, updateTaskStatus } from './advisors/advisor-reducer';
import { ADVISOR_CONFIGS } from '../advisors/registry';
import { createDefaultAdvisorState } from './init';

function extractSharedMetrics(
  advisorId: AdvisorId,
  metrics: Record<string, number | string>,
  mood: string,
  date: string,
): Partial<SharedMetricsStore> {
  const config = ADVISOR_CONFIGS[advisorId];
  if (!config) return {};

  const updates: Partial<SharedMetricsStore> = {};

  // Extract metrics this advisor produces
  for (const metricId of config.producesMetrics) {
    if (metrics[metricId] !== undefined) {
      updates[metricId] = {
        value: metrics[metricId],
        date,
        source: advisorId,
      };
    }
  }

  // Mood is shared from all sessions
  if (mood) {
    updates['mood'] = {
      value: mood,
      date,
      source: 'session',
    };
  }

  return updates;
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'INITIALIZE':
      return action.payload;

    case 'IMPORT_SESSION': {
      const { advisorId, normalizedImport } = action.payload;
      const currentAdvisorState = state.advisors[advisorId];
      if (!currentAdvisorState) return state;

      const newAdvisorState = applySessionImport(currentAdvisorState, normalizedImport);

      // Extract shared metrics
      const sharedUpdates = extractSharedMetrics(
        advisorId,
        normalizedImport.sessionImport.metrics,
        normalizedImport.sessionImport.mood,
        normalizedImport.sessionImport.date,
      );

      return {
        ...state,
        advisors: {
          ...state.advisors,
          [advisorId]: newAdvisorState,
        },
        sharedMetrics: {
          ...state.sharedMetrics,
          ...(sharedUpdates as SharedMetricsStore),
        },
      };
    }

    case 'UPDATE_TASK': {
      const { advisorId, taskId, status } = action.payload;
      const currentAdvisorState = state.advisors[advisorId];
      if (!currentAdvisorState) return state;

      return {
        ...state,
        advisors: {
          ...state.advisors,
          [advisorId]: updateTaskStatus(currentAdvisorState, taskId, status),
        },
      };
    }

    case 'UPDATE_SHARED_METRICS':
      return {
        ...state,
        sharedMetrics: {
          ...state.sharedMetrics,
          ...(action.payload as SharedMetricsStore),
        },
      };

    case 'UPDATE_ADVISOR_NARRATIVE': {
      const { advisorId, narrative } = action.payload;
      const currentAdvisorState = state.advisors[advisorId];
      if (!currentAdvisorState) return state;

      return {
        ...state,
        advisors: {
          ...state.advisors,
          [advisorId]: { ...currentAdvisorState, narrative },
        },
      };
    }

    case 'RESET_ADVISOR': {
      const { advisorId } = action.payload;
      return {
        ...state,
        advisors: {
          ...state.advisors,
          [advisorId]: createDefaultAdvisorState(advisorId),
        },
      };
    }

    case 'ADD_QUICK_LOG': {
      const entry = action.payload;
      const config = ADVISOR_CONFIGS[entry.advisorId];

      // Update shared metrics for any produced metrics in this log
      const sharedUpdates: Partial<SharedMetricsStore> = {};
      if (config) {
        for (const metricId of config.producesMetrics) {
          if (entry.logs[metricId] !== undefined) {
            sharedUpdates[metricId] = {
              value: entry.logs[metricId],
              date: entry.date,
              source: entry.advisorId,
            };
          }
        }
      }

      // Update advisor's metricsLatest with logged values
      const logAdvisorId = entry.advisorId;
      const currentAdvisorState = state.advisors[logAdvisorId];

      return {
        ...state,
        quickLogs: [...state.quickLogs, entry],
        sharedMetrics: {
          ...state.sharedMetrics,
          ...(sharedUpdates as SharedMetricsStore),
        },
        advisors: currentAdvisorState ? {
          ...state.advisors,
          [logAdvisorId]: {
            ...currentAdvisorState,
            metricsLatest: {
              ...currentAdvisorState.metricsLatest,
              ...entry.logs,
            },
          },
        } : state.advisors,
      };
    }

    case 'TOGGLE_ADVISOR_ACTIVATION': {
      const { advisorId } = action.payload;
      const currentAdvisorState = state.advisors[advisorId];
      if (!currentAdvisorState) return state;

      return {
        ...state,
        advisors: {
          ...state.advisors,
          [advisorId]: {
            ...currentAdvisorState,
            activated: !currentAdvisorState.activated,
          },
        },
      };
    }

    default:
      return state;
  }
}
