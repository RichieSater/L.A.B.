import { useState } from 'react';
import { useAuth } from '../../auth/auth-context';
import type { AdvisorId } from '../../types/advisor';
import { useAppState } from '../../state/app-context';
import { ScheduleModal } from '../scheduling/ScheduleModal';
import type { TaskPlanningBucket } from '../../types/task-planning';
import {
  selectAllHabits,
  selectAllTaskItems,
  selectDailyPlanningSummary,
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
import { WeeklyFocusCard } from './WeeklyFocusCard';
import { WeeklyReviewCard } from './WeeklyReviewCard';

type StatusFilter = 'open' | 'completed' | 'all';
type PriorityFilter = 'all' | 'high' | 'medium' | 'low';
type PlanningFilter = 'all' | 'planned' | 'unplanned';

export function TaskDashboard() {
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
  const [advisorFilter, setAdvisorFilter] = useState<AdvisorId | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [planningFilter, setPlanningFilter] = useState<PlanningFilter>('all');
  const [scheduleItem, setScheduleItem] = useState<EnrichedTaskItem | null>(null);
  const schedulingEnabled = profile?.schedulingEnabled ?? false;

  const filtered = allItems.filter(item => {
    if (statusFilter === 'open' && item.status !== 'open') return false;
    if (statusFilter === 'completed' && item.status !== 'completed') return false;
    if (advisorFilter !== 'all' && item.advisorId !== advisorFilter) return false;
    if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;
    if (planningFilter === 'planned' && !item.planningBucket) return false;
    if (planningFilter === 'unplanned' && !!item.planningBucket) return false;
    return true;
  });

  const now = today();
  const overdueCount = allItems.filter(
    i => i.status === 'open' && i.dueDate !== 'ongoing' && i.dueDate < now,
  ).length;
  const openCount = allItems.filter(i => i.status === 'open').length;
  const plannedCount = planning.totalPlanned;
  const focusCount = focus.items.length;

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

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        {/* Status filter */}
        <div className="flex gap-1">
          {(['open', 'completed', 'all'] as StatusFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
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
            onClick={() => setAdvisorFilter('all')}
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
                onClick={() => setAdvisorFilter(id)}
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
              onClick={() => setPriorityFilter(f)}
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
              onClick={() => setPlanningFilter(f)}
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

      {scheduleItem && (
        <ScheduleModal
          advisorId={scheduleItem.advisorId}
          taskLabel={scheduleItem.task}
          onScheduled={() => handleClearPlanBucket(scheduleItem.advisorId, scheduleItem.id)}
          onClose={() => setScheduleItem(null)}
        />
      )}
    </div>
  );
}
