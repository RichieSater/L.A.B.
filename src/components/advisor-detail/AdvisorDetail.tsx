import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AdvisorId } from '../../types/advisor';
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
  const relevantFocus = focus.items.filter(item => item.advisorId === advisorId);
  const focusTaskIds = new Set(relevantFocus.map(item => item.id));
  const yearGoals = strategicYear.sections.yearGoals.goals
    .map(goal => goal.text.trim())
    .filter(Boolean);
  const schedulingEnabled = profile?.schedulingEnabled ?? false;
  const plannerItems = state.tasks.map(item => {
    const assignment = appState.taskPlanning[getTaskPlanningKey(advisorId, item.id)];
    return {
      ...item,
      planningBucket: assignment?.bucket ?? null,
      isInWeeklyFocus: focusTaskIds.has(item.id),
    };
  });
  const openPlannerItems = plannerItems.filter(item => item.status === 'open');
  const currentDate = today();
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

    navigate('/', { state: dashboardState });
  };

  return (
    <div>
      {/* Back link */}
      <button
        onClick={() => navigate('/')}
        className="text-sm text-gray-500 hover:text-gray-300 mb-4 transition-colors"
      >
        &larr; Dashboard
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <span className="text-4xl">{config.icon}</span>
          <div>
            <h2 className="text-2xl font-bold text-gray-100">{config.displayName}</h2>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
              <StatusBadge status={status} daysOverdue={daysOverdue} />
              {state.streak > 0 && (
                <span className="text-sm text-gray-400">{state.streak} session streak</span>
              )}
              <span className="text-sm text-gray-500">
                {state.sessions.length} total sessions
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 self-start">
          <button
            onClick={() => navigate(`/session/${advisorId}`)}
            className="px-5 py-2.5 rounded-lg font-medium transition-colors"
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
              className="px-4 py-2.5 rounded-lg font-medium text-gray-400 hover:text-gray-200 bg-gray-800 hover:bg-gray-700 transition-colors"
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
              navigate('/');
            }}
            className="px-4 py-2.5 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors"
          >
            Deactivate
          </button>
        </div>
      </div>

      {/* Last session info */}
      {state.lastSessionDate && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Last Session — {state.lastSessionDate} ({formatDaysAgo(state.lastSessionDate)})
          </h3>
          <p className="text-sm text-gray-300">{state.lastSessionSummary}</p>
          {state.contextForNextSession && (
            <div className="mt-3 pt-3 border-t border-gray-800">
              <h4 className="text-xs text-gray-500 uppercase tracking-wide mb-1">Context for next session</h4>
              <p className="text-sm text-gray-400">{state.contextForNextSession}</p>
            </div>
          )}
        </div>
      )}

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Action items — 2 cols */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
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
              schedulingEnabled={schedulingEnabled}
            />
            {state.habits.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-800">
                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Habits
                </h4>
                <div className="space-y-2">
                  {state.habits.map(habit => (
                    <div key={habit.id} className="rounded-lg bg-gray-800/40 px-3 py-2">
                      <p className="text-sm text-gray-200">{habit.name}</p>
                      <p className="text-xs text-gray-500">
                        {habit.cadence} target {habit.targetCount}{habit.unit ? ` ${habit.unit}` : ''} · {habit.status}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Metrics — 1 col */}
        <div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
              Metrics
            </h3>
            <MetricsSummary config={config} state={state} />
          </div>

          {/* Recent quick logs */}
          {supportsQuickLog && (
            <RecentQuickLogs advisorId={advisorId} />
          )}

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
              Planning Context
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              <PlannerStat label="Today" value={planningCounts.today} />
              <PlannerStat label="This Week" value={planningCounts.thisWeek} />
              <PlannerStat label="Later" value={planningCounts.later} />
              <PlannerStat label="Unplanned" value={planningCounts.unplanned} />
              <PlannerStat label="Focus" value={planningCounts.focus} />
            </div>
            <p className="mt-3 text-sm text-gray-500">
              {openPlannerItems.length} open task{openPlannerItems.length === 1 ? '' : 's'} in this domain.
              {planningCounts.unplanned > 0
                ? ` ${planningCounts.unplanned} still need${planningCounts.unplanned === 1 ? 's' : ''} a queue home.`
                : ' Everything open already has a planning home.'}
            </p>
            {recommendedPlannerRoute && (
              <div className="mt-4 rounded-lg border border-sky-500/20 bg-sky-500/10 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-300">Next weekly sweep</p>
                <h4 className="mt-1 text-sm font-semibold text-gray-100">
                  {recommendedPlannerRoute.label} deserves the next sweep
                </h4>
                <p className="mt-1 text-xs text-gray-300">
                  {getPlannerRouteReason(recommendedPlannerRoute)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleOpenWeeklyLab(recommendedPlannerRoute.preset)}
                    className="rounded-full border border-sky-300/30 bg-gray-950/60 px-3 py-1.5 text-xs font-medium text-sky-100 transition-colors hover:border-sky-200/50 hover:text-white"
                  >
                    {`Open ${recommendedPlannerRoute.label} in Weekly LAB`}
                  </button>
                  {alternatePlannerRoutes.map(route => (
                    <button
                      key={route.preset}
                      onClick={() => handleOpenWeeklyLab(route.preset)}
                      className="rounded-full border border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:border-gray-500 hover:text-gray-100"
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
                className="rounded-full border border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:border-gray-500 hover:text-gray-100"
              >
                {recommendedPlannerRoute ? 'Open advisor task list' : 'Open Weekly LAB'}
              </button>
              <button
                onClick={() => navigate('/compass')}
                className="rounded-full border border-amber-700/40 bg-amber-950/40 px-3 py-1.5 text-xs font-medium text-amber-200 transition-colors hover:border-amber-500/60 hover:bg-amber-950/60"
              >
                Open Compass
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Year goals</p>
              {yearGoals.length > 0 ? (
                <div className="space-y-2">
                  {yearGoals.slice(0, 3).map(goal => (
                    <p key={goal} className="text-sm text-gray-300">
                      • {goal}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No year goals set yet.</p>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Weekly focus</p>
              {relevantFocus.length > 0 ? (
                <div className="space-y-2">
                  {relevantFocus.map(item => (
                    <p key={`${item.advisorId}-${item.id}`} className="text-sm text-gray-300">
                      • {item.task}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No current weekly focus items for this advisor.</p>
              )}
            </div>
          </div>

          {/* Session history */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
              Session History
            </h3>
            {state.sessions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No sessions yet.</p>
            ) : (
              <div className="space-y-3">
                {[...state.sessions].reverse().slice(0, 10).map(session => (
                  <div key={session.id} className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">{session.date}</span>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{session.mood}</span>
                        <span>E:{session.energy}/10</span>
                      </div>
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{session.summary}</p>
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

function PlannerStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-950/70 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-base font-semibold text-gray-100">{value}</p>
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
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
        Recent Quick Logs
      </h3>
      <div className="space-y-3">
        {recentLogs.map((log, i) => (
          <div key={log.timestamp ?? i} className="text-sm">
            <span className="text-gray-500 text-xs">{log.date}</span>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
              {Object.entries(log.logs).map(([key, val]) => (
                <span key={key} className="text-gray-300">
                  {getLabel(key)}: <span className="text-gray-100">{val}</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
