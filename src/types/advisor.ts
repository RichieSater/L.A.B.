import type { ActionItem } from './action-item';
import type { MetricDefinition, MetricHistoryEntry } from './metrics';
import type { SessionRecord } from './session';

export type AdvisorId =
  | 'prioritization'
  | 'career'
  | 'financial'
  | 'performance'
  | 'fitness'
  | 'creativity'
  | 'therapist';

export type CadenceType = 'fixed' | 'flexible' | 'triggered';

export interface CadenceConfig {
  type: CadenceType;
  fullSession: string; // e.g. "weekly", "biweekly"
  quickLog: string; // e.g. "daily", "none"
  intervalDays: number;
  windowDays: number; // grace period before "overdue"
  boostedIntervalDays?: number; // e.g. 3.5 for 2x/week
  boostedUntil?: string; // ISO date when boosted cadence expires
}

export interface AdvisorConfig {
  id: AdvisorId;
  displayName: string;
  shortName: string;
  icon: string;
  personaPrompt: string;
  intakePrompt?: string;
  defaultCadence: CadenceConfig;
  metricDefinitions: MetricDefinition[];
  producesMetrics: string[];
  consumesMetrics: string[];
  initialActionItems: ActionItem[];
  focusAreas: string[];
  domainColor: string;
  phase: 1 | 2 | 3; // which build phase this advisor is fully configured in
}

export interface AdvisorState {
  advisorId: AdvisorId;
  activated: boolean;
  narrative: string;
  lastSessionDate: string | null;
  lastSessionSummary: string | null;
  actionItems: ActionItem[];
  metricsLatest: Record<string, number | string>;
  metricsHistory: MetricHistoryEntry[];
  sessions: SessionRecord[];
  streak: number;
  nextDueDate: string | null;
  contextForNextSession: string | null;
  cardPreview: string | null;
  customCheckInItems?: MetricDefinition[];
}
