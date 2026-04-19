import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ADVISORY_BOARD_PATH,
  getAdvisorSessionPath,
  GOLDEN_COMPASS_PATH,
  QUANTUM_PLANNER_PATH,
} from '../../constants/routes';
import type { AdvisorId } from '../../types/advisor';
import type { TaskStatus } from '../../types/action-item';
import { useAdvisor } from '../../hooks/use-advisor';
import { useAuth } from '../../auth/auth-context';
import {
  selectSupportsQuickLog,
  selectWeeklyFocusSummary,
  selectWeeklyReviewSummary,
} from '../../state/selectors';
import { ADVISOR_CONFIGS } from '../../advisors/registry';
import { StatusBadge } from '../shared/StatusBadge';
import { ActionItemList } from './ActionItemList';
import { MetricsSummary } from './MetricsSummary';
import { QuickLogModal } from '../quick-log/QuickLogModal';
import { ScheduleModal } from '../scheduling/ScheduleModal';
import { daysAgo, formatDaysAgo, today } from '../../utils/date';
import { getStrategicDashboardYear } from '../../types/strategic-dashboard';
import { getTaskPlanningKey } from '../../types/task-planning';
import type { DashboardNavigationState, TaskListPreset } from '../../types/dashboard-navigation';

interface AdvisorDetailProps {
  advisorId: AdvisorId;
}

type AdvisorPlannerRoutePreset = Exclude<TaskListPreset, 'all_open'>;

type AdvisorPlannerRoute = {
  preset: AdvisorPlannerRoutePreset;
  label: string;
  count: number;
};

const ADVISOR_PLANNER_ROUTE_LABELS: Record<AdvisorPlannerRoutePreset, string> = {
  needs_triage: 'Needs Triage',
  carry_over: 'Carry Over',
  overdue: 'Overdue',
  weekly_focus: 'Weekly Focus',
};

