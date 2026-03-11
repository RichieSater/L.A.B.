import type { AdvisorId, AdvisorState } from './advisor';
import type { SharedMetricsStore } from './metrics';
import type { QuickLogEntry } from './quick-log';

export interface AppState {
  advisors: Record<AdvisorId, AdvisorState>;
  sharedMetrics: SharedMetricsStore;
  quickLogs: QuickLogEntry[];
  initialized: boolean;
  schemaVersion: number;
}
