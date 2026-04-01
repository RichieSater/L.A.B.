import type { AppState } from '../types/app-state';
import type { AdvisorId } from '../types/advisor';
import type { TaskItem } from '../types/action-item';
import type { AppAction } from './actions';
import type { SharedMetricsStore } from '../types/metrics';
import { getTaskPlanningKey } from '../types/task-planning';
import {
  getStrategicDashboardYear,
  normalizeStrategicDashboardState,
  type StrategicDashboardSectionKey,
  type StrategicDashboardState,
  type StrategicDashboardYear,
} from '../types/strategic-dashboard';
import {
  createDailyPlanningEntry,
  sortDailyPlanningEntries,
  type DailyPlanningEntry,
} from '../types/daily-planning';
import {
  MAX_WEEKLY_FOCUS_HISTORY_WEEKS,
  MAX_WEEKLY_FOCUS_ITEMS,
  type WeeklyFocusTaskRef,
} from '../types/weekly-focus';
import {
  createWeeklyReviewEntry,
  sortWeeklyReviewEntries,
  type WeeklyReviewEntry,
} from '../types/weekly-review';
import { applySessionImport, updateTaskStatus } from './advisors/advisor-reducer';
import { ADVISOR_CONFIGS } from '../advisors/registry';
import { createDefaultAdvisorState } from './init';
import { generateId } from '../utils/id';
import { today } from '../utils/date';

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

function clearTaskPlanningAssignment(
  taskPlanning: AppState['taskPlanning'],
  advisorId: AdvisorId,
  taskId: string,
): AppState['taskPlanning'] {
  const key = getTaskPlanningKey(advisorId, taskId);

  if (!taskPlanning[key]) {
    return taskPlanning;
  }

  const next = { ...taskPlanning };
  delete next[key];
  return next;
}

function pruneTaskPlanningForAdvisor(
  taskPlanning: AppState['taskPlanning'],
  advisorId: AdvisorId,
  tasks: TaskItem[],
): AppState['taskPlanning'] {
  const openTaskIds = new Set(
    tasks.filter(task => task.status === 'open').map(task => task.id),
  );
  const next = { ...taskPlanning };
  let changed = false;

  for (const key of Object.keys(next)) {
    const assignment = next[key];

    if (assignment?.advisorId !== advisorId) {
      continue;
    }

    if (!openTaskIds.has(assignment.taskId)) {
      delete next[key];
      changed = true;
    }
  }

  return changed ? next : taskPlanning;
}

function sortWeeklyFocusWeeks(weeks: AppState['weeklyFocus']['weeks']): AppState['weeklyFocus']['weeks'] {
  return [...weeks]
    .filter(week => week.items.length > 0)
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart))
    .slice(0, MAX_WEEKLY_FOCUS_HISTORY_WEEKS);
}

function upsertWeeklyFocusWeek(
  weeklyFocus: AppState['weeklyFocus'],
  weekStart: string,
  updateItems: (items: WeeklyFocusTaskRef[]) => WeeklyFocusTaskRef[],
): AppState['weeklyFocus'] {
  const existingWeek = weeklyFocus.weeks.find(week => week.weekStart === weekStart);
  const nextItems = updateItems(existingWeek?.items ?? []);
  const nextWeeks = weeklyFocus.weeks.filter(week => week.weekStart !== weekStart);

  if (nextItems.length > 0) {
    nextWeeks.push({
      weekStart,
      items: nextItems,
    });
  }

  return {
    weeks: sortWeeklyFocusWeeks(nextWeeks),
  };
}

