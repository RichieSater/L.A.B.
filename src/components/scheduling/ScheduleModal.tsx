import { useState } from 'react';
import type { AdvisorId } from '../../types/advisor';
import { ADVISOR_CONFIGS } from '../../advisors/registry';
import { useScheduling } from '../../state/scheduling-context';
import { formatDateKey, formatTimeInputValue, today } from '../../utils/date';

interface ScheduleModalProps {
  advisorId: AdvisorId;
  taskLabel?: string;
  onScheduled?: () => void;
  onClose: () => void;
}

export function ScheduleModal({ advisorId, taskLabel, onScheduled, onClose }: ScheduleModalProps) {
  const config = ADVISOR_CONFIGS[advisorId];
  const { scheduleSession, getUpcomingSession } = useScheduling();
  const existingSession = getUpcomingSession(advisorId);
  const existingDate = existingSession ? new Date(existingSession.scheduledAt) : null;
  const [date, setDate] = useState(existingDate ? formatDateKey(existingDate) : '');
  const [time, setTime] = useState(existingDate ? formatTimeInputValue(existingDate) : '09:00');
  const [durationMinutes, setDurationMinutes] = useState(existingSession?.durationMinutes ?? 60);
  const [submitting, setSubmitting] = useState(false);

  async function handleSchedule() {
    if (!date || !time) return;

    setSubmitting(true);
    const scheduledAt = new Date(`${date}T${time}:00`).toISOString();
    await scheduleSession(advisorId, scheduledAt, durationMinutes, existingSession?.id);
    setSubmitting(false);
    onScheduled?.();
    onClose();
  }

  // Minimum date is today
  const minDate = today();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-100">
            {existingSession ? 'Reschedule' : 'Schedule'} {config.shortName} Session
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {taskLabel && (
            <div className="rounded-lg border border-blue-800/40 bg-blue-950/30 px-3 py-2">
              <p className="text-xs font-medium uppercase tracking-wide text-blue-300">Promoting planned work</p>
              <p className="mt-1 text-sm text-blue-100">{taskLabel}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              min={minDate}
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Time</label>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Duration</label>
            <select
              value={durationMinutes}
              onChange={e => setDurationMinutes(Number(e.target.value))}
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            >
              {[30, 45, 60, 90].map(minutes => (
                <option key={minutes} value={minutes}>
                  {minutes} minutes
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-gray-500">
            The session will unlock at the scheduled time and stay open for 1 hour. If Google Calendar is connected, this session event will sync there too.
          </p>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-200 bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSchedule}
            disabled={!date || !time || submitting}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 transition-colors"
          >
            {submitting ? 'Saving...' : existingSession ? 'Save Changes' : 'Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
}
