import { useState, useMemo } from 'react';
import { useAppState } from '../../state/app-context';
import { useAuth } from '../../auth/auth-context';
import { useScheduling } from '../../state/scheduling-context';
import { selectCalendarEvents } from '../../state/selectors';
import type { CalendarEvent } from '../../state/selectors';
import { ADVISOR_CONFIGS } from '../../advisors/registry';
import type { AdvisorId } from '../../types/advisor';
import { today, getMonthDays, getMonthLabel } from '../../utils/date';
import { DayDetailPanel } from './DayDetailPanel';

export function CalendarView() {
  const { state, dispatch } = useAppState();
  const { profile } = useAuth();
  const { sessions } = useScheduling();
  const baseEvents = selectCalendarEvents(state);

  // Merge scheduled session events into calendar
  const events = useMemo(() => {
    const all = [...baseEvents];

    if (profile?.schedulingEnabled) {
      for (const s of sessions) {
        if (s.status !== 'scheduled') continue;
        const config = ADVISOR_CONFIGS[s.advisorId as AdvisorId];
        if (!config) continue;
        const date = s.scheduledAt.split('T')[0];
        all.push({
          date,
          type: 'scheduled',
          label: `${config.shortName} session scheduled`,
          advisorId: s.advisorId,
          advisorIcon: config.icon,
          advisorName: config.shortName,
          advisorColor: config.domainColor,
          scheduledTime: s.scheduledAt,
        });
      }
    }

    return all.sort((a, b) => a.date.localeCompare(b.date));
  }, [baseEvents, sessions, profile?.schedulingEnabled]);

  const handleToggleComplete = (advisorId: string, itemId: string) => {
    const advisorState = state.advisors[advisorId as AdvisorId];
    if (!advisorState) return;
    const item = advisorState.tasks.find(i => i.id === itemId);
    if (!item) return;
    dispatch({
      type: 'UPDATE_TASK',
      payload: {
        advisorId: advisorId as AdvisorId,
        taskId: itemId,
        status: item.status === 'completed' ? 'open' : 'completed',
      },
    });
  };

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const days = useMemo(
    () => getMonthDays(currentMonth.year, currentMonth.month),
    [currentMonth.year, currentMonth.month],
  );

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const event of events) {
      if (!map[event.date]) map[event.date] = [];
      map[event.date].push(event);
    }
    return map;
  }, [events]);

  const prevMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { ...prev, month: prev.month - 1 };
    });
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { ...prev, month: prev.month + 1 };
    });
    setSelectedDate(null);
  };

  const todayStr = today();

  return (
    <section className="space-y-5">
      <div className="max-w-3xl">
        <p className="lab-eyebrow">Temporal Control</p>
        <h3 className="mt-3 text-[2.2rem] font-semibold leading-none tracking-[-0.04em] text-[color:var(--lab-text)]">
          Session Calendar
        </h3>
        <p className="mt-3 text-sm leading-6 text-[color:var(--lab-text-muted)]">
          Slow the system down and read the month structurally. This view emphasizes date placement, scheduled
          sessions, and the selected-day story.
        </p>
      </div>

      <span className="lab-chip lab-chip--gold">{getMonthLabel(currentMonth.year, currentMonth.month)}</span>

      <div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
        <div className="lab-panel rounded-[1.75rem] p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <button type="button" onClick={prevMonth} className="lab-button lab-button--ghost rounded-2xl px-3">
              Prev
            </button>
            <div className="text-center">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--lab-text-muted)]">
                Month View
              </p>
              <h4 className="mt-1 text-lg font-semibold text-[color:var(--lab-text)]">
                {getMonthLabel(currentMonth.year, currentMonth.month)}
              </h4>
            </div>
            <button type="button" onClick={nextMonth} className="lab-button lab-button--ghost rounded-2xl px-3">
              Next
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-2 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div
                key={d}
                className="py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--lab-text-muted)]"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {days.map(day => {
              const dayEvents = eventsByDate[day.date] || [];
              const isToday = day.date === todayStr;
              const isSelected = day.date === selectedDate;
              const hasScheduled = dayEvents.some(e => e.type === 'scheduled');
              const uniqueColors = [...new Set(dayEvents.map(e => e.advisorColor))];

              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => setSelectedDate(isSelected ? null : day.date)}
                  className={`min-h-[5.4rem] rounded-[1rem] border px-3 py-2 text-left transition-colors ${
                    isSelected
                      ? 'border-[rgba(228,209,174,0.52)] bg-[rgba(26,34,45,0.96)]'
                      : 'border-[color:var(--lab-border-muted)] bg-[rgba(8,11,17,0.92)] hover:border-[rgba(228,209,174,0.24)]'
                  } ${day.isCurrentMonth ? 'text-[color:var(--lab-text)]' : 'text-[color:var(--lab-text-dim)]'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold ${isToday ? 'text-[color:var(--lab-gold)]' : ''}`}>
                      {parseInt(day.date.split('-')[2], 10)}
                    </span>
                    {hasScheduled && (
                      <span className="text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--lab-blue)]">
                        Live
                      </span>
                    )}
                  </div>
                  {uniqueColors.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {uniqueColors.slice(0, 4).map((color, i) => (
                        <span
                          key={i}
                          className="inline-flex h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor: color,
                            boxShadow: hasScheduled ? '0 0 0 1px rgba(92,138,214,0.6)' : undefined,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {selectedDate ? (
          <DayDetailPanel
            date={selectedDate}
            events={eventsByDate[selectedDate] || []}
            onToggleComplete={handleToggleComplete}
          />
        ) : (
          <aside className="lab-panel lab-panel--ink rounded-[1.75rem] p-5">
            <p className="lab-eyebrow">Selected Day</p>
            <h4 className="mt-3 text-lg font-semibold text-[color:var(--lab-text)]">Open a day.</h4>
            <p className="mt-2 text-sm leading-6 text-[color:var(--lab-text-muted)]">
              Choose a date to inspect scheduled sessions, due tasks, and advisor-specific activity on that day.
            </p>
          </aside>
        )}
      </div>
    </section>
  );
}
