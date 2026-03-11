import type { AdvisorId } from '../../types/advisor';
import type { DomainHealth } from '../../state/selectors';

interface DomainHealthIndicatorProps {
  advisorId: AdvisorId;
  health: DomainHealth | undefined;
  label: string;
}

export function DomainHealthIndicator({ health, label }: DomainHealthIndicatorProps) {
  const colors = {
    healthy: 'bg-green-500',
    attention: 'bg-yellow-500',
    critical: 'bg-red-500',
  };

  const color = health ? colors[health] : 'bg-gray-600';

  return (
    <div className="flex items-center gap-1.5" title={`${label}: ${health ?? 'unknown'}`}>
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  );
}
