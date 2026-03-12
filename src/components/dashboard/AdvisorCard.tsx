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
      className="bg-gray-900 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors cursor-pointer"
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
              <p className="text-xs text-gray-500">
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
          <div className="text-xs text-gray-400 mb-3">
            {state.streak} session streak
          </div>
        )}

        {/* Scheduled session info */}
        {lockStatus.locked && lockStatus.reason === 'not-yet' && (
          <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-3 mb-3">
            <p className="text-xs text-blue-400">
              Scheduled — unlocks in {formatCountdown(lockStatus.unlocksAt)}
            </p>
          </div>
        )}
        {lockStatus.locked && lockStatus.reason === 'expired' && (
          <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-3 mb-3">
            <p className="text-xs text-red-400">
              Session window missed
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); setShowSchedule(true); }}
              className="text-xs text-blue-400 hover:text-blue-300 mt-1"
            >
              Reschedule
            </button>
          </div>
        )}

        {/* Card preview or top action item */}
        {state.cardPreview ? (
          <div className="bg-gray-800/50 rounded-lg p-3 mb-3">
            <p className="text-sm text-gray-300 line-clamp-3">{state.cardPreview}</p>
          </div>
        ) : topItem ? (
          <div className="bg-gray-800/50 rounded-lg p-3 mb-3">
            <p className="text-sm text-gray-300 line-clamp-2">{topItem.task}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                topItem.priority === 'high' ? 'bg-red-900/50 text-red-400' :
                topItem.priority === 'medium' ? 'bg-yellow-900/50 text-yellow-400' :
                'bg-gray-700 text-gray-400'
              }`}>
                {topItem.priority}
              </span>
              {topItem.dueDate !== 'ongoing' && (
                <span className="text-xs text-gray-500">due {topItem.dueDate}</span>
              )}
            </div>
          </div>
        ) : null}

        {/* Stats row */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <span>{openItems.length} open tasks</span>
          {overdueCount > 0 && (
            <span className="text-red-400">{overdueCount} overdue</span>
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
          className="w-full py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            backgroundColor: config.domainColor + '20',
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
              className="flex-1 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
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
              className="flex-1 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
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
