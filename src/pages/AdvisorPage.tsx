import { useParams, Navigate } from 'react-router-dom';
import { ADVISORY_BOARD_PATH } from '../constants/routes';
import type { AdvisorId } from '../types/advisor';
import { ADVISOR_CONFIGS } from '../advisors/registry';
import { AdvisorDetail } from '../components/advisor-detail/AdvisorDetail';

export function AdvisorPage() {
  const { advisorId } = useParams<{ advisorId: string }>();

  if (!advisorId || !ADVISOR_CONFIGS[advisorId as AdvisorId]) {
    return <Navigate to={ADVISORY_BOARD_PATH} replace />;
  }

  return <AdvisorDetail advisorId={advisorId as AdvisorId} />;
}