export function AdvisorDetail({ advisorId }: AdvisorDetailProps) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { config, state, status, dispatch, appState } = useAdvisor(advisorId);
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [scheduleTaskLabel, setScheduleTaskLabel] = useState<string | null>(null);
  const supportsQuickLog = selectSupportsQuickLog(advisorId);
  const planningYear = new Date().getFullYear();
  const strategicYear = getStrategicDashboardYear(appState.strategicDashboard, planningYear);
  const focus = selectWeeklyFocusSummary(appState);
  const review = selectWeeklyReviewSummary(appState);
  const currentDate = today();
  const relevantFocus = focus.items.filter(item => item.advisorId === advisorId);
  const focusTaskIds = new Set(relevantFocus.map(item => item.id));
  const staleTodayTaskIds = new Set(
    review.staleToday
      .filter(item => item.advisorId === advisorId)
      .map(item => item.id),
  );
  const yearGoals = strategicYear.sections.yearGoals.goals
    .map(goal => goal.text.trim())
    .filter(Boolean);
  const schedulingEnabled = profile?.schedulingEnabled ?? false;
  const plannerItems = state.tasks.map(item => {
    const assignment = appState.taskPlanning[getTaskPlanningKey(advisorId, item.id)];
    const planningBucket = assignment?.bucket ?? null;
    const isInWeeklyFocus = focusTaskIds.has(item.id);
    const isCarryOver = staleTodayTaskIds.has(item.id);
    return {
      ...item,
      planningBucket,
      isInWeeklyFocus,
      isCarryOver,
      weeklyLabRoute: getTaskWeeklyLabRoute({
        status: item.status,
        planningBucket,
        isCarryOver,
        isInWeeklyFocus,
        dueDate: item.dueDate,
        currentDate,
      }),
    };
  });
  const openPlannerItems = plannerItems.filter(item => item.status === 'open');
  const staleTodayCount = review.staleToday.filter(item => item.advisorId === advisorId).length;
  const overdueCount = openPlannerItems.filter(
    item => item.dueDate !== 'ongoing' && item.dueDate < currentDate,
  ).length;
  const planningCounts = {
    today: openPlannerItems.filter(item => item.planningBucket === 'today').length,
    thisWeek: openPlannerItems.filter(item => item.planningBucket === 'this_week').length,
    later: openPlannerItems.filter(item => item.planningBucket === 'later').length,
    unplanned: openPlannerItems.filter(item => !item.planningBucket).length,
    focus: relevantFocus.filter(item => item.status === 'open').length,
  };
  const plannerRoutes: AdvisorPlannerRoute[] = [
    { preset: 'needs_triage', label: 'Needs Triage', count: planningCounts.unplanned },
    { preset: 'carry_over', label: 'Carry Over', count: staleTodayCount },
    { preset: 'overdue', label: 'Overdue', count: overdueCount },
    { preset: 'weekly_focus', label: 'Weekly Focus', count: planningCounts.focus },
  ];
  const recommendedPlannerRoute = getRecommendedPlannerRoute(plannerRoutes);
  const alternatePlannerRoutes = plannerRoutes.filter(
    route => route.count > 0 && route.preset !== recommendedPlannerRoute?.preset,
  );

  const daysOverdue = status === 'overdue' && state.nextDueDate
    ? daysAgo(state.nextDueDate)
    : undefined;

  const handleToggleComplete = (itemId: string) => {
    const item = state.tasks.find(i => i.id === itemId);
    if (!item) return;
    const newStatus = item.status === 'completed' ? 'open' : 'completed';
    dispatch({
      type: 'UPDATE_TASK',
      payload: { advisorId, taskId: itemId, status: newStatus },
    });
  };

  const handleSetPlanBucket = (taskId: string, bucket: 'today' | 'this_week' | 'later') => {
    dispatch({
      type: 'SET_TASK_PLAN_BUCKET',
      payload: {
        advisorId,
        taskId,
        bucket,
      },
    });
  };

  const handleClearPlanBucket = (taskId: string) => {
    dispatch({
      type: 'CLEAR_TASK_PLAN_BUCKET',
      payload: {
        advisorId,
        taskId,
      },
    });
  };

  const handleAddWeeklyFocus = (taskId: string) => {
    dispatch({
      type: 'ADD_WEEKLY_FOCUS_TASK',
      payload: {
        advisorId,
        taskId,
        weekStart: focus.weekStart,
      },
    });
  };

  const handleRemoveWeeklyFocus = (taskId: string) => {
    dispatch({
      type: 'REMOVE_WEEKLY_FOCUS_TASK',
      payload: {
        advisorId,
        taskId,
        weekStart: focus.weekStart,
      },
    });
  };

  const handleScheduleTask = (taskId: string) => {
    const item = plannerItems.find(task => task.id === taskId);
    if (!item) {
      return;
    }

    setScheduleTaskLabel(item.task);
  };

  const handleOpenWeeklyLab = (preset?: AdvisorPlannerRoutePreset) => {
    const dashboardState: DashboardNavigationState = {
      dashboard: {
        tab: 'week',
        taskList: preset
          ? {
              advisorId,
              taskListPreset: preset,
            }
          : {
              advisorId,
            },
      },
    };

    navigate(QUANTUM_PLANNER_PATH, { state: dashboardState });
  };

  return (
    <div className="lab-page">
      <button
        onClick={() => navigate(ADVISORY_BOARD_PATH)}
        className="mb-4 text-sm text-[color:var(--lab-text-muted)] transition-colors hover:text-[color:var(--lab-text)]"
      >
        &larr; Advisory Board
      </button>

      <div className="lab-panel mb-6 rounded-[1.75rem] px-6 py-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-4xl">{config.icon}</span>
          <div>
            <p className="lab-eyebrow">{config.shortName}</p>
            <h2 className="mt-2 text-[2rem] font-bold tracking-[-0.04em] text-[color:var(--lab-text)]">{config.displayName}</h2>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
              <StatusBadge status={status} daysOverdue={daysOverdue} />
              {state.streak > 0 && (
                <span className="text-sm text-[color:var(--lab-text-muted)]">{state.streak} session streak</span>
              )}
              <span className="text-sm text-[color:var(--lab-text-dim)]">
                {state.sessions.length} total sessions
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 self-start">
          <button
            onClick={() => navigate(getAdvisorSessionPath(advisorId))}
            className="lab-button rounded-2xl"
            style={{
              backgroundColor: config.domainColor,
              color: 'white',
            }}
          >
            Start Session
          </button>
          {supportsQuickLog && (
            <button
              onClick={() => setShowQuickLog(true)}
              className="lab-button lab-button--ghost rounded-2xl"
            >
              Quick Log
            </button>
          )}
          <button
            onClick={() => {
              dispatch({
                type: 'TOGGLE_ADVISOR_ACTIVATION',
                payload: { advisorId },
              });
              navigate(ADVISORY_BOARD_PATH);
            }}
            className="lab-button lab-button--danger rounded-2xl"
          >
            Deactivate
          </button>
        </div>
      </div>
      </div>

      {state.lastSessionDate && (
        <div className="lab-panel mb-6 rounded-[1.5rem] p-4">
          <h3 className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--lab-text-muted)]">
            Last Session — {state.lastSessionDate} ({formatDaysAgo(state.lastSessionDate)})
          </h3>
          <p className="text-sm text-[color:var(--lab-text)]">{state.lastSessionSummary}</p>
          {state.contextForNextSession && (
            <div className="mt-3 border-t border-[color:var(--lab-border-muted)] pt-3">
              <h4 className="mb-1 text-xs uppercase tracking-wide text-[color:var(--lab-text-dim)]">Context for next session</h4>
              <p className="text-sm text-[color:var(--lab-text-muted)]">{state.contextForNextSession}</p>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="lab-panel rounded-[1.5rem] p-5">
            <h3 className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--lab-text-muted)]">
              Tasks
            </h3>
            <ActionItemList
              items={plannerItems}
              onToggleComplete={handleToggleComplete}
              onSetPlanBucket={handleSetPlanBucket}
              onClearPlanBucket={handleClearPlanBucket}
              onAddWeeklyFocus={handleAddWeeklyFocus}
              onRemoveWeeklyFocus={handleRemoveWeeklyFocus}
              onScheduleTask={handleScheduleTask}
              onOpenWeeklyLabRoute={handleOpenWeeklyLab}
              schedulingEnabled={schedulingEnabled}
            />
            {state.habits.length > 0 && (
              <div className="mt-6 border-t border-[color:var(--lab-border-muted)] pt-6">
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[color:var(--lab-text-muted)]">
                  Habits
                </h4>
                <div className="space-y-2">
                  {state.habits.map(habit => (
                    <div key={habit.id} className="rounded-2xl border border-[color:var(--lab-border-muted)] bg-[rgba(19,28,38,0.86)] px-3 py-2">
                      <p className="text-sm text-[color:var(--lab-text)]">{habit.name}</p>
                      <p className="text-xs text-[color:var(--lab-text-dim)]">
                        {habit.cadence} target {habit.targetCount}{habit.unit ? ` ${habit.unit}` : ''} · {habit.status}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="lab-panel mb-6 rounded-[1.5rem] p-5">
            <h3 className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--lab-text-muted)]">
              Metrics
            </h3>
            <MetricsSummary config={config} state={state} />
          </div>

          {/* Recent quick logs */}
          {supportsQuickLog && (
            <RecentQuickLogs advisorId={advisorId} />
          )}

          <div className="lab-panel mb-6 rounded-[1.5rem] p-5">
            <h3 className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--lab-text-muted)]">
              Planning Context
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              <PlannerStat label="Today" value={planningCounts.today} />
              <PlannerStat label="This Week" value={planningCounts.thisWeek} />
              <PlannerStat label="Later" value={planningCounts.later} />
              <PlannerStat label="Unplanned" value={planningCounts.unplanned} />
              <PlannerStat label="Focus" value={planningCounts.focus} />
            </div>
            <p className="mt-3 text-sm text-[color:var(--lab-text-muted)]">
              {openPlannerItems.length} open task{openPlannerItems.length === 1 ? '' : 's'} in this domain.
              {planningCounts.unplanned > 0
                ? ` ${planningCounts.unplanned} still need${planningCounts.unplanned === 1 ? 's' : ''} a queue home.`
                : ' Everything open already has a planning home.'}
            </p>
            {recommendedPlannerRoute && (
              <div className="mt-4 rounded-[1.4rem] border border-[rgba(92,138,214,0.34)] bg-[rgba(26,34,45,0.92)] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--lab-text-muted)]">Next weekly sweep</p>
                <h4 className="mt-1 text-sm font-semibold text-[color:var(--lab-text)]">
                  {recommendedPlannerRoute.label} deserves the next sweep
                </h4>
                <p className="mt-1 text-xs text-[color:var(--lab-text-muted)]">
                  {getPlannerRouteReason(recommendedPlannerRoute)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleOpenWeeklyLab(recommendedPlannerRoute.preset)}
                    className="lab-button lab-button--blue rounded-2xl px-4 py-2 text-xs"
                  >
                    {`Open ${recommendedPlannerRoute.label} in Weekly LAB`}
                  </button>
                  {alternatePlannerRoutes.map(route => (
                    <button
                      key={route.preset}
                      onClick={() => handleOpenWeeklyLab(route.preset)}
                      className="lab-button lab-button--ghost rounded-2xl px-4 py-2 text-xs"
                    >
                      {`${route.label} (${route.count})`}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => handleOpenWeeklyLab()}
                className="lab-button lab-button--ghost rounded-2xl px-4 py-2 text-xs"
              >
                {recommendedPlannerRoute ? 'Open advisor task list' : 'Open Weekly LAB'}
              </button>
              <button
                onClick={() => navigate(GOLDEN_COMPASS_PATH)}
                className="lab-button lab-button--ink rounded-2xl px-4 py-2 text-xs"
              >
                Open Compass
              </button>
            </div>

            <div className="mt-4 border-t border-[color:var(--lab-border-muted)] pt-4">
              <p className="mb-2 text-xs uppercase tracking-wide text-[color:var(--lab-text-dim)]">Year goals</p>
              {yearGoals.length > 0 ? (
                <div className="space-y-2">
                  {yearGoals.slice(0, 3).map(goal => (
                    <p key={goal} className="text-sm text-[color:var(--lab-text)]">
                      • {goal}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[color:var(--lab-text-muted)]">No year goals set yet.</p>
              )}
            </div>

            <div className="mt-4 border-t border-[color:var(--lab-border-muted)] pt-4">
              <p className="mb-2 text-xs uppercase tracking-wide text-[color:var(--lab-text-dim)]">Weekly focus</p>
              {relevantFocus.length > 0 ? (
                <div className="space-y-2">
                  {relevantFocus.map(item => (
                    <p key={`${item.advisorId}-${item.id}`} className="text-sm text-[color:var(--lab-text)]">
                      • {item.task}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[color:var(--lab-text-muted)]">No current weekly focus items for this advisor.</p>
              )}
            </div>
          </div>

          <div className="lab-panel rounded-[1.5rem] p-5">
            <h3 className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--lab-text-muted)]">
              Session History
            </h3>
            {state.sessions.length === 0 ? (
              <p className="py-4 text-center text-sm text-[color:var(--lab-text-muted)]">No sessions yet.</p>
            ) : (
              <div className="space-y-3">
                {[...state.sessions].reverse().slice(0, 10).map(session => (
                  <div key={session.id} className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[color:var(--lab-text)]">{session.date}</span>
                      <div className="flex items-center gap-2 text-xs text-[color:var(--lab-text-dim)]">
                        <span>{session.mood}</span>
                        <span>E:{session.energy}/10</span>
                      </div>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-[color:var(--lab-text-muted)]">{session.summary}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showQuickLog && (
        <QuickLogModal
          advisorId={advisorId}
          onClose={() => setShowQuickLog(false)}
        />
      )}

      {scheduleTaskLabel && (
        <ScheduleModal
          advisorId={advisorId}
          taskLabel={scheduleTaskLabel}
          onClose={() => setScheduleTaskLabel(null)}
        />
      )}
    </div>
  );
}

function getTaskWeeklyLabRoute(input: {
  status: TaskStatus;
  planningBucket: 'today' | 'this_week' | 'later' | null;
  isCarryOver: boolean;
  isInWeeklyFocus: boolean;
  dueDate: string;
  currentDate: string;
}): { preset: AdvisorPlannerRoutePreset; label: string } | null {
  const {
    status,
    planningBucket,
    isCarryOver,
    isInWeeklyFocus,
    dueDate,
    currentDate,
  } = input;

  if (status !== 'open') {
    return null;
  }

  if (!planningBucket) {
    return {
      preset: 'needs_triage',
      label: ADVISOR_PLANNER_ROUTE_LABELS.needs_triage,
    };
  }

  if (isCarryOver) {
    return {
      preset: 'carry_over',
      label: ADVISOR_PLANNER_ROUTE_LABELS.carry_over,
    };
  }

  if (dueDate !== 'ongoing' && dueDate < currentDate) {
    return {
      preset: 'overdue',
      label: ADVISOR_PLANNER_ROUTE_LABELS.overdue,
    };
  }

  if (isInWeeklyFocus) {
    return {
      preset: 'weekly_focus',
      label: ADVISOR_PLANNER_ROUTE_LABELS.weekly_focus,
    };
  }

  return null;
}

function PlannerStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="lab-stat">
      <p className="lab-stat__label">{label}</p>
      <p className="mt-1 text-base font-semibold text-[color:var(--lab-text)]">{value}</p>
    </div>
  );
}

function getRecommendedPlannerRoute(
  plannerRoutes: AdvisorPlannerRoute[],
): AdvisorPlannerRoute | null {
  return plannerRoutes.find(route => route.count > 0) ?? null;
}

function getPlannerRouteReason(route: AdvisorPlannerRoute): string {
  switch (route.preset) {
    case 'needs_triage':
      return `${route.count} open task${route.count === 1 ? '' : 's'} still need${route.count === 1 ? 's' : ''} a queue home before this advisor can stay intentional.`;
    case 'carry_over':
      return `${route.count} task${route.count === 1 ? ' is' : 's are'} still sitting in Today from an earlier sweep.`;
    case 'overdue':
      return `${route.count} overdue task${route.count === 1 ? ' needs' : 's need'} recovery before more planning.`;
    case 'weekly_focus':
      return `${route.count} weekly focus task${route.count === 1 ? ' is' : 's are'} still open for this advisor.`;
  }
}

function RecentQuickLogs({ advisorId }: { advisorId: AdvisorId }) {
  const { appState } = useAdvisor(advisorId);
  const metricDefs = appState.advisors[advisorId].checkInConfig ?? ADVISOR_CONFIGS[advisorId].metricDefinitions;

  const recentLogs = appState.quickLogs
    .filter(l => l.advisorId === advisorId)
    .slice(-7)
    .reverse();

  if (recentLogs.length === 0) return null;

  const getLabel = (id: string) => metricDefs.find(m => m.id === id)?.label ?? id;

  return (
    <div className="lab-panel mb-6 rounded-[1.5rem] p-5">
      <h3 className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--lab-text-muted)]">
        Recent Quick Logs
      </h3>
      <div className="space-y-3">
        {recentLogs.map((log, i) => (
          <div key={log.timestamp ?? i} className="lab-subpanel p-3 text-sm">
            <span className="text-xs text-[color:var(--lab-text-dim)]">{log.date}</span>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
              {Object.entries(log.logs).map(([key, val]) => (
                <span key={key} className="text-[color:var(--lab-text-muted)]">
                  {getLabel(key)}: <span className="text-[color:var(--lab-text)]">{val}</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
