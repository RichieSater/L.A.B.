import type { EnrichedTaskItem, WeeklyFocusSummary, WeeklyFocusTask } from '../../state/selectors';
import type { TaskListPreset } from '../../types/dashboard-navigation';
import type { TaskPlanningBucket } from '../../types/task-planning';
import { endOfWeek, formatDate } from '../../utils/date';
import { getItemWeeklyLabRoute } from './weekly-lab-routing';

interface WeeklyFocusCardProps {
  summary: WeeklyFocusSummary;
  onAddFocusTask: (
    advisorId: string,
    taskId: string,
    carriedForwardFromWeekStart?: string | null,
  ) => void;
  onRemoveFocusTask: (advisorId: string, taskId: string) => void;
  onSetPlanBucket: (advisorId: string, taskId: string, bucket: TaskPlanningBucket) => void;
  onScheduleTask: (item: EnrichedTaskItem) => void;
  onOpenAdvisorLane?: (advisorId: string, preset: TaskListPreset) => void;
  currentDate: string;
  schedulingEnabled: boolean;
}

export function WeeklyFocusCard({
  summary,
  onAddFocusTask,
  onRemoveFocusTask,
  onSetPlanBucket,
  onScheduleTask,
  onOpenAdvisorLane,
  currentDate,
  schedulingEnabled,
}: WeeklyFocusCardProps) {
  const canAddFocus = summary.remainingSlots > 0;

  return (
    <section className="lab-panel mb-6 rounded-[1.75rem] border-[rgba(228,209,174,0.14)] bg-[radial-gradient(circle_at_top,_rgba(228,209,174,0.06),_rgba(19,28,38,0.96)_58%)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="lab-eyebrow text-[0.68rem]">Weekly Focus</h3>
            <span className="lab-chip lab-chip--blue">
              {summary.items.length}/3 objectives
            </span>
          </div>
          <p className="lab-note mt-1">
            {formatDate(summary.weekStart)} to {formatDate(endOfWeek(summary.weekStart))}
          </p>
          <p className="lab-copy mt-2 max-w-2xl text-sm">
            Keep this week grounded in a few meaningful tasks. Focus items stay tied to the canonical advisor task so planning and scheduling still flow through the same system.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <FocusStat label="Focused" value={summary.items.length} />
          <FocusStat label="Open" value={summary.openCount} />
          <FocusStat label="Done" value={summary.completedCount} />
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr]">
        <section className="lab-subpanel p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-[color:var(--lab-text)]">Current Objectives</h4>
              <p className="lab-meta mt-1">
                {summary.items.length === 0
                  ? 'Pick one to three tasks that define a successful week.'
                  : summary.remainingSlots > 0
                    ? `${summary.remainingSlots} focus slot${summary.remainingSlots === 1 ? '' : 's'} still open.`
                    : 'Focus cap reached. Remove one to swap priorities.'}
              </p>
            </div>
          </div>

          {summary.items.length === 0 ? (
            <div className="lab-empty-state px-3 py-6 text-center text-xs">
              No focus tasks selected yet.
            </div>
          ) : (
            <div className="space-y-3">
              {summary.items.map(item => (
                <WeeklyFocusTaskCard
                  key={`${item.advisorId}:${item.id}`}
                  item={item}
                  onRemoveFocusTask={onRemoveFocusTask}
                  onSetPlanBucket={onSetPlanBucket}
                  onScheduleTask={onScheduleTask}
                  onOpenAdvisorLane={onOpenAdvisorLane}
                  currentDate={currentDate}
                  schedulingEnabled={schedulingEnabled}
                />
              ))}
            </div>
          )}
        </section>

        <section className="lab-subpanel p-4">
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-[color:var(--lab-text)]">Carry Forward</h4>
            <p className="lab-meta mt-1">
              {summary.previousWeekStart
                ? `Unfinished focus tasks from the week of ${formatDate(summary.previousWeekStart)}.`
                : 'Nothing to continue from a prior focus week yet.'}
            </p>
          </div>

          {summary.carryForwardCandidates.length === 0 ? (
            <div className="lab-empty-state px-3 py-6 text-center text-xs">
              No unfinished focus tasks waiting to be carried forward.
            </div>
          ) : (
            <div className="space-y-3">
              {summary.carryForwardCandidates.map(item => (
                <SuggestionCard
                  key={`carry:${item.advisorId}:${item.id}`}
                  item={item}
                  actionLabel="Carry into week"
                  disabled={!canAddFocus}
                  helper={item.carriedForwardFromWeekStart ? 'Previously carried forward once already.' : null}
                  onAction={() =>
                    onAddFocusTask(item.advisorId, item.id, summary.previousWeekStart)
                  }
                  onOpenAdvisorLane={onOpenAdvisorLane}
                  currentDate={currentDate}
                />
              ))}
            </div>
          )}
        </section>

        <section className="lab-subpanel p-4">
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-[color:var(--lab-text)]">Suggested Picks</h4>
            <p className="lab-meta mt-1">
              High-signal tasks pulled from overdue work, this-week queue items, and important unplanned backlog.
            </p>
          </div>

          {summary.suggestedTasks.length === 0 ? (
            <div className="lab-empty-state px-3 py-6 text-center text-xs">
              The queue is already well-covered by current focus.
            </div>
          ) : (
            <div className="space-y-3">
              {summary.suggestedTasks.map(item => (
                <SuggestionCard
                  key={`suggested:${item.advisorId}:${item.id}`}
                  item={item}
                  actionLabel="Add to focus"
                  disabled={!canAddFocus}
                  onAction={() => onAddFocusTask(item.advisorId, item.id)}
                  onOpenAdvisorLane={onOpenAdvisorLane}
                  currentDate={currentDate}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

function FocusStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="lab-stat">
      <p className="lab-stat__label">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[color:var(--lab-text)]">{value}</p>
    </div>
  );
}

function WeeklyFocusTaskCard({
  item,
  onRemoveFocusTask,
  onSetPlanBucket,
  onScheduleTask,
  onOpenAdvisorLane,
  currentDate,
  schedulingEnabled,
}: {
  item: WeeklyFocusTask;
  onRemoveFocusTask: (advisorId: string, taskId: string) => void;
  onSetPlanBucket: (advisorId: string, taskId: string, bucket: TaskPlanningBucket) => void;
  onScheduleTask: (item: EnrichedTaskItem) => void;
  onOpenAdvisorLane?: (advisorId: string, preset: TaskListPreset) => void;
  currentDate: string;
  schedulingEnabled: boolean;
}) {
  const weeklyLabRoute = getItemWeeklyLabRoute(item, currentDate, true);

  return (
    <article className="lab-subpanel lab-subpanel--soft p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-sm ${item.status === 'completed' ? 'text-[color:var(--lab-text-dim)] line-through' : 'text-[color:var(--lab-text)]'}`}>
            {item.task}
          </p>
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
            {item.carriedForwardFromWeekStart && (
              <span className="lab-chip lab-chip--gold">
                carried forward
              </span>
            )}
          </div>
        </div>

        <span
          className={`lab-chip ${
            item.status === 'completed'
              ? 'lab-chip--teal'
              : 'lab-chip--blue'
          }`}
        >
          {item.status === 'completed' ? 'done' : 'in focus'}
        </span>
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
          onClick={() => onRemoveFocusTask(item.advisorId, item.id)}
          className="lab-action"
        >
          Remove focus
        </button>
        {weeklyLabRoute && onOpenAdvisorLane && (
          <button
            type="button"
            onClick={() => onOpenAdvisorLane(item.advisorId, weeklyLabRoute.preset)}
            className="lab-action lab-action--blue"
          >
            {`Open ${weeklyLabRoute.label} in Weekly LAB`}
          </button>
        )}
        {schedulingEnabled && item.status === 'open' && (
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

function SuggestionCard({
  item,
  actionLabel,
  disabled,
  helper = null,
  onAction,
  onOpenAdvisorLane,
  currentDate,
}: {
  item: EnrichedTaskItem;
  actionLabel: string;
  disabled: boolean;
  helper?: string | null;
  onAction: () => void;
  onOpenAdvisorLane?: (advisorId: string, preset: TaskListPreset) => void;
  currentDate: string;
}) {
  const weeklyLabRoute = getItemWeeklyLabRoute(item, currentDate, false);

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
      </div>

      {helper && <p className="lab-meta mt-2">{helper}</p>}

      <div className="mt-3 flex flex-wrap gap-1.5">
        <button
          onClick={onAction}
          disabled={disabled}
          className={`lab-action ${disabled ? '' : ''}`}
          data-active={!disabled}
        >
          {actionLabel}
        </button>
        {weeklyLabRoute && onOpenAdvisorLane && (
          <button
            type="button"
            onClick={() => onOpenAdvisorLane(item.advisorId, weeklyLabRoute.preset)}
            className="lab-action lab-action--blue"
          >
            {`Open ${weeklyLabRoute.label} in Weekly LAB`}
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