function pruneWeeklyFocusForAdvisor(
  weeklyFocus: AppState['weeklyFocus'],
  advisorId: AdvisorId,
  tasks: TaskItem[],
): AppState['weeklyFocus'] {
  const taskIds = new Set(tasks.map(task => task.id));
  let changed = false;
  const nextWeeks = weeklyFocus.weeks
    .map(week => {
      const nextItems = week.items.filter(item => {
        if (item.advisorId !== advisorId) {
          return true;
        }

        const keep = taskIds.has(item.taskId);
        if (!keep) {
          changed = true;
        }

        return keep;
      });

      if (nextItems.length !== week.items.length) {
        changed = true;
      }

      return {
        ...week,
        items: nextItems,
      };
    })
    .filter(week => week.items.length > 0);

  return changed
    ? {
        weeks: sortWeeklyFocusWeeks(nextWeeks),
      }
    : weeklyFocus;
}

function upsertWeeklyReviewEntry(
  weeklyReview: AppState['weeklyReview'],
  weekStart: string,
  updateEntry: (entry: WeeklyReviewEntry) => WeeklyReviewEntry,
): AppState['weeklyReview'] {
  const existingEntry =
    weeklyReview.entries.find(entry => entry.weekStart === weekStart) ?? createWeeklyReviewEntry(weekStart);
  const nextEntry = updateEntry(existingEntry);
  const nextEntries = weeklyReview.entries.filter(entry => entry.weekStart !== weekStart);
  nextEntries.push(nextEntry);

  return {
    entries: sortWeeklyReviewEntries(nextEntries),
  };
}

function upsertDailyPlanningEntry(
  dailyPlanning: AppState['dailyPlanning'],
  date: string,
  updateEntry: (entry: DailyPlanningEntry) => DailyPlanningEntry,
): AppState['dailyPlanning'] {
  const existingEntry =
    dailyPlanning.entries.find(entry => entry.date === date) ?? createDailyPlanningEntry(date);
  const nextEntry = updateEntry(existingEntry);
  const nextEntries = dailyPlanning.entries.filter(entry => entry.date !== date);
  nextEntries.push(nextEntry);

  return {
    entries: sortDailyPlanningEntries(nextEntries),
  };
}

function sortStrategicYears(years: StrategicDashboardYear[]): StrategicDashboardYear[] {
  return [...years].sort((a, b) => b.year - a.year);
}

function upsertStrategicYear(
  strategicDashboard: StrategicDashboardState,
  year: number,
  updateYear: (entry: StrategicDashboardYear) => StrategicDashboardYear,
): StrategicDashboardState {
  const existingYear = getStrategicDashboardYear(strategicDashboard, year);
  const nextYear = updateYear(existingYear);
  const nextYears = strategicDashboard.years.filter(entry => entry.year !== year);
  nextYears.push(nextYear);

  return {
    ...strategicDashboard,
    years: sortStrategicYears(nextYears),
  };
}

function updateStrategicGoal(
  strategicDashboard: StrategicDashboardState,
  year: number,
  sectionKey: StrategicDashboardSectionKey,
  index: number,
  updateGoal: (goal: StrategicDashboardYear['sections'][StrategicDashboardSectionKey]['goals'][number]) => StrategicDashboardYear['sections'][StrategicDashboardSectionKey]['goals'][number],
): StrategicDashboardState {
  return upsertStrategicYear(strategicDashboard, year, entry => {
    const section = entry.sections[sectionKey];
    const goal = section.goals[index];

    if (!goal) {
      return entry;
    }

    const nextGoals = section.goals.map((item, goalIndex) =>
      goalIndex === index ? updateGoal(item) : item,
    );

    return {
      ...entry,
      sections: {
        ...entry.sections,
        [sectionKey]: {
          ...section,
          goals: nextGoals,
        },
      },
    };
  });
}

function updateStrategicWins(
  strategicDashboard: StrategicDashboardState,
  year: number,
  field: 'currentWins' | 'previousWins',
  index: number,
  value: string,
): StrategicDashboardState {
  return upsertStrategicYear(strategicDashboard, year, entry => {
    const nextValues = [...entry[field]];
    if (index < 0 || index >= nextValues.length) {
      return entry;
    }

    nextValues[index] = value;
    return {
      ...entry,
      [field]: nextValues,
    };
  });
}

