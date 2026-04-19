import type { AdvisorId } from '../../types/advisor';
import type { TaskListPreset } from '../../types/dashboard-navigation';
import type { RecentActivityItem, RecentActivitySummary, RecentActivityWindow } from '../../state/selectors';
import { formatDate } from '../../utils/date';

const WINDOW_OPTIONS: Array<{ value: RecentActivityWindow; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: 'last_7_days', label: 'Last 7 Days' },
  { value: 'this_week', label: 'This Week' },
];

const ACTIVITY_LABELS: Record<RecentActivityItem['type'], string> = {
  task_complete: 'Win',
  session: 'Session',
  quick_log: 'Quick Log',
  daily_plan: 'Daily Plan',
  weekly_review: 'Weekly Review',
};

interface RecentActivityTimelineProps {
  summary: RecentActivitySummary;
  selectedWindow: RecentActivityWindow;
  onSelectWindow: (window: RecentActivityWindow) => void;
  onOpenAdvisorLane?: (advisorId: AdvisorId, preset: TaskListPreset) => void;
}

export function RecentActivityTimeline({
  summary,
  selectedWindow,
  onSelectWindow,
  onOpenAdvisorLane,
}: RecentActivityTimelineProps) {
  return (
    <section className="lab-panel mb-6 rounded-[1.75rem] border-[rgba(228,209,174,0.14)] bg-[radial-gradient(circle_at_top,_rgba(228,209,174,0.06),_rgba(19,28,38,0.96)_58%)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="lab-eyebrow text-[0.68rem]">Recent Activity</h3>
          <p className="lab-copy mt-1 max-w-2xl text-sm">
            {getTimelineDescription(summary)}
          </p>
        </div>

        <div className="lab-tab-rail">
          {WINDOW_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => onSelectWindow(option.value)}
              className="lab-tab"
              data-active={selectedWindow === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <ActivityStat label="Wins" value={summary.counts.completedTasks} tone={summary.counts.completedTasks > 0 ? 'success' : 'neutral'} />
        <ActivityStat label="Sessions" value={summary.counts.sessions} tone={summary.counts.sessions > 0 ? 'primary' : 'neutral'} />
        <ActivityStat label="Quick Logs" value={summary.counts.quickLogs} tone={summary.counts.quickLogs > 0 ? 'primary' : 'neutral'} />
        <ActivityStat label="Planning Loops" value={summary.counts.rituals} tone={summary.counts.rituals > 0 ? 'attention' : 'neutral'} />
      </div>

      <div className="lab-subpanel mt-4 p-4">
        {summary.items.length === 0 ? (
          <div className="lab-empty-state px-3 py-8 text-center">
            <p className="text-sm text-[color:var(--lab-text-muted)]">{getEmptyStateLabel(summary)}</p>
            <p className="mt-1 text-xs text-[color:var(--lab-text-dim)]">
              {summary.scopeAdvisorName
                ? 'Completed tasks, sessions, and quick logs for this advisor will appear here.'
                : 'Completed tasks, sessions, quick logs, and planning rituals will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {summary.items.map(item => {
              const advisorId = item.advisorId;
              const plannerShortcut = item.plannerShortcut;

              return (
                <article key={item.id} className="relative pl-5">
                  <span
                    className="absolute left-0 top-2 h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.advisorColor ?? '#94a3b8' }}
                  />
                  <div className="absolute left-[4px] top-5 bottom-[-18px] w-px bg-gray-800 last:hidden" />

                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm text-[color:var(--lab-text)]">{item.title}</p>
                        <span
                          className="rounded-full px-2 py-0.5 text-[11px]"
                          style={{
                            backgroundColor: item.advisorColor ? `${item.advisorColor}20` : 'rgba(148, 163, 184, 0.15)',
                            color: item.advisorColor ?? '#cbd5e1',
                          }}
                        >
                          {item.advisorIcon && item.advisorName ? `${item.advisorIcon} ${item.advisorName}` : 'Planning'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-[color:var(--lab-text-muted)]">{item.detail}</p>
                      {advisorId && plannerShortcut && onOpenAdvisorLane && (
                        <button
                          type="button"
                          onClick={() => onOpenAdvisorLane(advisorId as AdvisorId, plannerShortcut.preset)}
                          className="lab-action lab-action--blue mt-2"
                        >
                          {`Open ${plannerShortcut.label} (${plannerShortcut.count})`}
                        </button>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--lab-text-dim)]">
                        {ACTIVITY_LABELS[item.type]}
                      </p>
                      <p className="mt-1 text-xs text-[color:var(--lab-text-muted)]">{formatOccurredAt(item)}</p>
                    </div>
                  </div>
                </article>
              );
            })}

            {summary.remainingCount > 0 ? (
              <p className="border-t border-[color:var(--lab-border-muted)] pt-3 text-xs text-[color:var(--lab-text-dim)]">
                {summary.remainingCount} more activit{summary.remainingCount === 1 ? 'y' : 'ies'} in this window.
              </p>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}

function ActivityStat({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: number;
  tone?: 'neutral' | 'primary' | 'success' | 'attention';
}) {
  const toneClasses = {
    neutral: 'border-[color:var(--lab-border-muted)] bg-[rgba(8,11,17,0.86)] text-[color:var(--lab-text)]',
    primary: 'border-[rgba(92,138,214,0.24)] bg-[rgba(92,138,214,0.12)] text-[#c2d6ff]',
    success: 'border-[rgba(117,200,167,0.24)] bg-[rgba(117,200,167,0.12)] text-[color:var(--lab-success)]',
    attention: 'border-[rgba(228,209,174,0.24)] bg-[rgba(228,209,174,0.1)] text-[color:var(--lab-gold)]',
  } as const;

  return (
    <div className={`rounded-lg border px-3 py-3 ${toneClasses[tone]}`}>
      <p className="text-xs uppercase tracking-wide text-[color:var(--lab-text-dim)]">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function formatOccurredAt(item: RecentActivityItem): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(item.occurredAt)) {
    return formatDate(item.occurredDate);
  }

  return new Date(item.occurredAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getTimelineDescription(summary: RecentActivitySummary): string {
  if (summary.scopeAdvisorName) {
    return `A compact timeline of actual movement for ${summary.scopeAdvisorName} so this advisor sweep reflects recent momentum, not unrelated activity.`;
  }

  return 'A compact timeline of actual movement so the dashboard reflects what happened, not just what is still open.';
}

function getEmptyStateLabel(summary: RecentActivitySummary): string {
  if (summary.scopeAdvisorName) {
    return `No activity captured for ${summary.scopeAdvisorName} in ${summary.windowLabel.toLowerCase()} yet.`;
  }

  return `No activity captured in ${summary.windowLabel.toLowerCase()} yet.`;
}
