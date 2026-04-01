import type { StrategicCompassInsights } from './strategic-dashboard';

export type CompassSessionStatus = 'in_progress' | 'completed';

export interface CompassSessionSummary {
  id: string;
  title: string;
  planningYear: number;
  status: CompassSessionStatus;
  currentScreen: number;
  answerCount: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  insights: StrategicCompassInsights | null;
}
