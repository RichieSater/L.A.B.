import type { AdvisorId } from '../../types/advisor';
import type { TaskListPreset } from '../../types/dashboard-navigation';
import type {
  AdvisorPlanningShortcut,
  EnrichedTaskItem,
  WeeklyReviewActionGroup,
  WeeklyReviewSummary,
} from '../../state/selectors';
import type { TaskPlanningBucket } from '../../types/task-planning';
import { formatDate, formatDaysAgo, formatDateKey } from '../../utils/date';

interface WeeklyReviewCardProps {
  summary: WeeklyReviewSummary;
  onCompleteReview: (weekStart: string) => void;
  onSetReviewField: (
    weekStart: string,
    field: 'biggestWin' | 'biggestLesson' | 'nextWeekNote',
    value: string,
  ) => void;
  onAddFocusTask: (advisorId: string, taskId: string) => void;
  onRemoveFocusTask: (advisorId: string, taskId: string) => void;
  focusTaskKeys: Set<string>;
  onSetPlanBucket: (advisorId: string, taskId: string, bucket: TaskPlanningBucket) => void;
  onClearPlanBucket: (advisorId: string, taskId: string) => void;
  onScheduleTask: (item: EnrichedTaskItem) => void;
  onOpenAdvisorLane: (advisorId: AdvisorId, preset: TaskListPreset) => void;
  schedulingEnabled: boolean;
}

