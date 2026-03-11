import { useState } from 'react';
import type { ActionItem } from '../../types/action-item';
import { ActionItemRow } from './ActionItemRow';

interface ActionItemListProps {
  items: ActionItem[];
  onToggleComplete: (id: string) => void;
}

type Filter = 'all' | 'open' | 'completed';

export function ActionItemList({ items, onToggleComplete }: ActionItemListProps) {
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
            />
          ))
        )}
      </div>
    </div>
  );
}
