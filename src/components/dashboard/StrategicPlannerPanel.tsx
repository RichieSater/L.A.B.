import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ACTIVE_ADVISOR_IDS, ADVISOR_CONFIGS } from '../../advisors/registry';
import { useAppState } from '../../state/app-context';
import { selectAllTaskItems, selectWeeklyFocusSummary } from '../../state/selectors';
import { getStrategicDashboardYear, type StrategicDashboardSectionKey } from '../../types/strategic-dashboard';
import type { AdvisorId } from '../../types/advisor';
import type { TaskPlanningBucket } from '../../types/task-planning';
import type { TaskStatus } from '../../types/action-item';

const PROMOTION_BUCKETS: Record<StrategicDashboardSectionKey, 'today' | 'this_week' | 'later'> = {
  biggestGoals: 'later',
  landmarkVision: 'later',
  yearGoals: 'later',
  quarterGoals: 'this_week',
  monthGoals: 'today',
};

const LINKED_TASK_BUCKET_OPTIONS: Array<{ label: string; value: TaskPlanningBucket | 'unplanned' }> = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'this_week' },
  { label: 'Later', value: 'later' },
  { label: 'Unplanned', value: 'unplanned' },
];

const PRIMARY_SECTIONS: StrategicDashboardSectionKey[] = ['yearGoals', 'quarterGoals', 'monthGoals'];
const SUPPORTING_SECTIONS: StrategicDashboardSectionKey[] = ['biggestGoals', 'landmarkVision'];

