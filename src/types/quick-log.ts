/** Quick log entries for daily metric data entry without AI */
export interface QuickLogEntry {
  advisorId: string;
  date: string;
  timestamp: string; // ISO 8601
  logs: Record<string, number | string>;
}
