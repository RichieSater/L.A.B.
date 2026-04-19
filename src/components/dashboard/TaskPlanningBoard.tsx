import type { EnrichedTaskItem, TaskPlanningLane } from '../../state/selectors';
import type { TaskPlanningBucket } from '../../types/task-planning';

interface TaskPlanningBoardProps {
  lanes: TaskPlanningLane[];
  unplanned: EnrichedTaskItem[];
  focusTaskKeys: Set<string>;
  onAddFocusTask: (advisorId: string, taskId: string) => void;
  onRemoveFocusTask: (advisorId: string, taskId: string) => void;
  onSetPlanBucket: (advisorId: string, taskId: string, bucket: TaskPlanningBucket) => void;
  onClearPlanBucket: (advisorId: string, taskId: string) => void;
  onScheduleTask: (item: EnrichedTaskItem) => void;
  schedulingEnabled: boolean;
}

export function TaskPlanningBoard({
  lanes,
  unplanned,
  focusTaskKeys,
  onAddFocusTask,
  onRemoveFocusTask,
  onSetPlanBucket,
  onClearPlanBucket,
  onScheduleTask,
  schedulingEnabled,
}: TaskPlanningBoardProps) {
  const unplannedPreview = unplanned.slice(0, 6);
  const remainingUnplanned = Math.max(unplanned.length - unplannedPreview.length, 0);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h3 className="lab-eyebrow text-[0.68rem]">Planning Queue</h3>
          <p className="lab-meta mt-1">
            Decide what deserves attention before you commit calendar time.
          </p>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-4">
        {lanes.map(lane => (
          <section key={lane.bucket} className="lab-panel lab-panel--ink rounded-xl p-4">
            <div className="mb-3">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold text-[color:var(--lab-text)]">{lane.label}</h4>
                <span className="lab-chip lab-chip--neutral">
                  {lane.items.length}
                </span>
              </div>
              <p className="lab-meta mt-1">{lane.description}</p>
            </div>

            {lane.items.length === 0 ? (
              <div className="lab-empty-state px-3 py-6 text-center text-xs">
                No tasks parked here yet.
              </div>
            ) : (
              <div className="space-y-3">
                {lane.items.map(item => (
                  <TaskPlanningCard
                    key={`${item.advisorId}-${item.id}`}
                    item={item}
                    activeBucket={lane.bucket}
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
            )}
          </section>
        ))}

        <section className="lab-panel lab-panel--ink rounded-xl p-4">
          <div className="mb-3">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold text-[color:var(--lab-text)]">Needs Triage</h4>
              <span className="lab-chip lab-chip--neutral">
                {unplanned.length}
              </span>
            </div>
            <p className="lab-meta mt-1">
              Open tasks without a planning home yet. Promote the most relevant ones into your queue.
            </p>
          </div>

          {unplannedPreview.length === 0 ? (
            <div className="lab-empty-state px-3 py-6 text-center text-xs">
              Every open task already has a queue bucket.
            </div>
          ) : (
            <div className="space-y-3">
              {unplannedPreview.map(item => (
                <TaskPlanningCard
                  key={`${item.advisorId}-${item.id}`}
                  item={item}
                  activeBucket={null}
                  isInWeeklyFocus={focusTaskKeys.has(`${item.advisorId}:${item.id}`)}
                  onAddFocusTask={onAddFocusTask}
                  onRemoveFocusTask={onRemoveFocusTask}
                  onSetPlanBucket={onSetPlanBucket}
                  onClearPlanBucket={onClearPlanBucket}
                  onScheduleTask={onScheduleTask}
                  schedulingEnabled={schedulingEnabled}
                  showClearAction={false}
                />
              ))}
              {remainingUnplanned > 0 && (
                <p className="lab-meta">
                  {remainingUnplanned} more unplanned task{remainingUnplanned === 1 ? '' : 's'} still in the backlog.
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function TaskPlanningCard({
  item,
  activeBucket,
  isInWeeklyFocus,
  onAddFocusTask,
  onRemoveFocusTask,
  onSetPlanBucket,
  onClearPlanBucket,
  onScheduleTask,
  schedulingEnabled,
  showClearAction = true,
}: {
  item: EnrichedTaskItem;
  activeBucket: TaskPlanningBucket | null;
  isInWeeklyFocus: boolean;
  onAddFocusTask: (advisorId: string, taskId: string) => void;
  onRemoveFocusTask: (advisorId: string, taskId: string) => void;
  onSetPlanBucket: (advisorId: string, taskId: string, bucket: TaskPlanningBucket) => void;
  onClearPlanBucket: (advisorId: string, taskId: string) => void;
  onScheduleTask: (item: EnrichedTaskItem) => void;
  schedulingEnabled: boolean;
  showClearAction?: boolean;
}) {
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
            Focus
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <PlanButton
          active={activeBucket === 'today'}
          label="Today"
          onClick={() => onSetPlanBucket(item.advisorId, item.id, 'today')}
        />
        <PlanButton
          active={activeBucket === 'this_week'}
          label="This Week"
          onClick={() => onSetPlanBucket(item.advisorId, item.id, 'this_week')}
        />
        <PlanButton
          active={activeBucket === 'later'}
          label="Later"
          onClick={() => onSetPlanBucket(item.advisorId, item.id, 'later')}
        />
        <button
          onClick={() =>
            isInWeeklyFocus
              ? onRemoveFocusTask(item.advisorId, item.id)
              : onAddFocusTask(item.advisorId, item.id)
          }
          className={`lab-action ${isInWeeklyFocus ? 'lab-action--blue' : ''}`}
          data-active={isInWeeklyFocus}
        >
          {isInWeeklyFocus ? 'Focused' : 'Focus'}
        </button>
        {showClearAction && (
          <button
            onClick={() => onClearPlanBucket(item.advisorId, item.id)}
            className="lab-action"
          >
            Remove
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
