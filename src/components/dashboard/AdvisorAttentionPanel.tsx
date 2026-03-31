import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AdvisorId } from '../../types/advisor';
import type { TaskDashboardNavigationRequest } from '../../types/dashboard-navigation';
import type { AdvisorAttentionItem, AdvisorAttentionSummary } from '../../state/selectors';
import { QuickLogModal } from '../quick-log/QuickLogModal';
import { ScheduleModal } from '../scheduling/ScheduleModal';
import { formatDate, formatDaysAgo } from '../../utils/date';

interface AdvisorAttentionPanelProps {
  summary: AdvisorAttentionSummary;
  onOpenTasks: (
    request?: Omit<TaskDashboardNavigationRequest, 'requestKey'>,
  ) => void;
  schedulingEnabled: boolean;
}

export function AdvisorAttentionPanel({
  summary,
  onOpenTasks,
  schedulingEnabled,
}: AdvisorAttentionPanelProps) {
  const navigate = useNavigate();
  const [scheduleAdvisorId, setScheduleAdvisorId] = useState<AdvisorId | null>(null);
  const [quickLogAdvisorId, setQuickLogAdvisorId] = useState<AdvisorId | null>(null);

  if (summary.items.length === 0) {
    return null;
  }

  const focusItems = summary.items.filter(item => item.status !== 'steady').slice(0, 3);
  const steadyItems = summary.items.filter(item => item.status === 'steady').slice(0, 4);

  const handlePrimaryAction = (item: AdvisorAttentionItem) => {
    if (item.primaryAction === 'schedule') {
      if (schedulingEnabled) {
        setScheduleAdvisorId(item.advisorId);
        return;
      }

      navigate(`/advisor/${item.advisorId}`);
      return;
    }

    if (item.primaryAction === 'quick_log') {
      setQuickLogAdvisorId(item.advisorId);
      return;
    }

    if (item.primaryAction === 'plan') {
      onOpenTasks({
        advisorId: item.advisorId,
        taskListPreset: getPlanningPreset(item),
        attentionContext: {
          advisorName: item.advisorName,
          headline: item.headline,
          reason: item.reason,
          planningLabel: item.planningLabel,
          planningCount: item.planningCount,
        },
      });
      return;
    }

    navigate(`/advisor/${item.advisorId}`);
  };

  return (
    <section className="mb-6 rounded-xl border border-gray-800 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-300">Attention Radar</h3>
          <p className="mt-2 max-w-2xl text-sm text-gray-500">
            Reduce decisions. This board ranks which advisor needs a session, a quick log, or task triage next.
          </p>
        </div>

        <div className="grid min-w-[240px] gap-2 sm:grid-cols-2">
          <RadarStat label="Needs Attention" value={summary.needsAttentionCount} tone={summary.needsAttentionCount > 0 ? 'attention' : 'neutral'} />
          <RadarStat label="Session Nudges" value={summary.scheduleCount} tone={summary.scheduleCount > 0 ? 'primary' : 'neutral'} />
          <RadarStat label="Queue Decisions" value={summary.planCount} tone={summary.planCount > 0 ? 'attention' : 'neutral'} />
          <RadarStat label="Stable Domains" value={summary.quietCount} tone={summary.quietCount > 0 ? 'success' : 'neutral'} />
        </div>
      </div>

      {focusItems.length === 0 ? (
        <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-5 text-sm text-emerald-300">
          Every active advisor looks steady right now. Use the advisor cards below for normal navigation instead of triage.
        </div>
      ) : (
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {focusItems.map(item => (
            <AttentionCard
              key={item.advisorId}
              item={item}
              schedulingEnabled={schedulingEnabled}
              onPrimaryAction={() => handlePrimaryAction(item)}
              onOpenAdvisor={() => navigate(`/advisor/${item.advisorId}`)}
            />
          ))}
        </div>
      )}

      {steadyItems.length > 0 && (
        <div className="mt-4 rounded-lg border border-gray-800 bg-gray-950/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Stable Right Now</h4>
              <p className="mt-1 text-xs text-gray-500">
                These advisors have enough recent signal that you can leave them alone unless priorities change.
              </p>
            </div>
            <button
              onClick={() => onOpenTasks()}
              className="rounded-lg border border-gray-700 px-3 py-2 text-xs font-medium text-gray-300 transition-colors hover:border-gray-600 hover:text-gray-100"
            >
              Open task board
            </button>
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {steadyItems.map(item => (
              <button
                key={`steady:${item.advisorId}`}
                onClick={() => navigate(`/advisor/${item.advisorId}`)}
                className="rounded-lg border border-gray-800 bg-gray-900/70 px-3 py-3 text-left transition-colors hover:border-gray-700 hover:bg-gray-900"
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className="rounded-full px-2 py-0.5 text-xs"
                    style={{ backgroundColor: `${item.advisorColor}20`, color: item.advisorColor }}
                  >
                    {item.advisorIcon} {item.advisorName}
                  </span>
                  <span className="text-xs text-gray-500">
                    {item.sessionsThisWeek > 0
                      ? `${item.sessionsThisWeek} session${item.sessionsThisWeek === 1 ? '' : 's'}`
                      : item.quickLogsThisWeek > 0
                        ? `${item.quickLogsThisWeek} log${item.quickLogsThisWeek === 1 ? '' : 's'}`
                        : `${item.completedTasksThisWeek} win${item.completedTasksThisWeek === 1 ? '' : 's'}`}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-100">{item.headline}</p>
                <p className="mt-1 text-xs text-gray-500">{item.reason}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {scheduleAdvisorId && (
        <ScheduleModal
          advisorId={scheduleAdvisorId}
          onClose={() => setScheduleAdvisorId(null)}
        />
      )}

      {quickLogAdvisorId && (
        <QuickLogModal
          advisorId={quickLogAdvisorId}
          onClose={() => setQuickLogAdvisorId(null)}
        />
      )}
    </section>
  );
}

function getPlanningPreset(item: AdvisorAttentionItem): TaskDashboardNavigationRequest['taskListPreset'] {
  return item.planningPreset ?? 'needs_triage';
}

function AttentionCard({
  item,
  schedulingEnabled,
  onPrimaryAction,
  onOpenAdvisor,
}: {
  item: AdvisorAttentionItem;
  schedulingEnabled: boolean;
  onPrimaryAction: () => void;
  onOpenAdvisor: () => void;
}) {
  return (
    <article className="rounded-xl border border-gray-800 bg-gray-950/80 p-4">
      <div className="flex items-start justify-between gap-3">
        <span
          className="rounded-full px-2 py-0.5 text-xs"
          style={{ backgroundColor: `${item.advisorColor}20`, color: item.advisorColor }}
        >
          {item.advisorIcon} {item.advisorName}
        </span>
        <StatusPill status={item.status} />
      </div>

      <p className="mt-3 text-base font-semibold text-gray-100">{item.headline}</p>
      <p className="mt-1 text-sm text-gray-400">{item.reason}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <InlineStat label="Open" value={item.openTasks} />
        <InlineStat label="Overdue" value={item.overdueOpen} highlight={item.overdueOpen > 0} />
        <InlineStat label="Unplanned" value={item.unplannedOpen} highlight={item.unplannedOpen > 0} />
      </div>

      <div className="mt-3 rounded-lg border border-gray-800 bg-gray-900/70 px-3 py-2 text-xs text-gray-500">
        <p>{formatSessionLine(item)}</p>
        <p className="mt-1">{formatQuickLogLine(item)}</p>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={onPrimaryAction}
          className="flex-1 rounded-lg bg-gray-200 px-3 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-white"
        >
          {getPrimaryActionLabel(item, schedulingEnabled)}
        </button>
        <button
          onClick={onOpenAdvisor}
          className="rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-300 transition-colors hover:border-gray-600 hover:text-gray-100"
        >
          Open
        </button>
      </div>
    </article>
  );
}

function RadarStat({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: number;
  tone?: 'neutral' | 'attention' | 'primary' | 'success';
}) {
  const toneClasses = {
    neutral: 'border-gray-800 bg-gray-950 text-gray-100',
    attention: 'border-amber-500/20 bg-amber-500/5 text-amber-200',
    primary: 'border-blue-500/20 bg-blue-500/5 text-blue-200',
    success: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-200',
  } as const;

  return (
    <div className={`rounded-lg border px-3 py-2 ${toneClasses[tone]}`}>
      <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function InlineStat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <span
      className={`rounded-full px-2 py-1 text-xs ${
        highlight
          ? 'bg-amber-500/10 text-amber-200'
          : 'bg-gray-900 text-gray-400'
      }`}
    >
      {label} {value}
    </span>
  );
}

function StatusPill({ status }: { status: AdvisorAttentionItem['status'] }) {
  const label = status === 'urgent' ? 'Act now' : status === 'attention' ? 'Worth a sweep' : 'Steady';
  const className =
    status === 'urgent'
      ? 'bg-amber-500/15 text-amber-200'
      : status === 'attention'
        ? 'bg-blue-500/15 text-blue-200'
        : 'bg-emerald-500/15 text-emerald-200';

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${className}`}>
      {label}
    </span>
  );
}

function getPrimaryActionLabel(
  item: AdvisorAttentionItem,
  schedulingEnabled: boolean,
): string {
  if (item.primaryAction === 'schedule') {
    return schedulingEnabled ? 'Schedule session' : 'Open advisor';
  }

  if (item.primaryAction === 'plan') {
    return item.planningLabel ? `Open ${item.planningLabel}` : 'Review tasks';
  }

  if (item.primaryAction === 'quick_log') {
    return 'Quick log';
  }

  return 'Open advisor';
}

function formatSessionLine(item: AdvisorAttentionItem): string {
  if (!item.lastSessionDate) {
    return 'No session captured yet.';
  }

  if (item.nextDueDate) {
    return `Last session ${formatDaysAgo(item.lastSessionDate)}. Next due ${formatDate(item.nextDueDate)}.`;
  }

  return `Last session ${formatDaysAgo(item.lastSessionDate)}.`;
}

function formatQuickLogLine(item: AdvisorAttentionItem): string {
  if (!item.lastQuickLogDate) {
    return 'No quick log captured yet.';
  }

  return `Last quick log ${formatDaysAgo(item.lastQuickLogDate)}.`;
}