export function StrategicPlannerPanel() {
  const navigate = useNavigate();
  const { state, dispatch } = useAppState();
  const [advisorChoices, setAdvisorChoices] = useState<Record<string, AdvisorId>>({});
  const planningYear = new Date().getFullYear();
  const strategicYear = useMemo(
    () => getStrategicDashboardYear(state.strategicDashboard, planningYear),
    [planningYear, state.strategicDashboard],
  );
  const latestCompassInsights = state.strategicDashboard.latestCompassInsights;
  const weeklyFocus = selectWeeklyFocusSummary(state);
  const allTasks = selectAllTaskItems(state);
  const taskMap = useMemo(
    () => new Map(allTasks.map(task => [`${task.advisorId}:${task.id}`, task])),
    [allTasks],
  );
  const focusTaskKeys = useMemo(
    () => new Set(weeklyFocus.items.map(item => `${item.advisorId}:${item.id}`)),
    [weeklyFocus.items],
  );

  function getAdvisorChoice(key: string, lockedAdvisorId: AdvisorId | null): AdvisorId {
    return lockedAdvisorId ?? advisorChoices[key] ?? 'prioritization';
  }

  function setAdvisorChoice(key: string, advisorId: AdvisorId) {
    setAdvisorChoices(previous => ({
      ...previous,
      [key]: advisorId,
    }));
  }

  function getLinkedTaskSummary(
    linkedTask: { advisorId: AdvisorId; taskId: string } | null,
  ): GoalLinkedTaskSummary | null {
    if (!linkedTask) {
      return null;
    }

    const linkedKey = `${linkedTask.advisorId}:${linkedTask.taskId}`;
    const task = taskMap.get(linkedKey);
    const advisorName = ADVISOR_CONFIGS[linkedTask.advisorId].shortName;

    if (!task) {
      return {
        state: 'missing',
        advisorId: linkedTask.advisorId,
        taskId: linkedTask.taskId,
        advisorName,
        planningBucket: null,
        inWeeklyFocus: false,
        status: null,
      };
    }

    return {
      state: task.status === 'open' ? 'open' : 'completed',
      advisorId: linkedTask.advisorId,
      taskId: linkedTask.taskId,
      advisorName,
      planningBucket: task.planningBucket,
      inWeeklyFocus: focusTaskKeys.has(linkedKey),
      status: task.status,
    };
  }

  function promoteGoal(
    sectionKey: StrategicDashboardSectionKey,
    index: number,
    advisorId: AdvisorId,
    addToFocus: boolean,
  ) {
    const goal = strategicYear.sections[sectionKey].goals[index];
    if (!goal.text.trim()) {
      return;
    }

    dispatch({
      type: 'PROMOTE_STRATEGIC_GOAL_TO_TASK',
      payload: {
        year: planningYear,
        sectionKey,
        index,
        advisorId,
        bucket: addToFocus ? 'this_week' : PROMOTION_BUCKETS[sectionKey],
        addToWeeklyFocusWeekStart: addToFocus ? weeklyFocus.weekStart : null,
      },
    });
  }

  function setLinkedTaskBucket(summary: GoalLinkedTaskSummary, bucket: TaskPlanningBucket) {
    if (summary.state !== 'open') {
      return;
    }

    dispatch({
      type: 'SET_TASK_PLAN_BUCKET',
      payload: {
        advisorId: summary.advisorId,
        taskId: summary.taskId,
        bucket,
      },
    });
  }

  function clearLinkedTaskBucket(summary: GoalLinkedTaskSummary) {
    if (summary.state !== 'open') {
      return;
    }

    dispatch({
      type: 'CLEAR_TASK_PLAN_BUCKET',
      payload: {
        advisorId: summary.advisorId,
        taskId: summary.taskId,
      },
    });
  }

  function toggleLinkedTaskFocus(summary: GoalLinkedTaskSummary) {
    if (summary.state !== 'open') {
      return;
    }

    dispatch(
      summary.inWeeklyFocus
        ? {
            type: 'REMOVE_WEEKLY_FOCUS_TASK',
            payload: {
              advisorId: summary.advisorId,
              taskId: summary.taskId,
              weekStart: weeklyFocus.weekStart,
            },
          }
        : {
            type: 'ADD_WEEKLY_FOCUS_TASK',
            payload: {
              advisorId: summary.advisorId,
              taskId: summary.taskId,
              weekStart: weeklyFocus.weekStart,
            },
          },
    );
  }

  return (
    <section className="space-y-5">
      <div className="rounded-[2rem] border border-stone-200/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.92)_0%,_rgba(250,247,240,0.96)_100%)] p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
              Weekly Direction
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">
              Plan the week from the year you are building
            </h2>
            <p className="mt-3 text-sm leading-6 text-stone-700">
              LAB now keeps your yearly strategy, weekly focus, and advisor tasks in one place. Use this strip to
              keep month and quarter priorities visible while you move work into real tasks.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/compass')}
              className="rounded-full border border-amber-300 bg-amber-50 px-5 py-2.5 text-sm font-semibold text-amber-900 transition hover:border-amber-500 hover:bg-amber-100"
            >
              Open Compass
            </button>
            <div className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-sm">
              {planningYear} strategy
            </div>
          </div>
        </div>

        {latestCompassInsights ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <InsightCard title="Annual goals" items={latestCompassInsights.annualGoals} />
            <InsightCard title="Daily rituals" items={latestCompassInsights.dailyRituals} />
            <InsightCard title="Support people" items={latestCompassInsights.supportPeople} />
          </div>
        ) : (
          <div className="mt-6 rounded-3xl border border-dashed border-stone-300 bg-white/70 px-5 py-4 text-sm text-stone-600">
            No completed Compass yet. Run one to seed your annual goals and support structure into LAB.
          </div>
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.5fr,1fr]">
        <div className="space-y-5">
          {PRIMARY_SECTIONS.map(sectionKey => (
            <SectionCard
              key={sectionKey}
              sectionKey={sectionKey}
              title={strategicYear.sections[sectionKey].label}
              description={strategicYear.sections[sectionKey].description}
            >
              <div className="space-y-4">
                {strategicYear.sections[sectionKey].goals.map((goal, index) => (
                  (() => {
                    const linkedTaskSummary = getLinkedTaskSummary(goal.linkedTask);
                    const lockedAdvisorId = linkedTaskSummary?.state === 'open' ? linkedTaskSummary.advisorId : null;
                    const goalKey = `${sectionKey}-${index}`;

                    return (
                  <GoalRow
                    key={goal.id}
                    goalKey={goalKey}
                    sectionKey={sectionKey}
                    index={index}
                    text={goal.text}
                    completed={goal.completed}
                    source={goal.source}
                    linkedTaskSummary={linkedTaskSummary}
                    advisorId={getAdvisorChoice(goalKey, lockedAdvisorId)}
                    advisorLocked={lockedAdvisorId !== null}
                    onAdvisorChange={advisorId => setAdvisorChoice(goalKey, advisorId)}
                    onTextChange={text => dispatch({
                      type: 'SET_STRATEGIC_GOAL_SLOT',
                      payload: { year: planningYear, sectionKey, index, text },
                    })}
                    onToggleComplete={() => dispatch({
                      type: 'TOGGLE_STRATEGIC_GOAL_COMPLETED',
                      payload: { year: planningYear, sectionKey, index },
                    })}
                    onQueue={() => promoteGoal(sectionKey, index, getAdvisorChoice(goalKey, lockedAdvisorId), false)}
                    onFocus={() => promoteGoal(sectionKey, index, getAdvisorChoice(goalKey, lockedAdvisorId), true)}
                    onSetLinkedTaskBucket={bucket => {
                      if (linkedTaskSummary) {
                        setLinkedTaskBucket(linkedTaskSummary, bucket);
                      }
                    }}
                    onClearLinkedTaskBucket={() => {
                      if (linkedTaskSummary) {
                        clearLinkedTaskBucket(linkedTaskSummary);
                      }
                    }}
                    onToggleLinkedTaskFocus={() => {
                      if (linkedTaskSummary) {
                        toggleLinkedTaskFocus(linkedTaskSummary);
                      }
                    }}
                  />
                    );
                  })()
                ))}
              </div>
            </SectionCard>
          ))}
        </div>

        <div className="space-y-5">
          {SUPPORTING_SECTIONS.map(sectionKey => (
            <SectionCard
              key={sectionKey}
              sectionKey={sectionKey}
              title={strategicYear.sections[sectionKey].label}
              description={strategicYear.sections[sectionKey].description}
            >
              <div className="space-y-4">
                {strategicYear.sections[sectionKey].goals.map((goal, index) => (
                  (() => {
                    const linkedTaskSummary = getLinkedTaskSummary(goal.linkedTask);
                    const lockedAdvisorId = linkedTaskSummary?.state === 'open' ? linkedTaskSummary.advisorId : null;
                    const goalKey = `${sectionKey}-${index}`;

                    return (
                  <GoalRow
                    key={goal.id}
                    goalKey={goalKey}
                    sectionKey={sectionKey}
                    index={index}
                    text={goal.text}
                    completed={goal.completed}
                    source={goal.source}
                    linkedTaskSummary={linkedTaskSummary}
                    advisorId={getAdvisorChoice(goalKey, lockedAdvisorId)}
                    advisorLocked={lockedAdvisorId !== null}
                    onAdvisorChange={advisorId => setAdvisorChoice(goalKey, advisorId)}
                    onTextChange={text => dispatch({
                      type: 'SET_STRATEGIC_GOAL_SLOT',
                      payload: { year: planningYear, sectionKey, index, text },
                    })}
                    onToggleComplete={() => dispatch({
                      type: 'TOGGLE_STRATEGIC_GOAL_COMPLETED',
                      payload: { year: planningYear, sectionKey, index },
                    })}
                    onQueue={() => promoteGoal(sectionKey, index, getAdvisorChoice(goalKey, lockedAdvisorId), false)}
                    onFocus={() => promoteGoal(sectionKey, index, getAdvisorChoice(goalKey, lockedAdvisorId), true)}
                    onSetLinkedTaskBucket={bucket => {
                      if (linkedTaskSummary) {
                        setLinkedTaskBucket(linkedTaskSummary, bucket);
                      }
                    }}
                    onClearLinkedTaskBucket={() => {
                      if (linkedTaskSummary) {
                        clearLinkedTaskBucket(linkedTaskSummary);
                      }
                    }}
                    onToggleLinkedTaskFocus={() => {
                      if (linkedTaskSummary) {
                        toggleLinkedTaskFocus(linkedTaskSummary);
                      }
                    }}
                  />
                    );
                  })()
                ))}
              </div>
            </SectionCard>
          ))}

          <SectionCard
            sectionKey="wins"
            title="Wins and evidence"
            description="Keep recent wins visible so the weekly plan is grounded in momentum, not only pressure."
          >
            <div className="space-y-5">
              <WinList
                label="Current wins"
                values={strategicYear.currentWins}
                onChange={(index, value) => dispatch({
                  type: 'SET_STRATEGIC_WIN',
                  payload: { year: planningYear, field: 'currentWins', index, value },
                })}
              />
              <WinList
                label="Previous wins"
                values={strategicYear.previousWins}
                onChange={(index, value) => dispatch({
                  type: 'SET_STRATEGIC_WIN',
                  payload: { year: planningYear, field: 'previousWins', index, value },
                })}
              />
            </div>
          </SectionCard>
        </div>
      </div>
    </section>
  );
}

