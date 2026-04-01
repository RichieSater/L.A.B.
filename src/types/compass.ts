export interface CompassInsights {
  annualGoals: string[];
  dailyRituals: string[];
  supportPeople: string[];
}

export type CompassSessionStatus = 'in_progress' | 'completed' | 'abandoned';

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
  insights: CompassInsights | null;
}
