import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AdvisorId } from '../../types/advisor';
import { useAdvisor } from '../../hooks/use-advisor';
import { selectSupportsQuickLog } from '../../state/selectors';
import { ADVISOR_CONFIGS } from '../../advisors/registry';
import { StatusBadge } from '../shared/StatusBadge';
import { ActionItemList } from './ActionItemList';
import { MetricsSummary } from './MetricsSummary';
import { QuickLogModal } from '../quick-log/QuickLogModal';
import { daysAgo, formatDaysAgo } from '../../utils/date';

interface AdvisorDetailProps {
  advisorId: AdvisorId;
}

export function AdvisorDetail({ advisorId }: AdvisorDetailProps) {
  const navigate = useNavigate();
  const { config, state, status, dispatch } = useAdvisor(advisorId);
  const [showQuickLog, setShowQuickLog] = useState(false);
  const supportsQuickLog = selectSupportsQuickLog(advisorId);

  const daysOverdue = status === 'overdue' && state.nextDueDate
    ? daysAgo(state.nextDueDate)
    : undefined;

  const handleToggleComplete = (itemId: string) => {
    const item = state.actionItems.find(i => i.id === itemId);
    if (!item) return;
    const newStatus = item.status === 'completed' ? 'open' : 'completed';
    dispatch({
      type: 'UPDATE_ACTION_ITEM',
      payload: { advisorId, itemId, status: newStatus },
    });
  };

  return (
    <div>
      {/* Back link */}
      <button
        onClick={() => navigate('/')}
        className="text-sm text-gray-500 hover:text-gray-300 mb-4 transition-colors"
      >
        &larr; Dashboard
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <span className="text-4xl">{config.icon}</span>
          <div>
            <h2 className="text-2xl font-bold text-gray-100">{config.displayName}</h2>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
              <StatusBadge status={status} daysOverdue={daysOverdue} />
              {state.streak > 0 && (
                <span className="text-sm text-gray-400">{state.streak} session streak</span>
              )}
              <span className="text-sm text-gray-500">
                {state.sessions.length} total sessions
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 self-start">
          <button
            onClick={() => navigate(`/session/${advisorId}`)}
            className="px-5 py-2.5 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: config.domainColor,
              color: 'white',
            }}
          >
            Start Session
          </button>
          {supportsQuickLog && (
            <button
              onClick={() => setShowQuickLog(true)}
              className="px-4 py-2.5 rounded-lg font-medium text-gray-400 hover:text-gray-200 bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              Quick Log
            </button>
          )}
          <button
            onClick={() => {
              dispatch({
                type: 'TOGGLE_ADVISOR_ACTIVATION',
                payload: { advisorId },
              });
              navigate('/');
            }}
            className="px-4 py-2.5 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors"
          >
            Deactivate
          </button>
        </div>
      </div>

      {/* Last session info */}
      {state.lastSessionDate && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Last Session — {state.lastSessionDate} ({formatDaysAgo(state.lastSessionDate)})
          </h3>
          <p className="text-sm text-gray-300">{state.lastSessionSummary}</p>
          {state.contextForNextSession && (
            <div className="mt-3 pt-3 border-t border-gray-800">
              <h4 className="text-xs text-gray-500 uppercase tracking-wide mb-1">Context for next session</h4>
              <p className="text-sm text-gray-400">{state.contextForNextSession}</p>
            </div>
          )}
        </div>
      )}

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Action items — 2 cols */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
              Action Items
            </h3>
            <ActionItemList
              items={state.actionItems}
              onToggleComplete={handleToggleComplete}
            />
          </div>
        </div>

        {/* Metrics — 1 col */}
        <div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
              Metrics
            </h3>
            <MetricsSummary config={config} state={state} />
          </div>

          {/* Recent quick logs */}
          {supportsQuickLog && (
            <RecentQuickLogs advisorId={advisorId} />
          )}

          {/* Session history */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
              Session History
            </h3>
            {state.sessions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No sessions yet.</p>
            ) : (
              <div className="space-y-3">
                {[...state.sessions].reverse().slice(0, 10).map(session => (
                  <div key={session.id} className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">{session.date}</span>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{session.mood}</span>
                        <span>E:{session.energy}/10</span>
                      </div>
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{session.summary}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showQuickLog && (
        <QuickLogModal
          advisorId={advisorId}
          onClose={() => setShowQuickLog(false)}
        />
      )}
    </div>
  );
}

function RecentQuickLogs({ advisorId }: { advisorId: AdvisorId }) {
  const { appState } = useAdvisor(advisorId);
  const config = ADVISOR_CONFIGS[advisorId];
  const metricDefs = config.metricDefinitions;

  const recentLogs = appState.quickLogs
    .filter(l => l.advisorId === advisorId)
    .slice(-7)
    .reverse();

  if (recentLogs.length === 0) return null;

  const getLabel = (id: string) => metricDefs.find(m => m.id === id)?.label ?? id;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
        Recent Quick Logs
      </h3>
      <div className="space-y-3">
        {recentLogs.map((log, i) => (
          <div key={log.timestamp ?? i} className="text-sm">
            <span className="text-gray-500 text-xs">{log.date}</span>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
              {Object.entries(log.logs).map(([key, val]) => (
                <span key={key} className="text-gray-300">
                  {getLabel(key)}: <span className="text-gray-100">{val}</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
