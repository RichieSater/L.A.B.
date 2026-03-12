import type { AdvisorId } from './advisor';

export type ScheduledSessionStatus = 'scheduled' | 'completed' | 'missed' | 'cancelled';
export type CalendarSyncStatus = 'disabled' | 'pending' | 'synced' | 'failed';

export interface ScheduledSession {
  id: string;
  advisorId: AdvisorId;
  scheduledAt: string; // ISO 8601 datetime
  durationMinutes: number;
  windowMinutes: number; // default 60
  status: ScheduledSessionStatus;
  calendarSyncStatus: CalendarSyncStatus;
  createdAt: string;
}
