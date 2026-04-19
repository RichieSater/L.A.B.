import { useParams, Navigate } from 'react-router-dom';
import { ADVISORY_BOARD_PATH, getAdvisorPath } from '../constants/routes';
import type { AdvisorId } from '../types/advisor';
import { ADVISOR_CONFIGS } from '../advisors/registry';
import { useAuth } from '../auth/auth-context';
import { useScheduling } from '../state/scheduling-context';
import { getSessionLockStatus, formatCountdown } from '../scheduler/session-lock';
import { SessionFlow } from '../components/session/SessionFlow';

export function SessionPage() {
  const { advisorId } = useParams<{ advisorId: string }>();
  const { profile } = useAuth();
  const { getUpcomingSession } = useScheduling();

  if (!advisorId || !ADVISOR_CONFIGS[advisorId as AdvisorId]) {
    return <Navigate to={ADVISORY_BOARD_PATH} replace />;
  }

  const id = advisorId as AdvisorId;
  const schedulingEnabled = profile?.schedulingEnabled ?? false;
  const upcomingSession = getUpcomingSession(id);
  const lockStatus = getSessionLockStatus(upcomingSession, schedulingEnabled);

  if (lockStatus.locked) {
    const config = ADVISOR_CONFIGS[id];
    return (
      <div className="lab-page lab-page--narrow mt-10 text-center">
        <div className="lab-panel lab-panel--ink rounded-[1.75rem] px-6 py-10">
        <span className="text-5xl block mb-4">{config.icon}</span>
        <h2 className="mb-2 text-xl font-semibold text-[color:var(--lab-text)]">
          {config.shortName} Session Locked
        </h2>
        {lockStatus.reason === 'not-yet' ? (
          <p className="text-[color:var(--lab-text-muted)]">
            This session unlocks in {formatCountdown(lockStatus.unlocksAt)}.
          </p>
        ) : (
          <p className="text-[color:var(--lab-text-muted)]">
            The session window has expired. Go back to reschedule.
          </p>
        )}
        <a
          href={getAdvisorPath(advisorId)}
          className="lab-button lab-button--ghost mt-6 rounded-2xl"
        >
          Back to {config.shortName}
        </a>
        </div>
      </div>
    );
  }

  return <SessionFlow advisorId={id} />;
}
