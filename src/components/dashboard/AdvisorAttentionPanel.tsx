import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AdvisorId } from '../../types/advisor';
import type { TaskDashboardNavigationRequest } from '../../types/dashboard-navigation';
import type {
  AdvisorAttentionItem,
  AdvisorAttentionPlanningShortcut,
  AdvisorAttentionSummary,
} from '../../state/selectors';
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

  const handleOpenPlannerLane = (
    item: AdvisorAttentionItem,
    shortcut?: AdvisorAttentionPlanningShortcut,
  ) => {
    onOpenTasks({
      advisorId: item.advisorId,
      taskListPreset: shortcut?.preset ?? getPlanningPreset(item),
      attentionContext: {
        advisorName: item.advisorName,
        headline: shortcut?.headline ?? item.headline,
        reason: shortcut?.reason ?? item.reason,
        planningLabel: shortcut?.label ?? item.planningLabel,
        planningCount: shortcut?.count ?? item.planningCount,
      },
    });
  };

  return (
    <section className="lab-panel mb-6 rounded-[1.75rem] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--lab-text-muted)]">Attention Radar</h3>
          <p className="mt-2 max-w-2xl text-sm text-[color:var(--lab-text-muted)]">
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
        <div className="mt-4 rounded-2xl border border-[rgba(117,200,167,0.26)] bg-[rgba(117,200,167,0.08)] px-4 py-5 text-sm text-[#9fe1c6]">
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
              onOpenPlannerLane={
                item.primaryAction !== 'plan' && item.planningPreset && item.planningCount > 0
                  ? () => handleOpenPlannerLane(item)
                  : null
              }
              onOpenAlternatePlannerLane={
                item.alternatePlanningShortcuts.length > 0
                  ? shortcut => handleOpenPlannerLane(item, shortcut)
                  : null
              }
              onOpenAdvisor={() => navigate(`/advisor/${item.advisorId}`)}
            />
          ))}
        </div>
      )}

      {steadyItems.length > 0 && (
        <div className="mt-4 rounded-[1.4rem] border border-[color:var(--lab-border-muted)] bg-[rgba(8,11,17,0.92)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--lab-text-muted)]">Stable Right Now</h4>
              <p className="mt-1 text-xs text-[color:var(--lab-text-dim)]">
                These advisors have enough recent signal that you can leave them alone unless priorities change.
              </p>
            </div>
            <button
              onClick={() => onOpenTasks()}
              className="lab-button lab-button--ghost rounded-2xl px-4 text-xs"
            >
              Open task board
            </button>
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {steadyItems.map(item => (
              <button
                key={`steady:${item.advisorId}`}
                onClick={() => navigate(`/advisor/${item.advisorId}`)}
                className="rounded-2xl border border-[color:var(--lab-border-muted)] bg-[rgba(19,28,38,0.88)] px-3 py-3 text-left transition-colors hover:border-[rgba(245,243,238,0.18)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className="rounded-full px-2 py-0.5 text-xs"
                    style={{ backgroundColor: `${item.advisorColor}20`, color: item.advisorColor }}
                  >
                    {item.advisorIcon} {item.advisorName}
                  </span>
                  <span className="text-xs text-[color:var(--lab-text-dim)]">
                    {item.sessionsThisWeek > 0
                      ? `${item.sessionsThisWeek} session${item.sessionsThisWeek === 1 ? '' : 's'}`
                      : item.quickLogsThisWeek > 0
                        ? `${item.quickLogsThisWeek} log${item.quickLogsThisWeek === 1 ? '' : 's'}`
                        : `${item.completedTasksThisWeek} win${item.completedTasksThisWeek === 1 ? '' : 's'}`}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[color:var(--lab-text)]">{item.headline}</p>
                <p className="mt-1 text-xs text-[color:var(--lab-text-muted)]">{item.reason}</p>
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
  onOpenPlannerLane,
  onOpenAlternatePlannerLane,
  onOpenAdvisor,
}: {
  item: AdvisorAttentionItem;
  schedulingEnabled: boolean;
  onPrimaryAction: () => void;
  onOpenPlannerLane: (() => void) | null;
  onOpenAlternatePlannerLane: ((shortcut: AdvisorAttentionPlanningShortcut) => void) | null;
  onOpenAdvisor: () => void;
}) {
  return (
    <article className="rounded-[1.45rem] border border-[color:var(--lab-border-muted)] bg-[rgba(8,11,17,0.96)] p-4">
      <div className="flex items-start justify-between gap-3">
        <span
          className="rounded-full px-2 py-0.5 text-xs"
          style={{ backgroundColor: `${item.advisorColor}20`, color: item.advisorColor }}
        >
          {item.advisorIcon} {item.advisorName}
        </span>
        <StatusPill status={item.status} />
      </div>

      <p className="mt-3 text-base font-semibold text-[color:var(--lab-text)]">{item.headline}</p>
      <p className="mt-1 text-sm text-[color:var(--lab-text-muted)]">{item.reason}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <InlineStat label="Open" value={item.openTasks} />
        <InlineStat label="Overdue" value={item.overdueOpen} highlight={item.overdueOpen > 0} />
        <InlineStat label="Unplanned" value={item.unplannedOpen} highlight={item.unplannedOpen > 0} />
      </div>

      <div className="mt-3 rounded-2xl border border-[color:var(--lab-border-muted)] bg-[rgba(19,28,38,0.86)] px-3 py-2 text-xs text-[color:var(--lab-text-muted)]">
        <p>{formatSessionLine(item)}</p>
        <p className="mt-1">{formatQuickLogLine(item)}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={onPrimaryAction}
          className="lab-button lab-button--gold min-w-[140px] flex-1 rounded-2xl"
        >
          {getPrimaryActionLabel(item, schedulingEnabled)}
        </button>
        {onOpenPlannerLane && item.planningLabel && (
          <button
            onClick={onOpenPlannerLane}
            className="lab-button lab-button--blue min-w-[140px] flex-1 rounded-2xl"
          >
            {`Open ${item.planningLabel}`}
          </button>
        )}
        <button
          onClick={onOpenAdvisor}
          className="lab-button lab-button--ghost rounded-2xl"
        >
          Open
        </button>
      </div>

      {onOpenAlternatePlannerLane && item.alternatePlanningShortcuts.length > 0 && (
        <div className="mt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--lab-text-dim)]">Other live lanes</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {item.alternatePlanningShortcuts.slice(0, 2).map(shortcut => (
              <button
                key={`${item.advisorId}:${shortcut.preset}`}
                onClick={() => onOpenAlternatePlannerLane(shortcut)}
                className="lab-button lab-button--ghost rounded-2xl"
              >
                {shortcut.label} ({shortcut.count})
              </button>
            ))}
          </div>
        </div>
      )}
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
    neutral: 'border-[color:var(--lab-border-muted)] bg-[rgba(8,11,17,0.92)] text-[color:var(--lab-text)]',
    attention: 'border-[rgba(228,209,174,0.26)] bg-[rgba(228,209,174,0.08)] text-[color:var(--lab-gold)]',
    primary: 'border-[rgba(92,138,214,0.26)] bg-[rgba(92,138,214,0.08)] text-[#b7cdfa]',
    success: 'border-[rgba(117,200,167,0.26)] bg-[rgba(117,200,167,0.08)] text-[#9fe1c6]',
  } as const;

  return (
    <div className={`rounded-lg border px-3 py-2 ${toneClasses[tone]}`}>
      <p className="text-[11px] uppercase tracking-wide text-[color:var(--lab-text-dim)]">{label}</p>
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
          ? 'bg-[rgba(228,209,174,0.12)] text-[color:var(--lab-gold)]'
          : 'bg-[rgba(19,28,38,0.92)] text-[color:var(--lab-text-muted)]'
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
      ? 'bg-[rgba(228,209,174,0.12)] text-[color:var(--lab-gold)]'
      : status === 'attention'
        ? 'bg-[rgba(92,138,214,0.12)] text-[#b7cdfa]'
        : 'bg-[rgba(117,200,167,0.12)] text-[#9fe1c6]';

  return (
    <span className={`rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${className}`}>
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
