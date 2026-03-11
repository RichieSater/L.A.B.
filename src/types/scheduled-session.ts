import type { AdvisorId } from './advisor';

export type ScheduledSessionStatus = 'scheduled' | 'completed' | 'missed' | 'cancelled';

export interface ScheduledSession {
  id: string;
  advisorId: AdvisorId;
  scheduledAt: string; // ISO 8601 datetime
  windowMinutes: number; // default 60
  status: ScheduledSessionStatus;
  createdAt: string;
}
