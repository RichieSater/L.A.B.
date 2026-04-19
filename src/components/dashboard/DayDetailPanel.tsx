import type { CalendarEvent } from '../../state/selectors';
import { formatDate } from '../../utils/date';

interface DayDetailPanelProps {
  date: string;
  events: CalendarEvent[];
  onToggleComplete?: (advisorId: string, itemId: string) => void;
}

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function DayDetailPanel({ date, events, onToggleComplete }: DayDetailPanelProps) {
  const tasks = events.filter(e => e.type === 'task');
  const sessions = events.filter(e => e.type === 'session');
  const scheduled = events.filter(e => e.type === 'scheduled');

  return (
    <aside className="lab-panel lab-panel--ink rounded-[1.75rem] p-5">
      <p className="lab-eyebrow">Selected Day</p>
      <h4 className="mt-3 text-lg font-semibold text-[color:var(--lab-text)]">{formatDate(date)}</h4>

      {events.length === 0 && (
        <p className="mt-3 text-xs text-[color:var(--lab-text-muted)]">No events on this day.</p>
      )}

      {scheduled.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--lab-text-muted)]">Scheduled Sessions</p>
          <div className="space-y-1.5">
            {scheduled.map((ev, i) => (
              <div key={i} className="flex items-center gap-2 rounded-2xl border border-[color:var(--lab-border-muted)] bg-[rgba(19,28,38,0.86)] px-3 py-2.5">
                <div className="w-2 h-2 rounded-full ring-1 ring-blue-400" style={{ backgroundColor: ev.advisorColor }} />
                <span className="text-xs text-[color:var(--lab-text)]">{ev.label}</span>
                {ev.scheduledTime && (
                  <span className="ml-auto text-xs text-[color:var(--lab-blue)]">{formatTime(ev.scheduledTime)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {sessions.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--lab-text-muted)]">Sessions Due</p>
          <div className="space-y-1.5">
            {sessions.map((ev, i) => (
              <div key={i} className="flex items-center gap-2 rounded-2xl border border-[color:var(--lab-border-muted)] bg-[rgba(19,28,38,0.86)] px-3 py-2.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ev.advisorColor }} />
                <span className="text-xs text-[color:var(--lab-text)]">{ev.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tasks.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--lab-text-muted)]">Tasks Due</p>
          <div className="space-y-1.5">
            {tasks.map((ev, i) => (
              <div key={i} className="flex items-start gap-2 rounded-2xl border border-[color:var(--lab-border-muted)] bg-[rgba(19,28,38,0.86)] px-3 py-2.5">
                {onToggleComplete && ev.itemId ? (
                  <button
                    type="button"
                    onClick={() => onToggleComplete(ev.advisorId, ev.itemId!)}
                    className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border border-[color:var(--lab-border)] transition-colors hover:border-[rgba(228,209,174,0.42)]"
                  />
                ) : (
                  <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: ev.advisorColor }} />
                )}
                <div className="min-w-0">
                  <p className="line-clamp-1 text-xs text-[color:var(--lab-text)]">{ev.label}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs" style={{ color: ev.advisorColor }}>
                      {ev.advisorIcon} {ev.advisorName}
                    </span>
                    {ev.priority && (
                      <span className={`text-xs ${
                        ev.priority === 'high' ? 'text-red-400' :
                        ev.priority === 'medium' ? 'text-yellow-400' : 'text-gray-500'
                      }`}>
                        {ev.priority}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