function addWeeklyFocusItem(
  weeklyFocus: AppState['weeklyFocus'],
  weekStart: string,
  advisorId: AdvisorId,
  taskId: string,
): AppState['weeklyFocus'] {
  return upsertWeeklyFocusWeek(weeklyFocus, weekStart, items => {
    if (items.some(item => item.advisorId === advisorId && item.taskId === taskId)) {
      return items;
    }

    if (items.length >= MAX_WEEKLY_FOCUS_ITEMS) {
      return items;
    }

    return [
      ...items,
      {
        advisorId,
        taskId,
        addedAt: new Date().toISOString(),
        carriedForwardFromWeekStart: null,
      },
    ];
  });
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'INITIALIZE':
      return {
        ...action.payload,
        strategicDashboard: normalizeStrategicDashboardState(action.payload.strategicDashboard),
      };

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
        taskPlanning: pruneTaskPlanningForAdvisor(
          state.taskPlanning,
          advisorId,
          newAdvisorState.tasks,
        ),
        weeklyFocus: pruneWeeklyFocusForAdvisor(
          state.weeklyFocus,
          advisorId,
          newAdvisorState.tasks,
        ),
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
        taskPlanning:
          status === 'open'
            ? state.taskPlanning
            : clearTaskPlanningAssignment(state.taskPlanning, advisorId, taskId),
      };
    }

    case 'SET_TASK_PLAN_BUCKET': {
      const { advisorId, taskId, bucket } = action.payload;
      const key = getTaskPlanningKey(advisorId, taskId);

      return {
        ...state,
        taskPlanning: {
          ...state.taskPlanning,
          [key]: {
            advisorId,
            taskId,
            bucket,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    }

    case 'CLEAR_TASK_PLAN_BUCKET': {
      const { advisorId, taskId } = action.payload;
      return {
        ...state,
        taskPlanning: clearTaskPlanningAssignment(state.taskPlanning, advisorId, taskId),
      };
    }

    case 'SET_DAILY_PLANNING_FIELD': {
      const { date, field, value } = action.payload;

      return {
        ...state,
        dailyPlanning: upsertDailyPlanningEntry(state.dailyPlanning, date, entry => ({
          ...entry,
          [field]: value,
        })),
      };
    }

    case 'COMPLETE_DAILY_PLAN':
      return {
        ...state,
        dailyPlanning: upsertDailyPlanningEntry(state.dailyPlanning, action.payload.date, entry => ({
          ...entry,
          completedAt: new Date().toISOString(),
        })),
      };

    case 'ADD_WEEKLY_FOCUS_TASK': {
      const { advisorId, taskId, weekStart, carriedForwardFromWeekStart = null } = action.payload;

      return {
        ...state,
        weeklyFocus: upsertWeeklyFocusWeek(state.weeklyFocus, weekStart, items => {
          if (items.some(item => item.advisorId === advisorId && item.taskId === taskId)) {
            return items;
          }

          if (items.length >= MAX_WEEKLY_FOCUS_ITEMS) {
            return items;
          }

          return [
            ...items,
            {
              advisorId,
              taskId,
              addedAt: new Date().toISOString(),
              carriedForwardFromWeekStart,
            },
          ];
        }),
      };
    }

    case 'REMOVE_WEEKLY_FOCUS_TASK': {
      const { advisorId, taskId, weekStart } = action.payload;

      return {
        ...state,
        weeklyFocus: upsertWeeklyFocusWeek(state.weeklyFocus, weekStart, items =>
          items.filter(item => !(item.advisorId === advisorId && item.taskId === taskId)),
        ),
      };
    }

    case 'SET_WEEKLY_REVIEW_FIELD': {
      const { weekStart, field, value } = action.payload;

      return {
        ...state,
        weeklyReview: upsertWeeklyReviewEntry(state.weeklyReview, weekStart, entry => ({
          ...entry,
          [field]: value,
        })),
      };
    }

    case 'COMPLETE_WEEKLY_REVIEW':
      return {
        ...state,
        weeklyReview: upsertWeeklyReviewEntry(
          state.weeklyReview,
          action.payload.weekStart,
          entry => ({
            ...entry,
            completedAt: new Date().toISOString(),
          }),
        ),
      };

    case 'SET_STRATEGIC_GOAL_SLOT': {
      const { year, sectionKey, index, text } = action.payload;

      return {
        ...state,
        strategicDashboard: updateStrategicGoal(
          state.strategicDashboard,
          year,
          sectionKey,
          index,
          goal => ({
            ...goal,
            text,
          }),
        ),
      };
    }

    case 'TOGGLE_STRATEGIC_GOAL_COMPLETED': {
      const { year, sectionKey, index } = action.payload;

      return {
        ...state,
        strategicDashboard: updateStrategicGoal(
          state.strategicDashboard,
          year,
          sectionKey,
          index,
          goal => ({
            ...goal,
            completed: !goal.completed,
          }),
        ),
      };
    }

    case 'SET_STRATEGIC_WIN': {
      const { year, field, index, value } = action.payload;

      return {
        ...state,
        strategicDashboard: updateStrategicWins(
          state.strategicDashboard,
          year,
          field,
          index,
          value,
        ),
      };
    }

    case 'PROMOTE_STRATEGIC_GOAL_TO_TASK': {
      const {
        year,
        sectionKey,
        index,
        advisorId,
        bucket,
        addToWeeklyFocusWeekStart = null,
      } = action.payload;
      const currentAdvisorState = state.advisors[advisorId];
      if (!currentAdvisorState) return state;

      const strategicYear = getStrategicDashboardYear(state.strategicDashboard, year);
      const goal = strategicYear.sections[sectionKey].goals[index];
      const nextText = goal?.text.trim() ?? '';
      if (!nextText) {
        return state;
      }

      const linkedTaskId = goal.linkedTask?.advisorId === advisorId ? goal.linkedTask.taskId : null;
      const existingOpenTask = linkedTaskId
        ? currentAdvisorState.tasks.find(task => task.id === linkedTaskId && task.status === 'open') ?? null
        : null;
      const taskId = existingOpenTask?.id ?? generateId(advisorId.slice(0, 3).toUpperCase());

      const nextTasks = existingOpenTask
        ? currentAdvisorState.tasks.map(task =>
            task.id === existingOpenTask.id
              ? {
                  ...task,
                  task: nextText,
                }
              : task,
          )
        : [
            ...currentAdvisorState.tasks,
            {
              id: taskId,
              task: nextText,
              dueDate: 'ongoing',
              due: 'ongoing',
              priority: bucket === 'later' ? 'medium' : 'high',
              status: 'open',
              createdDate: today(),
            },
          ];

      const nextTaskPlanning = {
        ...state.taskPlanning,
        [getTaskPlanningKey(advisorId, taskId)]: {
          advisorId,
          taskId,
          bucket,
          updatedAt: new Date().toISOString(),
        },
      };

      return {
        ...state,
        advisors: {
          ...state.advisors,
          [advisorId]: {
            ...currentAdvisorState,
            tasks: nextTasks,
          },
        },
        taskPlanning: nextTaskPlanning,
        weeklyFocus: addToWeeklyFocusWeekStart
          ? addWeeklyFocusItem(state.weeklyFocus, addToWeeklyFocusWeekStart, advisorId, taskId)
          : state.weeklyFocus,
        strategicDashboard: updateStrategicGoal(
          state.strategicDashboard,
          year,
          sectionKey,
          index,
          item => ({
            ...item,
            linkedTask: {
              advisorId,
              taskId,
            },
          }),
        ),
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
        taskPlanning: pruneTaskPlanningForAdvisor(state.taskPlanning, advisorId, []),
        weeklyFocus: pruneWeeklyFocusForAdvisor(state.weeklyFocus, advisorId, []),
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
