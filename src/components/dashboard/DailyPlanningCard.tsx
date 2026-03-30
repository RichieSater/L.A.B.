import type {
  DailyPlanningActionGroup,
  DailyPlanningSummary,
  EnrichedTaskItem,
} from '../../state/selectors';
import type { TaskPlanningBucket } from '../../types/task-planning';
import { formatDate, formatDateKey, formatDaysAgo } from '../../utils/date';

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
    <section className="mb-6 rounded-xl border border-gray-800 bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-300">Daily Plan</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] ${
                summary.completedToday
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : 'bg-sky-500/15 text-sky-300'
              }`}
            >
              {summary.completedToday ? 'Planned' : 'Needs plan'}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-400">{formatDate(summary.date)}</p>
          <p className="mt-2 max-w-2xl text-sm text-gray-500">
            Start the day with one intentional sweep: protect what belongs in Today, demote stale carry-over, and pull in only the work that genuinely matters now.
          </p>
        </div>

        <button
          onClick={() => onCompleteDailyPlan(summary.date)}
          disabled={summary.completedToday}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            summary.completedToday
              ? 'cursor-default bg-gray-800 text-gray-500'
              : 'bg-gray-200 text-gray-900 hover:bg-white'
          }`}
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

      <div className="mt-4 rounded-lg border border-gray-800 bg-gray-950/70 p-3">
        {insights.length > 0 ? (
          <div className="space-y-1.5">
            {insights.map(insight => (
              <p key={insight} className="text-sm text-gray-300">
                {insight}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-sm text-emerald-300">
            Today already looks constrained. Protect execution instead of re-triaging the queue.
          </p>
        )}

        {summary.completedToday && summary.completedAt && (
          <p className="mt-3 text-xs text-gray-500">
            Completed {new Date(summary.completedAt).toLocaleString()}.
          </p>
        )}
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-lg border border-gray-800 bg-gray-950/80 p-4">
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-gray-200">Today&apos;s Intent</h4>
            <p className="mt-1 text-xs text-gray-500">
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

        <section className="rounded-lg border border-gray-800 bg-gray-950/80 p-4">
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-gray-200">Previous Daily Plan</h4>
            <p className="mt-1 text-xs text-gray-500">
              Look at the last intentional daily sweep before you blindly carry it forward.
            </p>
          </div>

          {summary.previousEntry ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-gray-800 bg-gray-900/70 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  {formatDate(summary.previousEntry.date)} · {formatDaysAgo(summary.previousEntry.date)}
                </p>
                {summary.previousEntry.completedAt && (
                  <p className="mt-1 text-xs text-gray-600">
                    Planned {new Date(summary.previousEntry.completedAt).toLocaleString()}.
                  </p>
                )}
              </div>
              <PreviousPlanningBlock label="Headline" value={summary.previousEntry.headline} />
              <PreviousPlanningBlock label="Guardrail" value={summary.previousEntry.guardrail} />
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-800 px-3 py-6 text-center text-xs text-gray-600">
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
              className="rounded-lg border border-gray-800 bg-gray-950/80 p-3"
            >
              <div className="mb-3">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-sm font-semibold text-gray-200">{group.title}</h4>
                  <span className="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
                    {group.items.length + group.remainingCount}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">{group.description}</p>
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
                    schedulingEnabled={schedulingEnabled}
                  />
                ))}
              </div>

              {group.remainingCount > 0 && (
                <p className="mt-3 text-xs text-gray-500">
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
      ? 'border-sky-500/30 bg-sky-500/10 text-sky-200'
      : tone === 'attention'
        ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
        : 'border-gray-800 bg-gray-950 text-gray-100';

  return (
    <div className={`rounded-lg border px-3 py-2 ${toneClasses}`}>
      <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
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
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</span>
      <textarea
        aria-label={label}
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        rows={3}
        className="mt-1 w-full rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
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
    <div className="rounded-lg border border-gray-800 bg-gray-900/70 p-3">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 text-sm text-gray-300">
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
  schedulingEnabled,
}: {
  group: DailyPlanningActionGroup;
  item: EnrichedTaskItem;
  isInWeeklyFocus: boolean;
  onSetPlanBucket: (advisorId: string, taskId: string, bucket: TaskPlanningBucket) => void;
  onClearPlanBucket: (advisorId: string, taskId: string) => void;
  onScheduleTask: (item: EnrichedTaskItem) => void;
  schedulingEnabled: boolean;
}) {
  return (
    <article className="rounded-lg border border-gray-800 bg-gray-900/70 p-3">
      <p className="text-sm text-gray-100">{item.task}</p>
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
              ? 'bg-red-900/50 text-red-400'
              : item.priority === 'medium'
                ? 'bg-yellow-900/50 text-yellow-400'
                : 'bg-gray-800 text-gray-400'
          }`}
        >
          {item.priority}
        </span>
        <span className="text-xs text-gray-500">
          {item.dueDate === 'ongoing' ? 'ongoing' : `due ${item.dueDate}`}
        </span>
        {isInWeeklyFocus && (
          <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-xs text-blue-300">
            in focus
          </span>
        )}
      </div>

      {group.id === 'carry_over' && item.planningUpdatedAt && (
        <p className="mt-2 text-xs text-gray-500">
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
            className="rounded-md px-2 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300"
          >
            Clear
          </button>
        )}
        {schedulingEnabled && (
          <button
            onClick={() => onScheduleTask(item)}
            className="rounded-md bg-blue-600/15 px-2 py-1 text-xs text-blue-300 transition-colors hover:bg-blue-600/25"
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
      className={`rounded-md px-2 py-1 text-xs transition-colors ${
        active
          ? 'bg-gray-200 text-gray-900'
          : 'text-gray-500 hover:bg-gray-800 hover:text-gray-300'
      }`}
    >
      {label}
    </button>
  );
}