export function WeeklyReviewCard({
  summary,
  onCompleteReview,
  onSetReviewField,
  onAddFocusTask,
  onRemoveFocusTask,
  focusTaskKeys,
  onSetPlanBucket,
  onClearPlanBucket,
  onScheduleTask,
  onOpenAdvisorLane,
  schedulingEnabled,
}: WeeklyReviewCardProps) {
  const insights = [
    summary.overduePlanned.length > 0
      ? `${summary.overduePlanned.length} planned task${summary.overduePlanned.length === 1 ? '' : 's'} already overdue`
      : null,
    summary.staleToday.length > 0
      ? `${summary.staleToday.length} task${summary.staleToday.length === 1 ? '' : 's'} carried over in Today`
      : null,
    summary.highPriorityUnplanned.length > 0
      ? `${summary.highPriorityUnplanned.length} high-priority task${summary.highPriorityUnplanned.length === 1 ? '' : 's'} still unplanned`
      : null,
  ].filter(Boolean) as string[];

  return (
    <section className="mb-6 rounded-xl border border-gray-800 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-300">Weekly Review</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] ${
                summary.completedThisWeek
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : 'bg-amber-500/15 text-amber-300'
              }`}
            >
              {summary.completedThisWeek ? 'Reviewed' : 'Needs review'}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-400">
            {formatDate(summary.weekStart)} to {formatDate(summary.weekEnd)}
          </p>
          <p className="mt-2 max-w-2xl text-sm text-gray-500">
            Sweep the queue before the week drifts: pull backlog into a bucket, clear stale Today items, and keep near-term work schedulable.
          </p>
        </div>

        <button
          onClick={() => onCompleteReview(summary.weekStart)}
          disabled={summary.completedThisWeek}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            summary.completedThisWeek
              ? 'cursor-default bg-gray-800 text-gray-500'
              : 'bg-gray-200 text-gray-900 hover:bg-white'
          }`}
        >
          {summary.completedThisWeek ? 'Review complete' : 'Mark review done'}
        </button>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        <ReviewStat label="Today" value={summary.counts.today} tone="primary" />
        <ReviewStat label="This Week" value={summary.counts.thisWeek} />
        <ReviewStat label="Later" value={summary.counts.later} />
        <ReviewStat label="Unplanned" value={summary.counts.unplanned} tone={summary.counts.unplanned > 0 ? 'attention' : 'neutral'} />
        <ReviewStat label="Overdue" value={summary.counts.overdueOpen} tone={summary.counts.overdueOpen > 0 ? 'attention' : 'neutral'} />
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
            Queue looks balanced right now. This is a good week to schedule from the `today` bucket instead of triaging backlog.
          </p>
        )}

        {summary.completedThisWeek && summary.completedAt && (
          <p className="mt-3 text-xs text-gray-500">
            Completed {new Date(summary.completedAt).toLocaleString()}.
          </p>
        )}
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-lg border border-gray-800 bg-gray-950/80 p-4">
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-gray-200">Momentum Snapshot</h4>
            <p className="mt-1 text-xs text-gray-500">
              Review actual weekly movement before you decide what deserves another slot next week.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
            <ReviewStat
              label="Completed"
              value={summary.momentum.completedTasks}
              tone={summary.momentum.completedTasks > 0 ? 'success' : 'neutral'}
            />
            <ReviewStat
              label="Focus Done"
              value={summary.momentum.completedFocusTasks}
              tone={summary.momentum.completedFocusTasks > 0 ? 'success' : 'neutral'}
            />
            <ReviewStat
              label="Sessions"
              value={summary.momentum.sessions}
              tone={summary.momentum.sessions > 0 ? 'primary' : 'neutral'}
            />
            <ReviewStat
              label="Log Days"
              value={summary.momentum.quickLogDays}
              tone={summary.momentum.quickLogDays > 0 ? 'primary' : 'attention'}
            />
            <ReviewStat
              label="Active Advisors"
              value={summary.momentum.activeAdvisors}
              tone={summary.momentum.activeAdvisors > 0 ? 'primary' : 'attention'}
            />
          </div>

          <div className="mt-4">
            <div className="mb-3">
              <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Recent Wins</h5>
              <p className="mt-1 text-xs text-gray-500">
                Concrete completed tasks from this week so the review does not collapse into pure cleanup.
              </p>
            </div>

            {summary.recentWins.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-800 px-3 py-6 text-center text-xs text-gray-600">
                No completed tasks captured for this week yet.
              </div>
            ) : (
              <div className="space-y-3">
                {summary.recentWins.map(item => (
                  <article
                    key={`win:${item.advisorId}:${item.id}`}
                    className="rounded-lg border border-emerald-500/10 bg-emerald-500/5 p-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
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
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">
                        done {formatDate(item.completedDate)}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-gray-800 bg-gray-950/80 p-4">
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-gray-200">Advisor Signals</h4>
            <p className="mt-1 text-xs text-gray-500">
              Balance next-week planning against which domains generated momentum and which still need attention.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {summary.advisorSnapshots.map(snapshot => (
              <AdvisorSnapshotCard
                key={snapshot.advisorId}
                advisorId={snapshot.advisorId}
                advisorName={snapshot.advisorName}
                advisorIcon={snapshot.advisorIcon}
                advisorColor={snapshot.advisorColor}
                completedTasks={snapshot.completedTasks}
                sessions={snapshot.sessions}
                quickLogs={snapshot.quickLogs}
                openTasks={snapshot.openTasks}
                plannedOpen={snapshot.plannedOpen}
                overdueOpen={snapshot.overdueOpen}
                status={snapshot.status}
                note={snapshot.note}
                recommendedPreset={snapshot.recommendedPreset}
                recommendedLabel={snapshot.recommendedLabel}
                recommendedCount={snapshot.recommendedCount}
                alternatePlanningShortcuts={snapshot.alternatePlanningShortcuts}
                onOpenAdvisorLane={onOpenAdvisorLane}
              />
            ))}
          </div>
        </section>
      </div>

      <section className="mt-4 rounded-lg border border-gray-800 bg-gray-950/80 p-4">
        <div className="mb-3">
          <h4 className="text-sm font-semibold text-gray-200">Weekly Recap</h4>
          <p className="mt-1 text-xs text-gray-500">
            A deterministic readout from this week&apos;s wins, advisor momentum, and unresolved planner pressure.
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-4">
          {summary.recapSections.map(section => (
            <RecapSectionCard key={section.id} summary={section} />
          ))}
        </div>
      </section>

      <div className="mt-4 grid gap-3 xl:grid-cols-[1.35fr_0.95fr]">
        <section className="rounded-lg border border-gray-800 bg-gray-950/80 p-4">
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-gray-200">Reflection</h4>
            <p className="mt-1 text-xs text-gray-500">
              Capture the signal from this week while the queue context is still fresh.
            </p>
          </div>

          <div className="space-y-3">
            <ReviewField
              label="Biggest win"
              placeholder="What meaningfully moved forward this week?"
              value={summary.entry.biggestWin}
              onChange={value => onSetReviewField(summary.weekStart, 'biggestWin', value)}
            />
            <ReviewField
              label="Lesson or friction"
              placeholder="What got in the way, or what should change next week?"
              value={summary.entry.biggestLesson}
              onChange={value => onSetReviewField(summary.weekStart, 'biggestLesson', value)}
            />
            <ReviewField
              label="Next week note"
              placeholder="What deserves extra attention when the next week starts?"
              value={summary.entry.nextWeekNote}
              onChange={value => onSetReviewField(summary.weekStart, 'nextWeekNote', value)}
            />
          </div>
        </section>

        <section className="rounded-lg border border-gray-800 bg-gray-950/80 p-4">
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-gray-200">Previous Review</h4>
            <p className="mt-1 text-xs text-gray-500">
              Keep continuity between weeks instead of starting each sweep from scratch.
            </p>
          </div>

          {summary.previousEntry ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-gray-800 bg-gray-900/70 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Week of {formatDate(summary.previousEntry.weekStart)}
                </p>
                {summary.previousEntry.completedAt && (
                  <p className="mt-1 text-xs text-gray-600">
                    Reviewed {new Date(summary.previousEntry.completedAt).toLocaleString()}.
                  </p>
                )}
              </div>
              <PreviousReviewBlock
                label="Biggest win"
                value={summary.previousEntry.biggestWin}
              />
              <PreviousReviewBlock
                label="Lesson or friction"
                value={summary.previousEntry.biggestLesson}
              />
              <PreviousReviewBlock
                label="Next week note"
                value={summary.previousEntry.nextWeekNote}
              />
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-800 px-3 py-6 text-center text-xs text-gray-600">
              No prior weekly review captured yet.
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
                  <ReviewActionCard
                    key={`${group.id}:${item.advisorId}:${item.id}`}
                    group={group}
                    item={item}
                    isInWeeklyFocus={focusTaskKeys.has(`${item.advisorId}:${item.id}`)}
                    onAddFocusTask={onAddFocusTask}
                    onRemoveFocusTask={onRemoveFocusTask}
                    onSetPlanBucket={onSetPlanBucket}
                    onClearPlanBucket={onClearPlanBucket}
                    onScheduleTask={onScheduleTask}
                    schedulingEnabled={schedulingEnabled}
                  />
                ))}
              </div>

              {group.remainingCount > 0 && (
                <p className="mt-3 text-xs text-gray-500">
                  {group.remainingCount} more task{group.remainingCount === 1 ? '' : 's'} in this review lane.
                </p>
              )}
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

function RecapSectionCard({
  summary,
}: {
  summary: WeeklyReviewSummary['recapSections'][number];
}) {
  const toneClasses = {
    success: 'border-emerald-500/15 bg-emerald-500/5',
    primary: 'border-sky-500/15 bg-sky-500/5',
    attention: 'border-amber-500/15 bg-amber-500/5',
    neutral: 'border-gray-800 bg-gray-900/70',
  } satisfies Record<WeeklyReviewSummary['recapSections'][number]['tone'], string>;

  return (
    <section className={`rounded-lg border p-3 ${toneClasses[summary.tone]}`}>
      <h5 className="text-sm font-semibold text-gray-100">{summary.title}</h5>
      <p className="mt-1 text-xs text-gray-500">{summary.description}</p>
      {summary.lines.length > 0 ? (
        <div className="mt-3 space-y-2">
          {summary.lines.map(line => (
            <p key={line} className="text-sm leading-6 text-gray-200">
              {line}
            </p>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-gray-500">{summary.emptyState}</p>
      )}
    </section>
  );
}

function ReviewField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</span>
      <textarea
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        rows={3}
        className="mt-2 w-full rounded-lg border border-gray-800 bg-gray-900/70 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600 focus:border-gray-600 focus:outline-none"
      />
    </label>
  );
}

function PreviousReviewBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/70 p-3">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 text-sm text-gray-300">
        {value.trim().length > 0 ? value : 'No note captured.'}
      </p>
    </div>
  );
}

function ReviewStat({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: number;
  tone?: 'primary' | 'neutral' | 'attention' | 'success';
}) {
  return (
    <div
      className={`rounded-lg border px-3 py-3 ${
        tone === 'primary'
          ? 'border-blue-500/20 bg-blue-500/10'
          : tone === 'success'
            ? 'border-emerald-500/20 bg-emerald-500/10'
          : tone === 'attention'
            ? 'border-amber-500/20 bg-amber-500/10'
            : 'border-gray-800 bg-gray-900/60'
      }`}
    >
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-gray-100">{value}</p>
    </div>
  );
}

function AdvisorSnapshotCard({
  advisorId,
  advisorName,
  advisorIcon,
  advisorColor,
  completedTasks,
  sessions,
  quickLogs,
  openTasks,
  plannedOpen,
  overdueOpen,
  status,
  note,
  recommendedPreset,
  recommendedLabel,
  recommendedCount,
  alternatePlanningShortcuts,
  onOpenAdvisorLane,
}: {
  advisorId: AdvisorId;
  advisorName: string;
  advisorIcon: string;
  advisorColor: string;
  completedTasks: number;
  sessions: number;
  quickLogs: number;
  openTasks: number;
  plannedOpen: number;
  overdueOpen: number;
  status: 'attention' | 'momentum' | 'quiet';
  note: string;
  recommendedPreset: TaskListPreset;
  recommendedLabel: string;
  recommendedCount: number;
  alternatePlanningShortcuts: AdvisorPlanningShortcut[];
  onOpenAdvisorLane: (advisorId: AdvisorId, preset: TaskListPreset) => void;
}) {
  const statusLabel =
    status === 'attention' ? 'Needs attention' : status === 'momentum' ? 'Momentum' : 'Quiet week';
  const statusClasses =
    status === 'attention'
      ? 'bg-amber-500/15 text-amber-300'
      : status === 'momentum'
        ? 'bg-emerald-500/15 text-emerald-300'
        : 'bg-gray-800 text-gray-400';

  return (
    <article className="rounded-lg border border-gray-800 bg-gray-900/70 p-3">
      <div className="flex items-start justify-between gap-3">
        <span
          className="rounded-full px-2 py-0.5 text-xs"
          style={{ backgroundColor: `${advisorColor}20`, color: advisorColor }}
        >
          {advisorIcon} {advisorName}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[11px] ${statusClasses}`}>{statusLabel}</span>
      </div>

      <p className="mt-3 text-xs text-gray-400">
        {completedTasks} completed • {sessions} sessions • {quickLogs} logs
      </p>
      <p className="mt-1 text-xs text-gray-500">
        {openTasks} open • {plannedOpen} planned • {overdueOpen} overdue
      </p>
      <p className="mt-3 text-sm text-gray-300">{note}</p>
      {openTasks > 0 && (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onOpenAdvisorLane(advisorId, recommendedPreset)}
              className="rounded-lg border border-blue-400/30 bg-blue-500/10 px-3 py-2 text-sm font-medium text-blue-100 transition-colors hover:border-blue-300/50 hover:text-white"
            >
              {getAdvisorSnapshotActionLabel(recommendedLabel, recommendedCount, recommendedPreset)}
            </button>
          </div>
          {alternatePlanningShortcuts.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Other scoped lanes
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {alternatePlanningShortcuts.map(shortcut => (
                  <button
                    key={`${advisorId}:${shortcut.preset}`}
                    type="button"
                    onClick={() => onOpenAdvisorLane(advisorId, shortcut.preset)}
                    className="rounded-lg border border-gray-700 bg-gray-950/70 px-3 py-2 text-xs font-medium text-gray-300 transition-colors hover:border-gray-600 hover:text-gray-100"
                  >
                    {shortcut.label} ({shortcut.count})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function getAdvisorSnapshotActionLabel(
  recommendedLabel: string,
  recommendedCount: number,
  recommendedPreset: TaskListPreset,
): string {
  if (recommendedPreset === 'all_open') {
    return `Open Tasks (${recommendedCount})`;
  }

  return `Open ${recommendedLabel} (${recommendedCount})`;
}

function ReviewActionCard({
  group,
  item,
  isInWeeklyFocus,
  onAddFocusTask,
  onRemoveFocusTask,
  onSetPlanBucket,
  onClearPlanBucket,
  onScheduleTask,
  schedulingEnabled,
}: {
  group: WeeklyReviewActionGroup;
  item: EnrichedTaskItem;
  isInWeeklyFocus: boolean;
  onAddFocusTask: (advisorId: string, taskId: string) => void;
  onRemoveFocusTask: (advisorId: string, taskId: string) => void;
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
        <span className="text-xs text-gray-500">{getReviewContext(group, item)}</span>
      </div>

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
        <button
          onClick={() =>
            isInWeeklyFocus
              ? onRemoveFocusTask(item.advisorId, item.id)
              : onAddFocusTask(item.advisorId, item.id)
          }
          className={`rounded-md px-2 py-1 text-xs transition-colors ${
            isInWeeklyFocus
              ? 'bg-blue-500/15 text-blue-300 hover:bg-blue-500/25'
              : 'text-gray-500 hover:bg-gray-800 hover:text-gray-300'
          }`}
        >
          {isInWeeklyFocus ? 'Focused' : 'Focus'}
        </button>
        {item.planningBucket && (
          <button
            onClick={() => onClearPlanBucket(item.advisorId, item.id)}
            className="rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
          >
            Remove
          </button>
        )}
        {schedulingEnabled && (
          <button
            onClick={() => onScheduleTask(item)}
            className="rounded-md bg-blue-600/15 px-2 py-1 text-xs text-blue-300 hover:bg-blue-600/25 transition-colors"
          >
            Schedule
          </button>
        )}
      </div>
    </article>
  );
}

function getReviewContext(group: WeeklyReviewActionGroup, item: EnrichedTaskItem): string {
  if (group.id === 'stale_today' && item.planningUpdatedAt) {
    return `In Today since ${formatDaysAgo(formatDateKey(new Date(item.planningUpdatedAt)))}`;
  }

  if (group.id === 'overdue_planned') {
    const bucketLabel =
      item.planningBucket === 'this_week'
        ? 'This Week'
        : item.planningBucket === 'later'
          ? 'Later'
          : 'Today';
    return item.dueDate === 'ongoing'
      ? `Queued in ${bucketLabel}`
      : `Due ${formatDate(item.dueDate)} in ${bucketLabel}`;
  }

  if (item.dueDate === 'ongoing') {
    return 'High priority, still unplanned';
  }

  return `Due ${formatDate(item.dueDate)}, still unplanned`;
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
