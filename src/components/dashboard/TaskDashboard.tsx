import { useState } from 'react';
import { useAuth } from '../../auth/auth-context';
import type { AdvisorId } from '../../types/advisor';
import type {
  TaskDashboardAttentionContext,
  TaskDashboardNavigationRequest,
  TaskListPreset,
} from '../../types/dashboard-navigation';
import { useAppState } from '../../state/app-context';
import { ScheduleModal } from '../scheduling/ScheduleModal';
import { QuickLogModal } from '../quick-log/QuickLogModal';
import type { TaskPlanningBucket } from '../../types/task-planning';
import {
  selectAdvisorAttentionSummary,
  selectRecentActivitySummary,
  selectAllHabits,
  selectAllTaskItems,
  selectDailyPlanningSummary,
  type RecentActivityWindow,
  selectWeeklyFocusSummary,
  selectTaskPlanningSummary,
  selectWeeklyReviewSummary,
  type EnrichedTaskItem,
} from '../../state/selectors';
import { ACTIVE_ADVISOR_IDS, ADVISOR_CONFIGS } from '../../advisors/registry';
import { today } from '../../utils/date';
import { TaskPlanningBoard } from './TaskPlanningBoard';
import { TaskRow } from './TaskRow';
import { DailyPlanningCard } from './DailyPlanningCard';
import { RecentActivityTimeline } from './RecentActivityTimeline';
import { WeeklyFocusCard } from './WeeklyFocusCard';
import { WeeklyReviewCard } from './WeeklyReviewCard';

type StatusFilter = 'open' | 'completed' | 'all';
type PriorityFilter = 'all' | 'high' | 'medium' | 'low';
type PlanningFilter = 'all' | 'planned' | 'unplanned';
type TaskListPresetMeta = {
  key: TaskListPreset;
  label: string;
  count: number;
};

interface TaskDashboardProps {
  navigationRequest?: TaskDashboardNavigationRequest | null;
}

