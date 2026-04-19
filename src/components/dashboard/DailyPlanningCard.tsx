import type {
  DailyPlanningActionGroup,
  DailyPlanningSummary,
  EnrichedTaskItem,
} from '../../state/selectors';
import type { TaskListPreset } from '../../types/dashboard-navigation';
import type { TaskPlanningBucket } from '../../types/task-planning';
import { formatDate, formatDateKey, formatDaysAgo } from '../../utils/date';
import { useBufferedCommit } from '../../hooks/use-buffered-commit';
import { getTaskWeeklyLabRoute } from './weekly-lab-routing';

interface DailyPlanningCardProps {
  summary: DailyPlanningSummary;
  focusTaskKeys: Set<string>;
  onCompleteDailyPlan: (date: string) => void;
  onSetDailyPlanningField: (
    date: string,
    field: 'headline' | 'guardrail',
    value: string,
  ) => void;
  onSetPlanBucket: (advisorId: string, taskId: string, bucket: TaskPlanningBucket) => void;
  onClearPlanBucket: (advisorId: string, taskId: string) => void;
  onScheduleTask: (item: EnrichedTaskItem) => void;
  onOpenAdvisorLane?: (advisorId: string, preset: TaskListPreset) => void;
  schedulingEnabled: boolean;
}

