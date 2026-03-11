import { useParams, Navigate } from 'react-router-dom';
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
    return <Navigate to="/" replace />;
  }

  const id = advisorId as AdvisorId;
  const schedulingEnabled = profile?.schedulingEnabled ?? false;
  const upcomingSession = getUpcomingSession(id);
  const lockStatus = getSessionLockStatus(upcomingSession, schedulingEnabled);

  if (lockStatus.locked) {
    const config = ADVISOR_CONFIGS[id];
    return (
      <div className="max-w-lg mx-auto mt-16 text-center">
        <span className="text-5xl block mb-4">{config.icon}</span>
        <h2 className="text-xl font-semibold text-gray-100 mb-2">
          {config.shortName} Session Locked
        </h2>
        {lockStatus.reason === 'not-yet' ? (
          <p className="text-gray-400">
            This session unlocks in {formatCountdown(lockStatus.unlocksAt)}.
          </p>
        ) : (
          <p className="text-gray-400">
            The session window has expired. Go back to reschedule.
          </p>
        )}
        <a
          href={`/advisor/${advisorId}`}
          className="inline-block mt-6 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-200 transition-colors"
        >
          Back to {config.shortName}
        </a>
      </div>
    );
  }

  return <SessionFlow advisorId={id} />;
}