interface GoalLinkedTaskSummary {
  state: 'open' | 'completed' | 'missing';
  advisorId: AdvisorId;
  taskId: string;
  advisorName: string;
  planningBucket: TaskPlanningBucket | null;
  inWeeklyFocus: boolean;
  status: TaskStatus | null;
}

function InsightCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white/80 p-4 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">{title}</h3>
      <div className="mt-3 space-y-2">
        {items.length > 0 ? items.slice(0, 3).map(item => (
          <p key={item} className="text-sm text-stone-800">
            • {item}
          </p>
        )) : (
          <p className="text-sm text-stone-500">No data yet.</p>
        )}
      </div>
    </div>
  );
}

function SectionCard({
  sectionKey,
  title,
  description,
  children,
}: {
  sectionKey: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm"
      data-section={sectionKey}
    >
      <h3 className="text-lg font-semibold text-stone-900">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-stone-600">{description}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function GoalRow({
  goalKey,
  sectionKey,
  index,
  text,
  completed,
  source,
  linkedTaskSummary,
  advisorId,
  advisorLocked,
  onAdvisorChange,
  onTextChange,
  onToggleComplete,
  onQueue,
  onFocus,
  onSetLinkedTaskBucket,
  onClearLinkedTaskBucket,
  onToggleLinkedTaskFocus,
}: {
  goalKey: string;
  sectionKey: StrategicDashboardSectionKey;
  index: number;
  text: string;
  completed: boolean;
  source: 'manual' | 'compass';
  linkedTaskSummary: GoalLinkedTaskSummary | null;
  advisorId: AdvisorId;
  advisorLocked: boolean;
  onAdvisorChange: (advisorId: AdvisorId) => void;
  onTextChange: (text: string) => void;
  onToggleComplete: () => void;
  onQueue: () => void;
  onFocus: () => void;
  onSetLinkedTaskBucket: (bucket: TaskPlanningBucket) => void;
  onClearLinkedTaskBucket: () => void;
  onToggleLinkedTaskFocus: () => void;
}) {
  const reusableLinkedTask = linkedTaskSummary?.state === 'open';

  return (
    <div className="rounded-3xl border border-stone-200 bg-stone-50/70 p-4" data-goal-key={goalKey}>
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onToggleComplete}
          className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition ${
            completed
              ? 'border-emerald-500 bg-emerald-500 text-white'
              : 'border-stone-300 bg-white text-stone-400'
          }`}
          aria-label={`Toggle ${goalKey} completed`}
        >
          {completed ? '✓' : ''}
        </button>
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              {sectionKey} {index + 1}
            </p>
            {source === 'compass' && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-800">
                Seeded from Compass
              </span>
            )}
          </div>
          <input
            value={text}
            onChange={event => onTextChange(event.target.value)}
            placeholder="Write the goal in concrete language"
            className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 shadow-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
          />
          {linkedTaskSummary && (
            <div className="rounded-2xl border border-stone-200 bg-white/85 px-4 py-3 text-sm text-stone-700">
              <p className="font-medium text-stone-900">{getGoalLinkLabel(linkedTaskSummary)}</p>
              <p className="mt-1 text-xs leading-5 text-stone-500">{getGoalLinkHint(linkedTaskSummary)}</p>
              {reusableLinkedTask ? (
                <div className="mt-3 space-y-2 border-t border-stone-200 pt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Linked Task Controls
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {LINKED_TASK_BUCKET_OPTIONS.map(option => {
                      const isActive = option.value === 'unplanned'
                        ? linkedTaskSummary.planningBucket === null
                        : linkedTaskSummary.planningBucket === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          aria-pressed={isActive}
                          onClick={() => {
                            if (option.value === 'unplanned') {
                              onClearLinkedTaskBucket();
                              return;
                            }

                            onSetLinkedTaskBucket(option.value);
                          }}
                          className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition ${
                            isActive
                              ? 'border-stone-900 bg-stone-900 text-white'
                              : 'border-stone-300 bg-white text-stone-600 hover:border-stone-500'
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      aria-pressed={linkedTaskSummary.inWeeklyFocus}
                      onClick={onToggleLinkedTaskFocus}
                      className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition ${
                        linkedTaskSummary.inWeeklyFocus
                          ? 'border-amber-500 bg-amber-100 text-amber-900'
                          : 'border-amber-300 bg-amber-50 text-amber-800 hover:border-amber-500'
                      }`}
                    >
                      {linkedTaskSummary.inWeeklyFocus ? 'Remove Focus' : 'Add Focus'}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={advisorId}
              disabled={advisorLocked}
              onChange={event => onAdvisorChange(event.target.value as AdvisorId)}
              className="rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-700 shadow-sm outline-none transition focus:border-amber-500"
            >
              {ACTIVE_ADVISOR_IDS.map(id => (
                <option key={id} value={id}>
                  {ADVISOR_CONFIGS[id].shortName}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onQueue}
              disabled={!text.trim()}
              className="rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-700 transition hover:border-stone-500 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {reusableLinkedTask ? 'Update linked task' : 'Queue as task'}
            </button>
            <button
              type="button"
              onClick={onFocus}
              disabled={!text.trim()}
              className="rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              {reusableLinkedTask ? 'Sync to weekly focus' : 'Add to weekly focus'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getGoalLinkLabel(summary: GoalLinkedTaskSummary): string {
  if (summary.state === 'missing') {
    return `Linked task is missing from ${summary.advisorName}.`;
  }

  if (summary.state === 'completed') {
    return `Linked task in ${summary.advisorName} is ${summary.status ?? 'completed'}.`;
  }

  const location = summary.inWeeklyFocus
    ? 'In weekly focus'
    : summary.planningBucket
      ? `${formatPlanningBucket(summary.planningBucket)} queue`
      : 'Open but unplanned';

  return `Linked task: ${summary.advisorName} • ${location}`;
}

function getGoalLinkHint(summary: GoalLinkedTaskSummary): string {
  if (summary.state === 'missing') {
    return 'Promote again to create a fresh canonical task and restore the link.';
  }

  if (summary.state === 'completed') {
    return 'Promote again to create a fresh task if this goal needs another execution pass.';
  }

  return 'Further promotions will update this same canonical task instead of creating a duplicate.';
}

function formatPlanningBucket(bucket: TaskPlanningBucket): string {
  switch (bucket) {
    case 'today':
      return 'Today';
    case 'this_week':
      return 'This week';
    case 'later':
      return 'Later';
  }
}

function WinList({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (index: number, value: string) => void;
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-stone-700">{label}</h4>
      <div className="mt-3 space-y-3">
        {values.map((value, index) => (
          <input
            key={`${label}-${index}`}
            value={value}
            onChange={event => onChange(index, event.target.value)}
            placeholder={`Capture ${label.toLowerCase()} ${index + 1}`}
            className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 shadow-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
          />
        ))}
      </div>
    </div>
  );
}
