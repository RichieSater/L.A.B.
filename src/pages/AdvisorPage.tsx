import { useParams, Navigate } from 'react-router-dom';
import type { AdvisorId } from '../types/advisor';
import { ADVISOR_CONFIGS } from '../advisors/registry';
import { AdvisorDetail } from '../components/advisor-detail/AdvisorDetail';

export function AdvisorPage() {
  const { advisorId } = useParams<{ advisorId: string }>();

  if (!advisorId || !ADVISOR_CONFIGS[advisorId as AdvisorId]) {
    return <Navigate to="/" replace />;
  }

  return <AdvisorDetail advisorId={advisorId as AdvisorId} />;
}
