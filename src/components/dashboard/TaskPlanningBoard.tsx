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
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Planning Queue</h3>
          <p className="text-xs text-gray-500 mt-1">
            Decide what deserves attention before you commit calendar time.
          </p>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-4">
        {lanes.map(lane => (
          <section key={lane.bucket} className="rounded-xl border border-gray-800 bg-gray-950/70 p-4">
            <div className="mb-3">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold text-gray-200">{lane.label}</h4>
                <span className="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
                  {lane.items.length}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">{lane.description}</p>
            </div>

            {lane.items.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-800 px-3 py-6 text-center text-xs text-gray-600">
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

        <section className="rounded-xl border border-gray-800 bg-gray-950/70 p-4">
          <div className="mb-3">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold text-gray-200">Needs Triage</h4>
              <span className="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
                {unplanned.length}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Open tasks without a planning home yet. Promote the most relevant ones into your queue.
            </p>
          </div>

          {unplannedPreview.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-800 px-3 py-6 text-center text-xs text-gray-600">
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
                <p className="text-xs text-gray-500">
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
          className={`rounded-md px-2 py-1 text-xs transition-colors ${
            isInWeeklyFocus
              ? 'bg-blue-500/15 text-blue-300 hover:bg-blue-500/25'
              : 'text-gray-500 hover:bg-gray-800 hover:text-gray-300'
          }`}
        >
          {isInWeeklyFocus ? 'Focused' : 'Focus'}
        </button>
        {showClearAction && (
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
