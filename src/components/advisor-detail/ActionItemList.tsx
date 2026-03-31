import { useState } from 'react';
import type { TaskPlanningBucket } from '../../types/task-planning';
import {
  ActionItemRow,
  type AdvisorPlannerTaskItem,
  type AdvisorPlannerTaskRoute,
} from './ActionItemRow';

interface ActionItemListProps {
  items: AdvisorPlannerTaskItem[];
  onToggleComplete: (id: string) => void;
  onSetPlanBucket: (taskId: string, bucket: TaskPlanningBucket) => void;
  onClearPlanBucket: (taskId: string) => void;
  onAddWeeklyFocus: (taskId: string) => void;
  onRemoveWeeklyFocus: (taskId: string) => void;
  onScheduleTask?: (taskId: string) => void;
  onOpenWeeklyLabRoute?: (preset: AdvisorPlannerTaskRoute['preset']) => void;
  schedulingEnabled?: boolean;
}

type Filter = 'all' | 'open' | 'completed';

export function ActionItemList({
  items,
  onToggleComplete,
  onSetPlanBucket,
  onClearPlanBucket,
  onAddWeeklyFocus,
  onRemoveWeeklyFocus,
  onScheduleTask,
  onOpenWeeklyLabRoute,
  schedulingEnabled = false,
}: ActionItemListProps) {
  const [filter, setFilter] = useState<Filter>('open');

  const filtered = items.filter(item => {
    if (filter === 'open') return item.status === 'open';
    if (filter === 'completed') return item.status === 'completed';
    return true;
  });

  const counts = {
    all: items.length,
    open: items.filter(i => i.status === 'open').length,
    completed: items.filter(i => i.status === 'completed').length,
  };

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(['open', 'completed', 'all'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-gray-700 text-gray-200'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">
            No {filter === 'all' ? '' : filter} action items.
          </p>
        ) : (
          filtered.map(item => (
            <ActionItemRow
              key={item.id}
              item={item}
              onToggleComplete={onToggleComplete}
              onSetPlanBucket={onSetPlanBucket}
              onClearPlanBucket={onClearPlanBucket}
              onAddWeeklyFocus={onAddWeeklyFocus}
              onRemoveWeeklyFocus={onRemoveWeeklyFocus}
              onScheduleTask={onScheduleTask}
              onOpenWeeklyLabRoute={onOpenWeeklyLabRoute}
              schedulingEnabled={schedulingEnabled}
            />
          ))
        )}
      </div>
    </div>
  );
}
