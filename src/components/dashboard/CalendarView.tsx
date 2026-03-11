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
  const { state } = useAppState();
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
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      {/* Month header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-sm font-medium text-gray-200">
          {getMonthLabel(currentMonth.year, currentMonth.month)}
        </h3>
        <button
          onClick={nextMonth}
          className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map(day => {
          const dayEvents = eventsByDate[day.date] || [];
          const isToday = day.date === todayStr;
          const isSelected = day.date === selectedDate;
          const hasScheduled = dayEvents.some(e => e.type === 'scheduled');

          // Deduplicate event dots by advisor color
          const uniqueColors = [...new Set(dayEvents.map(e => e.advisorColor))];

          return (
            <button
              key={day.date}
              onClick={() => setSelectedDate(isSelected ? null : day.date)}
              className={`p-1.5 rounded-lg text-sm min-h-[52px] flex flex-col items-center transition-colors ${
                day.isCurrentMonth ? 'text-gray-300' : 'text-gray-600'
              } ${isToday ? 'ring-1 ring-blue-500' : ''} ${
                isSelected ? 'bg-gray-800' : 'hover:bg-gray-800/50'
              }`}
            >
              <span className="text-xs">{parseInt(day.date.split('-')[2])}</span>
              {/* Event dots */}
              {uniqueColors.length > 0 && (
                <div className="flex gap-0.5 mt-1 justify-center flex-wrap">
                  {uniqueColors.slice(0, 4).map((color, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${hasScheduled ? 'ring-1 ring-blue-400' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selectedDate && (
        <DayDetailPanel date={selectedDate} events={eventsByDate[selectedDate] || []} />
      )}
    </div>
  );
}
