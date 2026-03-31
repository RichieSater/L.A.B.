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
}

export function RecentActivityTimeline({
  summary,
  selectedWindow,
  onSelectWindow,
}: RecentActivityTimelineProps) {
  return (
    <section className="mb-6 rounded-xl border border-gray-800 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-300">Recent Activity</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            A compact timeline of actual movement so the dashboard reflects what happened, not just what is still open.
          </p>
        </div>

        <div className="flex gap-1 rounded-lg bg-gray-950/80 p-1">
          {WINDOW_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => onSelectWindow(option.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedWindow === option.value
                  ? 'bg-gray-200 text-gray-900'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
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

      <div className="mt-4 rounded-lg border border-gray-800 bg-gray-950/80 p-4">
        {summary.items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-800 px-3 py-8 text-center">
            <p className="text-sm text-gray-400">No activity captured in {summary.windowLabel.toLowerCase()} yet.</p>
            <p className="mt-1 text-xs text-gray-600">
              Completed tasks, sessions, quick logs, and planning rituals will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {summary.items.map(item => (
              <article key={item.id} className="relative pl-5">
                <span
                  className="absolute left-0 top-2 h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.advisorColor ?? '#94a3b8' }}
                />
                <div className="absolute left-[4px] top-5 bottom-[-18px] w-px bg-gray-800 last:hidden" />

                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm text-gray-100">{item.title}</p>
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
                    <p className="mt-1 text-sm text-gray-500">{item.detail}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      {ACTIVITY_LABELS[item.type]}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">{formatOccurredAt(item)}</p>
                  </div>
                </div>
              </article>
            ))}

            {summary.remainingCount > 0 ? (
              <p className="border-t border-gray-800 pt-3 text-xs text-gray-500">
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
    neutral: 'border-gray-800 bg-gray-950/70 text-gray-300',
    primary: 'border-sky-500/20 bg-sky-500/10 text-sky-200',
    success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200',
    attention: 'border-amber-500/20 bg-amber-500/10 text-amber-200',
  } as const;

  return (
    <div className={`rounded-lg border px-3 py-3 ${toneClasses[tone]}`}>
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
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
