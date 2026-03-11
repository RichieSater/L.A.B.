import type { AdvisorId } from './advisor';

export interface ScheduleEntry {
  advisorId: AdvisorId;
  nextDueDate: string | null;
  isOverdue: boolean;
  daysUntilDue: number;
  streak: number;
  lastSessionDate: string | null;
}