export function DailyPlanningCard({
  summary,
  focusTaskKeys,
  onCompleteDailyPlan,
  onSetDailyPlanningField,
  onSetPlanBucket,
  onClearPlanBucket,
  onScheduleTask,
  onOpenAdvisorLane,
  schedulingEnabled,
}: DailyPlanningCardProps) {
  const insights = [
    summary.counts.carryOver > 0
      ? `${summary.counts.carryOver} task${summary.counts.carryOver === 1 ? '' : 's'} still carried over in Today`
      : null,
    summary.counts.focusOutsideToday > 0
      ? `${summary.counts.focusOutsideToday} focus item${summary.counts.focusOutsideToday === 1 ? '' : 's'} still not committed to Today`
      : null,
    summary.counts.pullInCandidates > 0
      ? `${summary.counts.pullInCandidates} strong candidate${summary.counts.pullInCandidates === 1 ? '' : 's'} available to pull into Today`
      : null,
  ].filter(Boolean) as string[];

  return (
    <section className="lab-panel mb-6 rounded-[1.75rem] border-[rgba(228,209,174,0.16)] bg-[radial-gradient(circle_at_top,_rgba(228,209,174,0.08),_rgba(19,28,38,0.96)_58%)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="lab-eyebrow text-[0.68rem]">Daily Plan</h3>
            <span
              className={`lab-chip ${
                summary.completedToday
                  ? 'lab-chip--teal'
                  : 'lab-chip--blue'
              }`}
            >
              {summary.completedToday ? 'Planned' : 'Needs plan'}
            </span>
          </div>
          <p className="lab-note mt-1">{formatDate(summary.date)}</p>
          <p className="lab-copy mt-2 max-w-2xl text-sm">
            Start the day with one intentional sweep: protect what belongs in Today, demote stale carry-over, and pull in only the work that genuinely matters now.
          </p>
        </div>

        <button
          onClick={() => onCompleteDailyPlan(summary.date)}
          disabled={summary.completedToday}
          className={`lab-button ${summary.completedToday ? 'lab-button--ghost' : 'lab-button--gold'}`}
        >
          {summary.completedToday ? 'Plan complete' : 'Mark daily plan done'}
        </button>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        <PlanningStat label="Today" value={summary.counts.today} tone="primary" />
        <PlanningStat label="Carry Over" value={summary.counts.carryOver} tone={summary.counts.carryOver > 0 ? 'attention' : 'neutral'} />
        <PlanningStat label="Focus Gaps" value={summary.counts.focusOutsideToday} tone={summary.counts.focusOutsideToday > 0 ? 'attention' : 'neutral'} />
        <PlanningStat label="Overdue" value={summary.counts.overdueOpen} tone={summary.counts.overdueOpen > 0 ? 'attention' : 'neutral'} />
        <PlanningStat label="Pull In" value={summary.counts.pullInCandidates} tone={summary.counts.pullInCandidates > 0 ? 'primary' : 'neutral'} />
      </div>

      <div className="lab-subpanel mt-4 p-3">
        {insights.length > 0 ? (
          <div className="space-y-1.5">
            {insights.map(insight => (
              <p key={insight} className="text-sm text-[color:var(--lab-text)]">
                {insight}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[color:var(--lab-success)]">
            Today already looks constrained. Protect execution instead of re-triaging the queue.
          </p>
        )}

        {summary.completedToday && summary.completedAt && (
          <p className="lab-meta mt-3">
            Completed {new Date(summary.completedAt).toLocaleString()}.
          </p>
        )}
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="lab-subpanel p-4">
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-[color:var(--lab-text)]">Today&apos;s Intent</h4>
            <p className="lab-meta mt-1">
              Keep the daily plan brief enough that it reinforces action instead of becoming another journaling step.
            </p>
          </div>

          <div className="space-y-3">
            <PlanningField
              label="Headline"
              placeholder="What has to matter today?"
              value={summary.entry.headline}
              onChange={value => onSetDailyPlanningField(summary.date, 'headline', value)}
            />
            <PlanningField
              label="Guardrail"
              placeholder="What could derail the day if you do not name it now?"
              value={summary.entry.guardrail}
              onChange={value => onSetDailyPlanningField(summary.date, 'guardrail', value)}
            />
          </div>
        </section>

        <section className="lab-subpanel p-4">
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-[color:var(--lab-text)]">Previous Daily Plan</h4>
            <p className="lab-meta mt-1">
              Look at the last intentional daily sweep before you blindly carry it forward.
            </p>
          </div>

          {summary.previousEntry ? (
            <div className="space-y-3">
              <div className="lab-subpanel lab-subpanel--soft p-3">
                <p className="text-xs uppercase tracking-wide text-[color:var(--lab-text-dim)]">
                  {formatDate(summary.previousEntry.date)} · {formatDaysAgo(summary.previousEntry.date)}
                </p>
                {summary.previousEntry.completedAt && (
                  <p className="lab-meta mt-1">
                    Planned {new Date(summary.previousEntry.completedAt).toLocaleString()}.
                  </p>
                )}
              </div>
              <PreviousPlanningBlock label="Headline" value={summary.previousEntry.headline} />
              <PreviousPlanningBlock label="Guardrail" value={summary.previousEntry.guardrail} />
            </div>
          ) : (
            <div className="lab-empty-state px-3 py-6 text-center text-xs">
              No previous daily plan captured yet.
            </div>
          )}
        </section>
      </div>

      {summary.actionGroups.length > 0 && (
        <div className="mt-4 grid gap-3 xl:grid-cols-3">
          {summary.actionGroups.map(group => (
            <section
              key={group.id}
              className="lab-subpanel p-3"
            >
              <div className="mb-3">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-sm font-semibold text-[color:var(--lab-text)]">{group.title}</h4>
                  <span className="lab-chip lab-chip--neutral">
                    {group.items.length + group.remainingCount}
                  </span>
                </div>
                <p className="lab-meta mt-1">{group.description}</p>
              </div>

              <div className="space-y-3">
                {group.items.map(item => (
                  <DailyPlanningActionCard
                    key={`${group.id}:${item.advisorId}:${item.id}`}
                    group={group}
                    item={item}
                    isInWeeklyFocus={focusTaskKeys.has(`${item.advisorId}:${item.id}`)}
                    onSetPlanBucket={onSetPlanBucket}
                    onClearPlanBucket={onClearPlanBucket}
                    onScheduleTask={onScheduleTask}
                    onOpenAdvisorLane={onOpenAdvisorLane}
                    currentDate={summary.date}
                    schedulingEnabled={schedulingEnabled}
                  />
                ))}
              </div>

              {group.remainingCount > 0 && (
                <p className="lab-meta mt-3">
                  {group.remainingCount} more task{group.remainingCount === 1 ? '' : 's'} in this lane.
                </p>
              )}
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

function PlanningStat({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: number;
  tone?: 'neutral' | 'primary' | 'attention';
}) {
  const toneClasses =
    tone === 'primary'
      ? 'border-[rgba(92,138,214,0.28)] bg-[rgba(92,138,214,0.12)] text-[#c2d6ff]'
      : tone === 'attention'
        ? 'border-[rgba(228,209,174,0.28)] bg-[rgba(228,209,174,0.1)] text-[color:var(--lab-gold)]'
        : 'border-[color:var(--lab-border-muted)] bg-[rgba(8,11,17,0.9)] text-[color:var(--lab-text)]';

  return (
    <div className={`rounded-lg border px-3 py-2 ${toneClasses}`}>
      <p className="text-[11px] uppercase tracking-wide text-[color:var(--lab-text-dim)]">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function PlanningField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const { draftValue, setDraftValue, flush } = useBufferedCommit<string>({
    value,
    onCommit: nextValue => {
      if (nextValue !== value) {
        onChange(nextValue);
      }

      return nextValue;
    },
  });

  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-[color:var(--lab-text-dim)]">{label}</span>
      <textarea
        aria-label={label}
        value={draftValue}
        onChange={event => setDraftValue(event.target.value)}
        onBlur={() => {
          void flush();
        }}
        placeholder={placeholder}
        rows={3}
        className="lab-textarea mt-1 w-full rounded-lg px-3 py-2 text-sm"
      />
    </label>
  );
}

function PreviousPlanningBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="lab-subpanel lab-subpanel--soft p-3">
      <p className="text-xs uppercase tracking-wide text-[color:var(--lab-text-dim)]">{label}</p>
      <p className="mt-2 text-sm text-[color:var(--lab-text-muted)]">
        {value.trim().length > 0 ? value : 'No note captured.'}
      </p>
    </div>
  );
}

function DailyPlanningActionCard({
  group,
  item,
  isInWeeklyFocus,
  onSetPlanBucket,
  onClearPlanBucket,
  onScheduleTask,
  onOpenAdvisorLane,
  currentDate,
  schedulingEnabled,
}: {
  group: DailyPlanningActionGroup;
  item: EnrichedTaskItem;
  isInWeeklyFocus: boolean;
  onSetPlanBucket: (advisorId: string, taskId: string, bucket: TaskPlanningBucket) => void;
  onClearPlanBucket: (advisorId: string, taskId: string) => void;
  onScheduleTask: (item: EnrichedTaskItem) => void;
  onOpenAdvisorLane?: (advisorId: string, preset: TaskListPreset) => void;
  currentDate: string;
  schedulingEnabled: boolean;
}) {
  const weeklyLabRoute = getTaskWeeklyLabRoute({
    status: item.status,
    planningBucket: item.planningBucket,
    isCarryOver: group.id === 'carry_over',
    isInWeeklyFocus,
    dueDate: item.dueDate,
    currentDate,
  });

  return (
    <article className="lab-subpanel lab-subpanel--soft p-3">
      <p className="text-sm text-[color:var(--lab-text)]">{item.task}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span
          className="rounded-full px-2 py-0.5 text-xs"
          style={{ backgroundColor: `${item.advisorColor}20`, color: item.advisorColor }}
        >
          {item.advisorIcon} {item.advisorName}
        </span>
        <span
          className={`rounded px-1.5 py-0.5 text-xs ${
            item.priority === 'high'
              ? 'bg-[rgba(230,123,123,0.14)] text-[color:var(--lab-danger)]'
              : item.priority === 'medium'
                ? 'bg-[rgba(228,209,174,0.14)] text-[color:var(--lab-gold)]'
                : 'bg-[rgba(39,50,64,0.9)] text-[color:var(--lab-text-muted)]'
          }`}
        >
          {item.priority}
        </span>
        <span className="text-xs text-[color:var(--lab-text-dim)]">
          {item.dueDate === 'ongoing' ? 'ongoing' : `due ${item.dueDate}`}
        </span>
        {isInWeeklyFocus && (
          <span className="lab-chip lab-chip--blue">
            in focus
          </span>
        )}
      </div>

      {group.id === 'carry_over' && item.planningUpdatedAt && (
        <p className="lab-meta mt-2">
          Added to Today {formatDaysAgo(formatDateKey(new Date(item.planningUpdatedAt)))}.
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        <PlanButton
          active={item.planningBucket === 'today'}
          label="Today"
          onClick={() => onSetPlanBucket(item.advisorId, item.id, 'today')}
        />
        <PlanButton
          active={item.planningBucket === 'this_week'}
          label="This Week"
          onClick={() => onSetPlanBucket(item.advisorId, item.id, 'this_week')}
        />
        <PlanButton
          active={item.planningBucket === 'later'}
          label="Later"
          onClick={() => onSetPlanBucket(item.advisorId, item.id, 'later')}
        />
        {item.planningBucket && (
          <button
            onClick={() => onClearPlanBucket(item.advisorId, item.id)}
            className="lab-action"
          >
            Clear
          </button>
        )}
        {weeklyLabRoute && onOpenAdvisorLane && (
          <button
            type="button"
            onClick={() => onOpenAdvisorLane(item.advisorId, weeklyLabRoute.preset)}
            className="lab-action lab-action--blue"
          >
            {`Open ${weeklyLabRoute.label} in Weekly LAB`}
          </button>
        )}
        {schedulingEnabled && (
          <button
            onClick={() => onScheduleTask(item)}
            className="lab-action lab-action--blue"
          >
            Schedule
          </button>
        )}
      </div>
    </article>
  );
}

function PlanButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="lab-action"
      data-active={active}
    >
      {label}
    </button>
  );
}
