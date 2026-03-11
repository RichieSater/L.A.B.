import type { AdvisorId, AdvisorState } from '../types/advisor';
import type { AppState } from '../types/app-state';
import { ALL_ADVISOR_IDS, ADVISOR_CONFIGS } from '../advisors/registry';
import type { SupabaseStorageService } from '../storage/supabase-storage';
import { today } from '../utils/date';

const CURRENT_SCHEMA_VERSION = 2;

export function createDefaultAdvisorState(advisorId: AdvisorId): AdvisorState {
  const config = ADVISOR_CONFIGS[advisorId];
  return {
    advisorId,
    activated: false,
    narrative: '',
    lastSessionDate: null,
    lastSessionSummary: null,
    actionItems: [...config.initialActionItems],
    metricsLatest: {},
    metricsHistory: [],
    sessions: [],
    streak: 0,
    nextDueDate: today(), // Due immediately on first setup
    contextForNextSession: null,
    cardPreview: null,
  };
}

export function createDefaultAppState(): AppState {
  const advisors = {} as Record<AdvisorId, AdvisorState>;
  for (const id of ALL_ADVISOR_IDS) {
    advisors[id] = createDefaultAdvisorState(id);
  }

  return {
    advisors,
    sharedMetrics: {},
    quickLogs: [],
    initialized: true,
    schemaVersion: CURRENT_SCHEMA_VERSION,
  };
}

export async function loadAppStateFromSupabase(
  supabaseStorage: SupabaseStorageService,
): Promise<AppState> {
  const advisors = {} as Record<AdvisorId, AdvisorState>;

  const results = await Promise.all(
    ALL_ADVISOR_IDS.map(async id => {
      const saved = await supabaseStorage.loadAdvisorState(id);
      return { id, state: saved };
    }),
  );

  for (const { id, state: saved } of results) {
    advisors[id] = saved ?? createDefaultAdvisorState(id);
  }

  const [sharedMetrics, quickLogs] = await Promise.all([
    supabaseStorage.loadSharedMetrics(),
    supabaseStorage.loadQuickLogs(),
  ]);

  return {
    advisors,
    sharedMetrics,
    quickLogs,
    initialized: true,
    schemaVersion: CURRENT_SCHEMA_VERSION,
  };
}

export async function saveAppStateToSupabase(
  supabaseStorage: SupabaseStorageService,
  state: AppState,
): Promise<void> {
  console.log('[LAB] saveAppStateToSupabase: starting...');

  const saves = ALL_ADVISOR_IDS.map(id =>
    supabaseStorage.saveAdvisorState(id, state.advisors[id])
      .then(() => console.log(`[LAB] saved advisor: ${id}`)),
  );
  saves.push(
    supabaseStorage.saveSharedMetrics(state.sharedMetrics)
      .then(() => console.log('[LAB] saved shared metrics')),
  );
  saves.push(
    supabaseStorage.saveQuickLogs(state.quickLogs)
      .then(() => console.log('[LAB] saved quick logs')),
  );

  await Promise.all(saves);
  console.log('[LAB] saveAppStateToSupabase: complete');
}
