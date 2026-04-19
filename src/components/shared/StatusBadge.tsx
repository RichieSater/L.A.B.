interface StatusBadgeProps {
  status: 'due' | 'overdue' | 'upcoming' | 'completed';
  daysOverdue?: number;
}

export function StatusBadge({ status, daysOverdue }: StatusBadgeProps) {
  const styles = {
    overdue: 'border-[rgba(230,123,123,0.42)] bg-[rgba(230,123,123,0.14)] text-[#f2b1b1]',
    due: 'border-[rgba(228,209,174,0.42)] bg-[rgba(228,209,174,0.14)] text-[color:var(--lab-gold)]',
    upcoming: 'border-[rgba(92,138,214,0.42)] bg-[rgba(92,138,214,0.14)] text-[#b7cdfa]',
    completed: 'border-[rgba(117,200,167,0.42)] bg-[rgba(117,200,167,0.14)] text-[#9fe1c6]',
  };

  const labels = {
    overdue: daysOverdue ? `Overdue (${daysOverdue}d)` : 'Overdue',
    due: 'Due Today',
    upcoming: 'Upcoming',
    completed: 'On Track',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