export function TaskDashboard({ navigationRequest = null }: TaskDashboardProps) {
  const initialTaskListPreset = navigationRequest?.taskListPreset ?? 'all_open';
  const initialAdvisorFilter = navigationRequest?.advisorId ?? 'all';
  const attentionContext = navigationRequest?.attentionContext ?? null;
  const initialPlanningFilter: PlanningFilter =
    initialTaskListPreset === 'needs_triage'
      ? 'unplanned'
      : initialTaskListPreset === 'carry_over'
        ? 'planned'
        : 'all';
  const { profile } = useAuth();
  const { state, dispatch } = useAppState();
  const allItems = selectAllTaskItems(state);
  const habits = selectAllHabits(state);
  const planning = selectTaskPlanningSummary(state);
  const daily = selectDailyPlanningSummary(state);
  const focus = selectWeeklyFocusSummary(state);
  const review = selectWeeklyReviewSummary(state);
  const focusKeys = new Set(focus.items.map(item => `${item.advisorId}:${item.id}`));

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open');
  const [advisorFilter, setAdvisorFilter] = useState<AdvisorId | 'all'>(initialAdvisorFilter);
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [planningFilter, setPlanningFilter] = useState<PlanningFilter>(initialPlanningFilter);
  const [taskListPreset, setTaskListPreset] = useState<TaskListPreset>(initialTaskListPreset);
  const [activityWindow, setActivityWindow] = useState<RecentActivityWindow>('last_7_days');
  const [scheduleItem, setScheduleItem] = useState<EnrichedTaskItem | null>(null);
  const [scheduleAdvisorId, setScheduleAdvisorId] = useState<AdvisorId | null>(null);
  const [quickLogAdvisorId, setQuickLogAdvisorId] = useState<AdvisorId | null>(null);
  const schedulingEnabled = profile?.schedulingEnabled ?? false;
  const attention = selectAdvisorAttentionSummary(state);
  const recentActivity = selectRecentActivitySummary(state, activityWindow);
  const now = today();
  const staleTodayKeys = new Set(review.staleToday.map(item => `${item.advisorId}:${item.id}`));
  const scopedItems = advisorFilter === 'all'
    ? allItems
    : allItems.filter(item => item.advisorId === advisorFilter);
  const scopedUnplannedCount = planning.unplanned.filter(item => (
    advisorFilter === 'all' || item.advisorId === advisorFilter
  )).length;
  const scopedCarryOverCount = review.staleToday.filter(item => (
    advisorFilter === 'all' || item.advisorId === advisorFilter
  )).length;
  const scopedWeeklyFocusOpenCount = focus.items.filter(item => (
    item.status === 'open' && (advisorFilter === 'all' || item.advisorId === advisorFilter)
  )).length;

  const filtered = allItems.filter(item => {
    if (statusFilter === 'open' && item.status !== 'open') return false;
    if (statusFilter === 'completed' && item.status !== 'completed') return false;
    if (advisorFilter !== 'all' && item.advisorId !== advisorFilter) return false;
    if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;
    if (planningFilter === 'planned' && !item.planningBucket) return false;
    if (planningFilter === 'unplanned' && !!item.planningBucket) return false;
    if (taskListPreset === 'carry_over' && !staleTodayKeys.has(`${item.advisorId}:${item.id}`)) return false;
    if (taskListPreset === 'overdue' && (item.status !== 'open' || item.dueDate === 'ongoing' || item.dueDate >= now)) return false;
    if (taskListPreset === 'weekly_focus' && (item.status !== 'open' || !focusKeys.has(`${item.advisorId}:${item.id}`))) return false;
    return true;
  });

  const overdueCount = allItems.filter(
    i => i.status === 'open' && i.dueDate !== 'ongoing' && i.dueDate < now,
  ).length;
  const openCount = allItems.filter(i => i.status === 'open').length;
  const plannedCount = planning.totalPlanned;
  const focusCount = focus.items.length;
  const scopedOpenCount = scopedItems.filter(item => item.status === 'open').length;
  const scopedOverdueCount = scopedItems.filter(
    item => item.status === 'open' && item.dueDate !== 'ongoing' && item.dueDate < now,
  ).length;
  const taskListPresets: TaskListPresetMeta[] = [
    {
      key: 'all_open',
      label: 'All Open',
      count: scopedOpenCount,
    },
    {
      key: 'needs_triage',
      label: 'Needs Triage',
      count: scopedUnplannedCount,
    },
    {
      key: 'carry_over',
      label: 'Carry Over',
      count: scopedCarryOverCount,
    },
    {
      key: 'overdue',
      label: 'Overdue',
      count: scopedOverdueCount,
    },
    {
      key: 'weekly_focus',
      label: 'Weekly Focus',
      count: scopedWeeklyFocusOpenCount,
    },
  ];

  const selectedPresetDescription = getTaskListPresetDescription(taskListPreset, advisorFilter);
  const recommendedPreset = getRecommendedTaskListPreset(taskListPresets);
  const recommendedPresetReason = recommendedPreset
    ? getRecommendedPresetReason(recommendedPreset.key)
    : null;
  const showAttentionHandoff = shouldShowAttentionHandoff({
    attentionContext,
    initialAdvisorFilter,
    advisorFilter,
  });
  const scopedAdvisorAttentionItem = advisorFilter === 'all'
    ? null
    : attention.items.find(item => item.advisorId === advisorFilter) ?? null;
  const handoffAlternativePresets = showAttentionHandoff
    ? taskListPresets.filter(preset => preset.count > 0 && preset.key !== taskListPreset)
    : [];
  const scopedAdvisorActionLabel = getScopedAdvisorActionLabel({
    item: scopedAdvisorAttentionItem,
    taskListPreset,
    schedulingEnabled,
  });
  const showScopedAdvisorContext = advisorFilter !== 'all'
    && scopedAdvisorAttentionItem !== null
    && scopedAdvisorAttentionItem.status !== 'steady'
    && !showAttentionHandoff
    && scopedAdvisorActionLabel !== null;

  const applyTaskListPreset = (
    preset: TaskListPreset,
    advisorScope: AdvisorId | 'all' = advisorFilter,
  ) => {
    setTaskListPreset(preset);
    setStatusFilter('open');
    setAdvisorFilter(advisorScope);
    setPriorityFilter('all');
    setPlanningFilter(preset === 'needs_triage' ? 'unplanned' : preset === 'carry_over' ? 'planned' : 'all');
  };

  const clearTaskListPreset = () => {
    setTaskListPreset('all_open');
  };

  const expandTaskListScope = () => {
    setAdvisorFilter('all');
  };

  const handleScopedAdvisorAction = () => {
    if (!scopedAdvisorAttentionItem) {
      return;
    }

    if (scopedAdvisorAttentionItem.primaryAction === 'schedule') {
      if (!schedulingEnabled) {
        return;
      }

      setScheduleAdvisorId(scopedAdvisorAttentionItem.advisorId);
      return;
    }

    if (scopedAdvisorAttentionItem.primaryAction === 'quick_log') {
      setQuickLogAdvisorId(scopedAdvisorAttentionItem.advisorId);
      return;
    }

    if (scopedAdvisorAttentionItem.primaryAction === 'plan' && scopedAdvisorAttentionItem.planningPreset) {
      applyTaskListPreset(scopedAdvisorAttentionItem.planningPreset, scopedAdvisorAttentionItem.advisorId);
    }
  };

  const handleToggle = (advisorId: string, taskId: string) => {
    const item = allItems.find(i => i.id === taskId && i.advisorId === advisorId);
    if (!item) return;
    dispatch({
      type: 'UPDATE_TASK',
      payload: {
        advisorId: advisorId as AdvisorId,
        taskId,
        status: item.status === 'completed' ? 'open' : 'completed',
      },
    });
  };

  const handleSetPlanBucket = (advisorId: string, taskId: string, bucket: TaskPlanningBucket) => {
    dispatch({
      type: 'SET_TASK_PLAN_BUCKET',
      payload: {
        advisorId: advisorId as AdvisorId,
        taskId,
        bucket,
      },
    });
  };

  const handleClearPlanBucket = (advisorId: string, taskId: string) => {
    dispatch({
      type: 'CLEAR_TASK_PLAN_BUCKET',
      payload: {
        advisorId: advisorId as AdvisorId,
        taskId,
      },
    });
  };

  const handleCompleteWeeklyReview = (weekStart: string) => {
    dispatch({
      type: 'COMPLETE_WEEKLY_REVIEW',
      payload: {
        weekStart,
      },
    });
  };

  const handleCompleteDailyPlan = (date: string) => {
    dispatch({
      type: 'COMPLETE_DAILY_PLAN',
      payload: {
        date,
      },
    });
  };

  const handleSetDailyPlanningField = (
    date: string,
    field: 'headline' | 'guardrail',
    value: string,
  ) => {
    dispatch({
      type: 'SET_DAILY_PLANNING_FIELD',
      payload: {
        date,
        field,
        value,
      },
    });
  };

  const handleSetWeeklyReviewField = (
    weekStart: string,
    field: 'biggestWin' | 'biggestLesson' | 'nextWeekNote',
    value: string,
  ) => {
    dispatch({
      type: 'SET_WEEKLY_REVIEW_FIELD',
      payload: {
        weekStart,
        field,
        value,
      },
    });
  };

  const handleAddWeeklyFocusTask = (
    advisorId: string,
    taskId: string,
    carriedForwardFromWeekStart?: string | null,
  ) => {
    dispatch({
      type: 'ADD_WEEKLY_FOCUS_TASK',
      payload: {
        advisorId: advisorId as AdvisorId,
        taskId,
        weekStart: focus.weekStart,
        carriedForwardFromWeekStart: carriedForwardFromWeekStart ?? null,
      },
    });
  };

  const handleRemoveWeeklyFocusTask = (advisorId: string, taskId: string) => {
    dispatch({
      type: 'REMOVE_WEEKLY_FOCUS_TASK',
      payload: {
        advisorId: advisorId as AdvisorId,
        taskId,
        weekStart: focus.weekStart,
      },
    });
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      {/* Summary */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <span className="text-gray-400">{openCount} open</span>
        <span className="text-gray-500">{focusCount} in focus</span>
        <span className="text-gray-500">{plannedCount} planned</span>
        <span className="text-gray-500">{planning.unplanned.length} unplanned</span>
        <span className="text-gray-500">{habits.filter(h => h.status === 'active').length} habits</span>
        {overdueCount > 0 && (
          <span className="text-red-400">{overdueCount} overdue</span>
        )}
      </div>

      {habits.length > 0 && (
        <div className="mb-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Active Habits</h3>
          <div className="grid gap-2 md:grid-cols-2">
            {habits.filter(habit => habit.status === 'active').map(habit => (
              <div key={habit.id} className="rounded-lg bg-gray-800/40 border border-gray-800 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-200">{habit.name}</p>
                    <p className="text-xs text-gray-500">
                      {habit.cadence} target {habit.targetCount}{habit.unit ? ` ${habit.unit}` : ''}
                    </p>
                  </div>
                  <span className="text-xs" style={{ color: habit.advisorColor }}>
                    {habit.advisorIcon} {habit.advisorName}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <DailyPlanningCard
        summary={daily}
        focusTaskKeys={focusKeys}
        onCompleteDailyPlan={handleCompleteDailyPlan}
        onSetDailyPlanningField={handleSetDailyPlanningField}
        onSetPlanBucket={handleSetPlanBucket}
        onClearPlanBucket={handleClearPlanBucket}
        onScheduleTask={setScheduleItem}
        schedulingEnabled={schedulingEnabled}
      />

      <WeeklyReviewCard
        summary={review}
        onCompleteReview={handleCompleteWeeklyReview}
        onSetReviewField={handleSetWeeklyReviewField}
        onAddFocusTask={handleAddWeeklyFocusTask}
        onRemoveFocusTask={handleRemoveWeeklyFocusTask}
        focusTaskKeys={focusKeys}
        onSetPlanBucket={handleSetPlanBucket}
        onClearPlanBucket={handleClearPlanBucket}
        onScheduleTask={setScheduleItem}
        schedulingEnabled={schedulingEnabled}
      />

      <RecentActivityTimeline
        summary={recentActivity}
        selectedWindow={activityWindow}
        onSelectWindow={setActivityWindow}
      />

      <WeeklyFocusCard
        summary={focus}
        onAddFocusTask={handleAddWeeklyFocusTask}
        onRemoveFocusTask={handleRemoveWeeklyFocusTask}
        onSetPlanBucket={handleSetPlanBucket}
        onScheduleTask={setScheduleItem}
        schedulingEnabled={schedulingEnabled}
      />

      <TaskPlanningBoard
        lanes={planning.lanes}
        unplanned={planning.unplanned}
        focusTaskKeys={focusKeys}
        onAddFocusTask={handleAddWeeklyFocusTask}
        onRemoveFocusTask={handleRemoveWeeklyFocusTask}
        onSetPlanBucket={handleSetPlanBucket}
        onClearPlanBucket={handleClearPlanBucket}
        onScheduleTask={setScheduleItem}
        schedulingEnabled={schedulingEnabled}
      />

      <section aria-label="Task list" className="mt-6">
        {showAttentionHandoff && attentionContext && (
          <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">Attention Radar Handoff</p>
                <h3 className="mt-1 text-sm font-semibold text-gray-100">
                  {attentionContext.advisorName}: {attentionContext.headline}
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-300">
                  {attentionContext.reason}
                </p>
                <p className="mt-2 text-xs text-amber-100/80">
                  {formatAttentionPlanningCount(attentionContext)}
                </p>
                {handoffAlternativePresets.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-100/70">
                      Other scoped lanes
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {handoffAlternativePresets.map(preset => (
                        <button
                          key={`handoff:${preset.key}`}
                          type="button"
                          aria-label={`Open ${preset.label} lane`}
                          onClick={() => applyTaskListPreset(preset.key)}
                          className="rounded-lg border border-amber-300/20 bg-gray-950/60 px-3 py-2 text-sm text-amber-100 transition-colors hover:border-amber-200/40 hover:text-white"
                        >
                          {preset.label} ({preset.count})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {scopedAdvisorActionLabel && (
                  <button
                    type="button"
                    onClick={handleScopedAdvisorAction}
                    className="rounded-lg border border-amber-300/30 bg-gray-950/60 px-3 py-2 text-sm font-medium text-amber-100 transition-colors hover:border-amber-200/50 hover:text-white"
                  >
                    {scopedAdvisorActionLabel}
                  </button>
                )}
                <button
                  type="button"
                  onClick={expandTaskListScope}
                  className="rounded-lg border border-amber-300/30 bg-gray-950/60 px-3 py-2 text-sm font-medium text-amber-100 transition-colors hover:border-amber-200/50 hover:text-white"
                >
                  Expand to all advisors
                </button>
              </div>
            </div>
          </div>
        )}

        {showScopedAdvisorContext && scopedAdvisorAttentionItem && (
          <div className="mb-4 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">Advisor Context</p>
                <h3 className="mt-1 text-sm font-semibold text-gray-100">
                  {scopedAdvisorAttentionItem.advisorName}: {scopedAdvisorAttentionItem.headline}
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-300">
                  {scopedAdvisorAttentionItem.reason}
                </p>
                <p className="mt-2 text-xs text-blue-100/80">
                  {formatScopedAdvisorStatusLine(scopedAdvisorAttentionItem)}
                </p>
              </div>
              {scopedAdvisorActionLabel && (
                <button
                  type="button"
                  onClick={handleScopedAdvisorAction}
                  className="rounded-lg border border-blue-300/30 bg-gray-950/60 px-3 py-2 text-sm font-medium text-blue-100 transition-colors hover:border-blue-200/50 hover:text-white"
                >
                  {scopedAdvisorActionLabel}
                </button>
              )}
            </div>
          </div>
        )}

        {recommendedPreset && recommendedPresetReason && (
          <div className="mb-4 rounded-xl border border-sky-500/20 bg-sky-500/10 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">Recommended Next Move</p>
                <h3 className="mt-1 text-sm font-semibold text-gray-100">
                  {recommendedPreset.label} deserves the next sweep
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-300">
                  {recommendedPresetReason}
                </p>
              </div>
              <button
                type="button"
                onClick={() => applyTaskListPreset(recommendedPreset.key)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  taskListPreset === recommendedPreset.key
                    ? 'border-sky-300/40 bg-sky-200/15 text-sky-100'
                    : 'border-sky-300/30 bg-gray-950/60 text-sky-200 hover:border-sky-200/50 hover:text-sky-100'
                }`}
              >
                {taskListPreset === recommendedPreset.key
                  ? `Viewing ${recommendedPreset.label}`
                  : `Jump to ${recommendedPreset.label}`}
              </button>
            </div>
          </div>
        )}

        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-300">Task List</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {selectedPresetDescription}
            </p>
            {advisorFilter !== 'all' && (
              <p className="mt-2 text-xs uppercase tracking-wide text-gray-500">
                Scoped to {ADVISOR_CONFIGS[advisorFilter].shortName}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {taskListPresets.map(preset => {
              const disabled = preset.key !== 'all_open' && preset.count === 0;
              return (
                <button
                  key={preset.key}
                  type="button"
                  disabled={disabled}
                  aria-pressed={taskListPreset === preset.key}
                  onClick={() => applyTaskListPreset(preset.key)}
                  className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                    taskListPreset === preset.key
                      ? 'border-gray-200 bg-gray-100 text-gray-950'
                      : disabled
                        ? 'cursor-not-allowed border-gray-800 bg-gray-950/60 text-gray-600'
                        : 'border-gray-800 bg-gray-950/80 text-gray-300 hover:border-gray-700 hover:text-gray-100'
                  }`}
                >
                  <div className="text-xs font-semibold uppercase tracking-wide">{preset.label}</div>
                  <div className="mt-1 text-sm">{preset.count}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-4">
        {/* Status filter */}
        <div className="flex gap-1">
          {(['open', 'completed', 'all'] as StatusFilter[]).map(f => (
            <button
              key={f}
              onClick={() => {
                clearTaskListPreset();
                setStatusFilter(f);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === f
                  ? 'bg-gray-700 text-gray-200'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Advisor filter */}
        <div className="flex gap-1">
          <button
            onClick={() => {
              clearTaskListPreset();
              setAdvisorFilter('all');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              advisorFilter === 'all'
                ? 'bg-gray-700 text-gray-200'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            All
          </button>
          {ACTIVE_ADVISOR_IDS.map(id => {
            const config = ADVISOR_CONFIGS[id];
            return (
              <button
                key={id}
                onClick={() => {
                  clearTaskListPreset();
                  setAdvisorFilter(id);
                }}
                className={`px-2 py-1.5 rounded-lg text-xs transition-colors ${
                  advisorFilter === id
                    ? 'bg-gray-700'
                    : 'hover:bg-gray-800'
                }`}
                style={advisorFilter === id ? { color: config.domainColor } : { color: '#9ca3af' }}
                title={config.shortName}
              >
                {config.icon}
              </button>
            );
          })}
        </div>

        {/* Priority filter */}
        <div className="flex gap-1">
          {(['all', 'high', 'medium', 'low'] as PriorityFilter[]).map(f => (
            <button
              key={f}
              onClick={() => {
                clearTaskListPreset();
                setPriorityFilter(f);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                priorityFilter === f
                  ? 'bg-gray-700 text-gray-200'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {f === 'all' ? 'Priority' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          {(['all', 'planned', 'unplanned'] as PlanningFilter[]).map(f => (
            <button
              key={f}
              onClick={() => {
                clearTaskListPreset();
                setPlanningFilter(f);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                planningFilter === f
                  ? 'bg-gray-700 text-gray-200'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {f === 'all' ? 'Planning' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        </div>

        {/* Task list */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">
              No {statusFilter === 'all' ? '' : statusFilter + ' '}tasks
              {advisorFilter !== 'all' ? ` from ${ADVISOR_CONFIGS[advisorFilter].shortName}` : ''}
              {priorityFilter !== 'all' ? ` with ${priorityFilter} priority` : ''}.
              {planningFilter === 'planned' ? ' Try the unplanned filter to triage backlog work.' : ''}
              {planningFilter === 'unplanned' ? ' Every shown item still needs a queue bucket.' : ''}
            </p>
          ) : (
            filtered.map(item => (
              <TaskRow
                key={`${item.advisorId}-${item.id}`}
                item={item}
                isInWeeklyFocus={focusKeys.has(`${item.advisorId}:${item.id}`)}
                onToggleComplete={handleToggle}
                onAddWeeklyFocus={handleAddWeeklyFocusTask}
                onRemoveWeeklyFocus={handleRemoveWeeklyFocusTask}
                onSetPlanBucket={handleSetPlanBucket}
                onClearPlanBucket={handleClearPlanBucket}
                onScheduleTask={setScheduleItem}
                schedulingEnabled={schedulingEnabled}
              />
            ))
          )}
        </div>
      </section>

      {scheduleItem && (
        <ScheduleModal
          advisorId={scheduleItem.advisorId}
          taskLabel={scheduleItem.task}
          onScheduled={() => handleClearPlanBucket(scheduleItem.advisorId, scheduleItem.id)}
          onClose={() => setScheduleItem(null)}
        />
      )}

      {scheduleAdvisorId && (
        <ScheduleModal
          advisorId={scheduleAdvisorId}
          onClose={() => setScheduleAdvisorId(null)}
        />
      )}

      {quickLogAdvisorId && (
        <QuickLogModal
          advisorId={quickLogAdvisorId}
          onClose={() => setQuickLogAdvisorId(null)}
        />
      )}
    </div>
  );
}

function getRecommendedTaskListPreset(taskListPresets: TaskListPresetMeta[]): TaskListPresetMeta | null {
  const priorityOrder: TaskListPreset[] = ['needs_triage', 'carry_over', 'overdue', 'weekly_focus'];

  for (const key of priorityOrder) {
    const preset = taskListPresets.find(item => item.key === key);
    if (preset && preset.count > 0) {
      return preset;
    }
  }

  return null;
}

function getRecommendedPresetReason(preset: TaskListPreset): string {
  switch (preset) {
    case 'needs_triage':
      return 'Open backlog items still need a real queue bucket before the week can stay intentional.';
    case 'carry_over':
      return 'Yesterday’s Today list is leaking forward. Clean that carry-over before adding more work.';
    case 'overdue':
      return 'Open commitments already slipped past their due date and should be recovered before more planning.';
    case 'weekly_focus':
      return 'Committed weekly-focus work is still open, so the highest-leverage move is advancing those promises.';
    case 'all_open':
      return 'All open work is available.';
  }
}

function getTaskListPresetDescription(
  preset: TaskListPreset,
  advisorFilter: AdvisorId | 'all',
): string {
  const scopeLabel = advisorFilter === 'all'
    ? 'across the LAB'
    : `for ${ADVISOR_CONFIGS[advisorFilter].shortName}`;

  switch (preset) {
    case 'all_open':
      return `Every open canonical task ${scopeLabel}.`;
    case 'needs_triage':
      return `Open tasks ${scopeLabel} that still need a real queue bucket.`;
    case 'carry_over':
      return `Tasks ${scopeLabel} still sitting in Today from an earlier sweep.`;
    case 'overdue':
      return `Open work ${scopeLabel} whose due date already slipped.`;
    case 'weekly_focus':
      return `Committed focus tasks ${scopeLabel} that still need movement.`;
  }
}

function shouldShowAttentionHandoff({
  attentionContext,
  initialAdvisorFilter,
  advisorFilter,
}: {
  attentionContext: TaskDashboardAttentionContext | null;
  initialAdvisorFilter: AdvisorId | 'all';
  advisorFilter: AdvisorId | 'all';
}): boolean {
  return attentionContext !== null
    && initialAdvisorFilter !== 'all'
    && advisorFilter === initialAdvisorFilter;
}

function formatAttentionPlanningCount(attentionContext: TaskDashboardAttentionContext): string {
  if (attentionContext.planningCount > 0 && attentionContext.planningLabel) {
    return `${attentionContext.planningCount} scoped task${attentionContext.planningCount === 1 ? '' : 's'} ${attentionContext.planningCount === 1 ? 'currently matches' : 'currently match'} ${attentionContext.planningLabel}.`;
  }

  if (attentionContext.planningLabel) {
    return `This routed view opened on ${attentionContext.planningLabel}.`;
  }

  return 'This routed view is scoped to the advisor that triggered the attention handoff.';
}

function getScopedAdvisorActionLabel({
  item,
  taskListPreset,
  schedulingEnabled,
}: {
  item: ReturnType<typeof selectAdvisorAttentionSummary>['items'][number] | null;
  taskListPreset: TaskListPreset;
  schedulingEnabled: boolean;
}): string | null {
  if (!item || item.status === 'steady') {
    return null;
  }

  if (item.primaryAction === 'schedule') {
    return schedulingEnabled ? 'Schedule session' : null;
  }

  if (item.primaryAction === 'quick_log') {
    return 'Quick log';
  }

  if (item.primaryAction === 'plan' && item.planningLabel && item.planningPreset && item.planningPreset !== taskListPreset) {
    return `Jump to ${item.planningLabel}`;
  }

  return null;
}

function formatScopedAdvisorStatusLine(
  item: ReturnType<typeof selectAdvisorAttentionSummary>['items'][number],
): string {
  const parts = [
    `${item.openTasks} open`,
    item.unplannedOpen > 0 ? `${item.unplannedOpen} unplanned` : null,
    item.overdueOpen > 0 ? `${item.overdueOpen} overdue` : null,
    item.lastQuickLogDate
      ? `last quick log ${item.lastQuickLogDate}`
      : 'no quick log yet',
  ].filter((part): part is string => part !== null);

  return parts.join(' • ');
}
