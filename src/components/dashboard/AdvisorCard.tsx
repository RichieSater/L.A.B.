import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AdvisorId } from '../../types/advisor';
import { useAdvisor } from '../../hooks/use-advisor';
import { useAuth } from '../../auth/auth-context';
import { useScheduling } from '../../state/scheduling-context';
import { selectSupportsQuickLog } from '../../state/selectors';
import { getSessionLockStatus, formatCountdown } from '../../scheduler/session-lock';
import { StatusBadge } from '../shared/StatusBadge';
import { QuickLogModal } from '../quick-log/QuickLogModal';
import { ScheduleModal } from '../scheduling/ScheduleModal';
import { daysAgo, formatDaysAgo } from '../../utils/date';

interface AdvisorCardProps {
  advisorId: AdvisorId;
}

export function AdvisorCard({ advisorId }: AdvisorCardProps) {
  const navigate = useNavigate();
  const { config, state, status } = useAdvisor(advisorId);
  const { profile } = useAuth();
  const { getUpcomingSession } = useScheduling();
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const supportsQuickLog = selectSupportsQuickLog(advisorId);

  const schedulingEnabled = profile?.schedulingEnabled ?? false;
  const upcomingSession = getUpcomingSession(advisorId);
  const lockStatus = getSessionLockStatus(upcomingSession, schedulingEnabled);

  const openItems = state.tasks.filter(i => i.status === 'open');
  const topItem = openItems[0];
  const overdueCount = openItems.filter(
    i => i.dueDate !== 'ongoing' && daysAgo(i.dueDate) > 0,
  ).length;

  const daysOverdue = status === 'overdue' && state.nextDueDate
    ? daysAgo(state.nextDueDate)
    : undefined;

  return (
    <div
      className="lab-panel lab-panel--soft cursor-pointer rounded-[1.5rem] transition-colors hover:border-[rgba(245,243,238,0.22)]"
      style={{ borderLeftColor: config.domainColor, borderLeftWidth: '4px' }}
      onClick={() => navigate(`/advisor/${advisorId}`)}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{config.icon}</span>
            <div>
              <h3 className="font-semibold text-gray-100">{config.shortName}</h3>
              <p className="text-xs text-[color:var(--lab-text-dim)]">
                {state.lastSessionDate
                  ? `Last: ${formatDaysAgo(state.lastSessionDate)}`
                  : 'No sessions yet'}
              </p>
            </div>
          </div>
          <StatusBadge status={status} daysOverdue={daysOverdue} />
        </div>

        {/* Streak */}
        {state.streak > 0 && (
          <div className="mb-3 text-xs text-[color:var(--lab-text-muted)]">
            {state.streak} session streak
          </div>
        )}

        {/* Scheduled session info */}
        {lockStatus.locked && lockStatus.reason === 'not-yet' && (
          <div className="mb-3 rounded-2xl border border-[rgba(92,138,214,0.32)] bg-[rgba(92,138,214,0.12)] p-3">
            <p className="text-xs text-[color:var(--lab-blue)]">
              Scheduled — unlocks in {formatCountdown(lockStatus.unlocksAt)}
            </p>
          </div>
        )}
        {lockStatus.locked && lockStatus.reason === 'expired' && (
          <div className="mb-3 rounded-2xl border border-[rgba(230,123,123,0.32)] bg-[rgba(230,123,123,0.12)] p-3">
            <p className="text-xs text-[#f2b1b1]">
              Session window missed
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); setShowSchedule(true); }}
              className="mt-1 text-xs text-[color:var(--lab-blue)] hover:text-white"
            >
              Reschedule
            </button>
          </div>
        )}

        {/* Card preview or top action item */}
        {state.cardPreview ? (
          <div className="mb-3 rounded-2xl border border-[color:var(--lab-border-muted)] bg-[rgba(19,28,38,0.86)] p-3">
            <p className="line-clamp-3 text-sm text-[color:var(--lab-text)]">{state.cardPreview}</p>
          </div>
        ) : topItem ? (
          <div className="mb-3 rounded-2xl border border-[color:var(--lab-border-muted)] bg-[rgba(19,28,38,0.86)] p-3">
            <p className="line-clamp-2 text-sm text-[color:var(--lab-text)]">{topItem.task}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                topItem.priority === 'high' ? 'bg-red-900/50 text-red-400' :
                topItem.priority === 'medium' ? 'bg-yellow-900/50 text-yellow-400' :
                'bg-gray-700 text-gray-400'
              }`}>
                {topItem.priority}
              </span>
              {topItem.dueDate !== 'ongoing' && (
                <span className="text-xs text-[color:var(--lab-text-dim)]">due {topItem.dueDate}</span>
              )}
            </div>
          </div>
        ) : null}

        {/* Stats row */}
        <div className="mb-4 flex items-center justify-between text-xs text-[color:var(--lab-text-muted)]">
          <span>{openItems.length} open tasks</span>
          {overdueCount > 0 && (
            <span className="text-[#f2b1b1]">{overdueCount} overdue</span>
          )}
        </div>

        {/* Start Session button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!lockStatus.locked) {
              navigate(`/session/${advisorId}`);
            }
          }}
          disabled={lockStatus.locked}
          className="lab-button w-full rounded-2xl disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            backgroundColor: `${config.domainColor}16`,
            color: config.domainColor,
            border: `1px solid ${config.domainColor}40`,
          }}
          onMouseEnter={(e) => {
            if (!lockStatus.locked) {
              (e.target as HTMLElement).style.backgroundColor = config.domainColor + '30';
            }
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.backgroundColor = config.domainColor + '20';
          }}
        >
          {lockStatus.locked && lockStatus.reason === 'not-yet'
            ? `Unlocks in ${formatCountdown(lockStatus.unlocksAt)}`
            : lockStatus.locked && lockStatus.reason === 'expired'
              ? 'Missed'
              : 'Start Session'}
        </button>

        {/* Schedule / Quick Log buttons */}
        <div className="flex gap-2 mt-2">
          {schedulingEnabled && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSchedule(true);
              }}
              className="lab-button lab-button--ghost flex-1 rounded-2xl"
            >
              {upcomingSession ? 'Reschedule' : 'Schedule'}
            </button>
          )}
          {supportsQuickLog && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowQuickLog(true);
              }}
              className="lab-button lab-button--ghost flex-1 rounded-2xl"
            >
              Quick Log
            </button>
          )}
        </div>
      </div>

      {showQuickLog && (
        <QuickLogModal
          advisorId={advisorId}
          onClose={() => setShowQuickLog(false)}
        />
      )}

      {showSchedule && (
        <ScheduleModal
          advisorId={advisorId}
          onClose={() => setShowSchedule(false)}
        />
      )}
    </div>
  );
}
