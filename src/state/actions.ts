import type { AdvisorId } from '../types/advisor';
import type { AppState } from '../types/app-state';
import type { NormalizedSessionImport } from '../types/session';
import type { SharedMetricsStore } from '../types/metrics';
import type { TaskStatus } from '../types/action-item';
import type { QuickLogEntry } from '../types/quick-log';

export type AppAction =
  | { type: 'INITIALIZE'; payload: AppState }
  | { type: 'IMPORT_SESSION'; payload: { advisorId: AdvisorId; normalizedImport: NormalizedSessionImport } }
  | { type: 'UPDATE_TASK'; payload: { advisorId: AdvisorId; taskId: string; status: TaskStatus } }
  | { type: 'UPDATE_SHARED_METRICS'; payload: Partial<SharedMetricsStore> }
  | { type: 'UPDATE_ADVISOR_NARRATIVE'; payload: { advisorId: AdvisorId; narrative: string } }
  | { type: 'RESET_ADVISOR'; payload: { advisorId: AdvisorId } }
  | { type: 'ADD_QUICK_LOG'; payload: QuickLogEntry }
  | { type: 'TOGGLE_ADVISOR_ACTIVATION'; payload: { advisorId: AdvisorId } };
