interface StatusBadgeProps {
  status: 'due' | 'overdue' | 'upcoming' | 'completed';
  daysOverdue?: number;
}

export function StatusBadge({ status, daysOverdue }: StatusBadgeProps) {
  const styles = {
    overdue: 'bg-red-900/50 text-red-300 border-red-700',
    due: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
    upcoming: 'bg-blue-900/50 text-blue-300 border-blue-700',
    completed: 'bg-green-900/50 text-green-300 border-green-700',
  };

  const labels = {
    overdue: daysOverdue ? `Overdue (${daysOverdue}d)` : 'Overdue',
    due: 'Due Today',
    upcoming: 'Upcoming',
    completed: 'On Track',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
