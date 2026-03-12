import type { ActionItem } from '../../types/action-item';
import { daysAgo, isOverdue as checkOverdue, formatDaysAgo } from '../../utils/date';

interface ActionItemRowProps {
  item: ActionItem;
  onToggleComplete: (id: string) => void;
}

export function ActionItemRow({ item, onToggleComplete }: ActionItemRowProps) {
  const isOverdue = item.dueDate !== 'ongoing' && item.status === 'open' && checkOverdue(item.dueDate);
  const isCompleted = item.status === 'completed';

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg ${
      isCompleted ? 'bg-gray-800/30' : 'bg-gray-800/50'
    }`}>
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
      </div>
    </div>
  );
}
