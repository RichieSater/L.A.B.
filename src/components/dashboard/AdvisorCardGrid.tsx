import type { AdvisorId } from '../../types/advisor';
import { AdvisorCard } from './AdvisorCard';

interface AdvisorCardGridProps {
  advisorIds: AdvisorId[];
}

export function AdvisorCardGrid({ advisorIds }: AdvisorCardGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {advisorIds.map(id => (
        <AdvisorCard key={id} advisorId={id} />
      ))}
    </div>
  );
}
