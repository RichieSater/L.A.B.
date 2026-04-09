export interface CompassInsights {
  annualGoals: string[];
  dailyRituals: string[];
  supportPeople: string[];
}

export interface CompassAdvisorPastContext {
  highlights: string[];
  proud: string;
  challenges: string;
  lessons: string;
  selfForgiveness: string;
}

export interface CompassAdvisorPerfectDayContext {
  overview: string;
  body: string;
  work: string;
  relationships: string;
}

export interface CompassAdvisorContext {
  sessionId: string;
  planningYear: number;
  completedAt: string;
  past: CompassAdvisorPastContext;
  perfectDay: CompassAdvisorPerfectDayContext;
}

export type CompassSessionStatus = 'in_progress' | 'completed' | 'abandoned';

export type CompassScreenType =
  | 'interstitial'
  | 'textarea'
  | 'short-text'
  | 'multi-short-text'
  | 'multi-textarea'
  | 'multi-input'
  | 'checklist'
  | 'ritual'
  | 'animation'
  | 'signature';

export interface CompassScreenInput {
  key: string;
  label?: string;
  placeholder?: string;
  type?: 'short' | 'long';
}

export interface CompassChecklistItem {
  key: string;
  label: string;
}

export interface CompassScreenDefinition {
  id: string;
  sectionIndex: number;
  sectionKey: string;
  sectionTitle: string;
  type: CompassScreenType;
  headline?: string;
  narrativeText?: string;
  questionText?: string;
  placeholder?: string;
  inputs?: CompassScreenInput[];
  checklistItems?: CompassChecklistItem[];
  requireAllChecked?: boolean;
  isRequired?: boolean;
  prefillFrom?: string;
}

export interface CompassSectionDefinition {
  index: number;
  key: string;
  title: string;
  subtitle: string;
  screens: CompassScreenDefinition[];
}

export type CompassAnswerRecord = Record<string, string>;
export type CompassAnswers = Record<string, CompassAnswerRecord>;

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

export interface CompassSessionDetail extends CompassSessionSummary {
  answers: CompassAnswers;
}

export interface CreateCompassSessionInput {
  planningYear: number;
}

export interface UpdateCompassSessionInput {
  currentScreen?: number;
  answers?: CompassAnswers;
  status?: CompassSessionStatus;
}
