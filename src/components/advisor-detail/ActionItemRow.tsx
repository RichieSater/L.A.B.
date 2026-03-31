import type { ActionItem } from '../../types/action-item';
import type { TaskListPreset } from '../../types/dashboard-navigation';
import type { TaskPlanningBucket } from '../../types/task-planning';
import { daysAgo, isOverdue as checkOverdue, formatDaysAgo } from '../../utils/date';

type AdvisorPlannerRoutePreset = Exclude<TaskListPreset, 'all_open'>;

export interface AdvisorPlannerTaskRoute {
  preset: AdvisorPlannerRoutePreset;
  label: string;
}

export interface AdvisorPlannerTaskItem extends ActionItem {
  planningBucket: TaskPlanningBucket | null;
  isInWeeklyFocus: boolean;
  isCarryOver: boolean;
  weeklyLabRoute: AdvisorPlannerTaskRoute | null;
}

interface ActionItemRowProps {
  item: AdvisorPlannerTaskItem;
  onToggleComplete: (id: string) => void;
  onSetPlanBucket: (taskId: string, bucket: TaskPlanningBucket) => void;
  onClearPlanBucket: (taskId: string) => void;
  onAddWeeklyFocus: (taskId: string) => void;
  onRemoveWeeklyFocus: (taskId: string) => void;
  onScheduleTask?: (taskId: string) => void;
  onOpenWeeklyLabRoute?: (preset: AdvisorPlannerRoutePreset) => void;
  schedulingEnabled?: boolean;
}

export function ActionItemRow({
  item,
  onToggleComplete,
  onSetPlanBucket,
  onClearPlanBucket,
  onAddWeeklyFocus,
  onRemoveWeeklyFocus,
  onScheduleTask,
  onOpenWeeklyLabRoute,
  schedulingEnabled = false,
}: ActionItemRowProps) {
  const isOverdue = item.dueDate !== 'ongoing' && item.status === 'open' && checkOverdue(item.dueDate);
  const isCompleted = item.status === 'completed';
  const weeklyLabRoute = item.weeklyLabRoute;

  return (
    <article
      data-task-id={item.id}
      className={`flex items-start gap-3 p-3 rounded-lg ${
      isCompleted ? 'bg-gray-800/30' : 'bg-gray-800/50'
    }`}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggleComplete(item.id)}
        className={`mt-0.5 w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
          isCompleted
            ? 'bg-green-600 border-green-600 text-white'
            : 'border-gray-600 hover:border-gray-400'
        }`}
      >
        {isCompleted && <span className="text-xs">&#10003;</span>}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
          {item.task}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs font-mono text-gray-600">{item.id}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded ${
            item.priority === 'high' ? 'bg-red-900/50 text-red-400' :
            item.priority === 'medium' ? 'bg-yellow-900/50 text-yellow-400' :
            'bg-gray-700 text-gray-400'
          }`}>
            {item.priority}
          </span>
          {item.planningBucket && (
            <span className="rounded-full bg-gray-700/80 px-2 py-0.5 text-xs text-gray-200">
              {item.planningBucket === 'this_week' ? 'this week' : item.planningBucket}
            </span>
          )}
          {item.isInWeeklyFocus && (
            <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-xs text-blue-300">
              focus
            </span>
          )}
          {item.dueDate !== 'ongoing' ? (
            <span className={`text-xs ${isOverdue ? 'text-red-400' : 'text-gray-500'}`}>
              {isOverdue ? `Overdue ${daysAgo(item.dueDate)}d` : `due ${item.dueDate}`}
            </span>
          ) : (
            <span className="text-xs text-gray-500">ongoing</span>
          )}
          {isCompleted && item.completedDate && (
            <span className="text-xs text-green-500">
              completed {formatDaysAgo(item.completedDate)}
            </span>
          )}
        </div>

        {!isCompleted && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <PlanActionButton
              active={item.planningBucket === 'today'}
              label="Today"
              onClick={() => onSetPlanBucket(item.id, 'today')}
            />
            <PlanActionButton
              active={item.planningBucket === 'this_week'}
              label="This Week"
              onClick={() => onSetPlanBucket(item.id, 'this_week')}
            />
            <PlanActionButton
              active={item.planningBucket === 'later'}
              label="Later"
              onClick={() => onSetPlanBucket(item.id, 'later')}
            />
            <button
              onClick={() => item.isInWeeklyFocus ? onRemoveWeeklyFocus(item.id) : onAddWeeklyFocus(item.id)}
              className={`text-xs transition-colors ${
                item.isInWeeklyFocus
                  ? 'text-blue-300 hover:text-blue-200'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {item.isInWeeklyFocus ? 'Focused' : 'Focus'}
            </button>
            {item.planningBucket && (
              <button
                onClick={() => onClearPlanBucket(item.id)}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Clear plan
              </button>
            )}
            {weeklyLabRoute && onOpenWeeklyLabRoute && (
              <button
                onClick={() => onOpenWeeklyLabRoute(weeklyLabRoute.preset)}
                className="rounded-full border border-sky-300/20 bg-sky-500/10 px-2 py-1 text-xs text-sky-100 transition-colors hover:border-sky-200/40 hover:text-white"
              >
                {`Open ${weeklyLabRoute.label} in Weekly LAB`}
              </button>
            )}
            {schedulingEnabled && onScheduleTask && (
              <button
                onClick={() => onScheduleTask(item.id)}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Schedule
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function PlanActionButton({
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
          : 'bg-gray-800 text-gray-400 hover:text-gray-200'
      }`}
    >
      {label}
    </button>
  );
}
