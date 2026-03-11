import { useState } from 'react';
import type { AdvisorId } from '../../types/advisor';
import { useAppState } from '../../state/app-context';
import { selectAllActionItems } from '../../state/selectors';
import { ACTIVE_ADVISOR_IDS, ADVISOR_CONFIGS } from '../../advisors/registry';
import { today } from '../../utils/date';
import { TaskRow } from './TaskRow';

type StatusFilter = 'open' | 'completed' | 'all';
type PriorityFilter = 'all' | 'high' | 'medium' | 'low';

export function TaskDashboard() {
  const { state, dispatch } = useAppState();
  const allItems = selectAllActionItems(state);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open');
  const [advisorFilter, setAdvisorFilter] = useState<AdvisorId | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');

  const filtered = allItems.filter(item => {
    if (statusFilter === 'open' && item.status !== 'open') return false;
    if (statusFilter === 'completed' && item.status !== 'completed') return false;
    if (advisorFilter !== 'all' && item.advisorId !== advisorFilter) return false;
    if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;
    return true;
  });

  const now = today();
  const overdueCount = allItems.filter(
    i => i.status === 'open' && i.due !== 'ongoing' && i.due < now,
  ).length;
  const openCount = allItems.filter(i => i.status === 'open').length;

  const handleToggle = (advisorId: string, itemId: string) => {
    const item = allItems.find(i => i.id === itemId && i.advisorId === advisorId);
    if (!item) return;
    dispatch({
      type: 'UPDATE_ACTION_ITEM',
      payload: {
        advisorId: advisorId as AdvisorId,
        itemId,
        status: item.status === 'completed' ? 'open' : 'completed',
      },
    });
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      {/* Summary */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <span className="text-gray-400">{openCount} open</span>
        {overdueCount > 0 && (
          <span className="text-red-400">{overdueCount} overdue</span>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        {/* Status filter */}
        <div className="flex gap-1">
          {(['open', 'completed', 'all'] as StatusFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === f
                  ? 'bg-gray-700 text-gray-200'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Advisor filter */}
        <div className="flex gap-1">
          <button
            onClick={() => setAdvisorFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              advisorFilter === 'all'
                ? 'bg-gray-700 text-gray-200'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            All
          </button>
          {ACTIVE_ADVISOR_IDS.map(id => {
            const config = ADVISOR_CONFIGS[id];
            return (
              <button
                key={id}
                onClick={() => setAdvisorFilter(id)}
                className={`px-2 py-1.5 rounded-lg text-xs transition-colors ${
                  advisorFilter === id
                    ? 'bg-gray-700'
                    : 'hover:bg-gray-800'
                }`}
                style={advisorFilter === id ? { color: config.domainColor } : { color: '#9ca3af' }}
                title={config.shortName}
              >
                {config.icon}
              </button>
            );
          })}
        </div>

        {/* Priority filter */}
        <div className="flex gap-1">
          {(['all', 'high', 'medium', 'low'] as PriorityFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setPriorityFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                priorityFilter === f
                  ? 'bg-gray-700 text-gray-200'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {f === 'all' ? 'Priority' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">
            No {statusFilter === 'all' ? '' : statusFilter + ' '}tasks
            {advisorFilter !== 'all' ? ` from ${ADVISOR_CONFIGS[advisorFilter].shortName}` : ''}
            {priorityFilter !== 'all' ? ` with ${priorityFilter} priority` : ''}.
          </p>
        ) : (
          filtered.map(item => (
            <TaskRow
              key={`${item.advisorId}-${item.id}`}
              item={item}
              onToggleComplete={handleToggle}
            />
          ))
        )}
      </div>
    </div>
  );
}
