import type { EnrichedActionItem } from '../../state/selectors';
import { daysAgo } from '../../utils/date';

interface TaskRowProps {
  item: EnrichedActionItem;
  onToggleComplete: (advisorId: string, itemId: string) => void;
}

export function TaskRow({ item, onToggleComplete }: TaskRowProps) {
  const isCompleted = item.status === 'completed';
  const isOverdue = !isCompleted && item.due !== 'ongoing' && daysAgo(item.due) > 0;

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
          {item.due !== 'ongoing' ? (
            <span className={`text-xs ${isOverdue ? 'text-red-400' : 'text-gray-500'}`}>
              due {item.due}
            </span>
          ) : (
            <span className="text-xs text-gray-600">ongoing</span>
          )}
        </div>
      </div>
    </div>
  );
}
