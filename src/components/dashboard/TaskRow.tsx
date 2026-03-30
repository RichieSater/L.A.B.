import type { EnrichedTaskItem } from '../../state/selectors';
import type { TaskPlanningBucket } from '../../types/task-planning';
import { daysAgo } from '../../utils/date';

interface TaskRowProps {
  item: EnrichedTaskItem;
  isInWeeklyFocus: boolean;
  onToggleComplete: (advisorId: string, itemId: string) => void;
  onAddWeeklyFocus: (advisorId: string, itemId: string) => void;
  onRemoveWeeklyFocus: (advisorId: string, itemId: string) => void;
  onSetPlanBucket: (advisorId: string, itemId: string, bucket: TaskPlanningBucket) => void;
  onClearPlanBucket: (advisorId: string, itemId: string) => void;
  onScheduleTask?: (item: EnrichedTaskItem) => void;
  schedulingEnabled?: boolean;
}

export function TaskRow({
  item,
  isInWeeklyFocus,
  onToggleComplete,
  onAddWeeklyFocus,
  onRemoveWeeklyFocus,
  onSetPlanBucket,
  onClearPlanBucket,
  onScheduleTask,
  schedulingEnabled = false,
}: TaskRowProps) {
  const isCompleted = item.status === 'completed';
  const isOverdue = !isCompleted && item.dueDate !== 'ongoing' && daysAgo(item.dueDate) > 0;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/50">
      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleComplete(item.advisorId, item.id);
        }}
        className={`mt-0.5 w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
          isCompleted
            ? 'bg-green-600 border-green-600 text-white'
            : 'border-gray-600 hover:border-gray-400'
        }`}
      >
        {isCompleted && (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
          {item.task}
        </p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {/* Advisor badge */}
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: item.advisorColor + '20', color: item.advisorColor }}
          >
            {item.advisorIcon} {item.advisorName}
          </span>

          {/* Priority */}
          <span className={`text-xs px-1.5 py-0.5 rounded ${
            item.priority === 'high' ? 'bg-red-900/50 text-red-400' :
            item.priority === 'medium' ? 'bg-yellow-900/50 text-yellow-400' :
            'bg-gray-700 text-gray-400'
          }`}>
            {item.priority}
          </span>

          {/* Due date */}
          {item.dueDate !== 'ongoing' ? (
            <span className={`text-xs ${isOverdue ? 'text-red-400' : 'text-gray-500'}`}>
              due {item.dueDate}
            </span>
          ) : (
            <span className="text-xs text-gray-600">ongoing</span>
          )}
          {isInWeeklyFocus && (
            <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-xs text-blue-300">
              Focus
            </span>
          )}
        </div>

        {!isCompleted && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <PlanActionButton
              active={item.planningBucket === 'today'}
              label="Today"
              onClick={() => onSetPlanBucket(item.advisorId, item.id, 'today')}
            />
            <PlanActionButton
              active={item.planningBucket === 'this_week'}
              label="This Week"
              onClick={() => onSetPlanBucket(item.advisorId, item.id, 'this_week')}
            />
            <PlanActionButton
              active={item.planningBucket === 'later'}
              label="Later"
              onClick={() => onSetPlanBucket(item.advisorId, item.id, 'later')}
            />
            <button
              onClick={() =>
                isInWeeklyFocus
                  ? onRemoveWeeklyFocus(item.advisorId, item.id)
                  : onAddWeeklyFocus(item.advisorId, item.id)
              }
              className={`text-xs transition-colors ${
                isInWeeklyFocus
                  ? 'text-blue-300 hover:text-blue-200'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {isInWeeklyFocus ? 'Focused' : 'Focus'}
            </button>
            {item.planningBucket && (
              <button
                onClick={() => onClearPlanBucket(item.advisorId, item.id)}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Clear plan
              </button>
            )}
            {schedulingEnabled && onScheduleTask && (
              <button
                onClick={() => onScheduleTask(item)}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Schedule
              </button>
            )}
          </div>
        )}
      </div>
    </div>
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
