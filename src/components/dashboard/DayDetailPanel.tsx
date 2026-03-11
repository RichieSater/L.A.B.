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
    <div className="mt-4 bg-gray-800/50 rounded-lg p-4">
      <h4 className="text-sm font-medium text-gray-200 mb-3">{formatDate(date)}</h4>

      {events.length === 0 && (
        <p className="text-xs text-gray-500">No events on this day.</p>
      )}

      {scheduled.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Scheduled Sessions</p>
          <div className="space-y-1.5">
            {scheduled.map((ev, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full ring-1 ring-blue-400" style={{ backgroundColor: ev.advisorColor }} />
                <span className="text-xs text-gray-300">{ev.label}</span>
                {ev.scheduledTime && (
                  <span className="text-xs text-blue-400 ml-auto">{formatTime(ev.scheduledTime)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {sessions.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Sessions Due</p>
          <div className="space-y-1.5">
            {sessions.map((ev, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ev.advisorColor }} />
                <span className="text-xs text-gray-300">{ev.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tasks.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Tasks Due</p>
          <div className="space-y-1.5">
            {tasks.map((ev, i) => (
              <div key={i} className="flex items-start gap-2">
                {onToggleComplete && ev.itemId ? (
                  <button
                    onClick={() => onToggleComplete(ev.advisorId, ev.itemId!)}
                    className="mt-0.5 w-4 h-4 rounded border border-gray-600 hover:border-gray-400 flex-shrink-0 flex items-center justify-center transition-colors"
                  />
                ) : (
                  <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: ev.advisorColor }} />
                )}
                <div className="min-w-0">
                  <p className="text-xs text-gray-300 line-clamp-1">{ev.label}</p>
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
    </div>
  );
}
