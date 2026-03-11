import { describe, it, expect, vi } from 'vitest';
import { createDefaultAdvisorState, createDefaultAppState, loadAppStateFromSupabase, saveAppStateToSupabase } from '../init';
import { ALL_ADVISOR_IDS } from '../../advisors/registry';
import type { SupabaseStorageService } from '../../storage/supabase-storage';
import type { AdvisorId } from '../../types/advisor';

function createMockStorage(overrides: Partial<SupabaseStorageService> = {}): SupabaseStorageService {
  return {
    userId: 'test-user-123',
    loadAdvisorState: vi.fn().mockResolvedValue(null),
    saveAdvisorState: vi.fn().mockResolvedValue(undefined),
    loadSharedMetrics: vi.fn().mockResolvedValue({}),
    saveSharedMetrics: vi.fn().mockResolvedValue(undefined),
    loadQuickLogs: vi.fn().mockResolvedValue([]),
    saveQuickLogs: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as SupabaseStorageService;
}

describe('createDefaultAdvisorState', () => {
  it('creates a clean state with no sessions for new advisors', () => {
    const state = createDefaultAdvisorState('prioritization');

    expect(state.advisorId).toBe('prioritization');
    expect(state.activated).toBe(false);
    expect(state.sessions).toEqual([]);
    expect(state.lastSessionDate).toBeNull();
    expect(state.lastSessionSummary).toBeNull();
    expect(state.streak).toBe(0);
    expect(state.narrative).toBe('');
    expect(state.metricsHistory).toEqual([]);
    expect(state.contextForNextSession).toBeNull();
    expect(state.cardPreview).toBeNull();
  });

  it('sets nextDueDate to today', () => {
    const state = createDefaultAdvisorState('career');
    expect(state.nextDueDate).toBeTruthy();
    // Should be a valid date string (YYYY-MM-DD)
    expect(state.nextDueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('copies initial action items from config', () => {
    const state = createDefaultAdvisorState('prioritization');
    expect(state.actionItems.length).toBeGreaterThan(0);
  });
});

describe('createDefaultAppState', () => {
  it('creates default state for all 7 advisors', () => {
    const state = createDefaultAppState();
    expect(Object.keys(state.advisors)).toHaveLength(ALL_ADVISOR_IDS.length);

    for (const id of ALL_ADVISOR_IDS) {
      expect(state.advisors[id]).toBeDefined();
      expect(state.advisors[id].activated).toBe(false);
      expect(state.advisors[id].sessions).toEqual([]);
    }
  });

  it('starts with empty shared metrics and quick logs', () => {
    const state = createDefaultAppState();
    expect(state.sharedMetrics).toEqual({});
    expect(state.quickLogs).toEqual([]);
  });

  it('marks state as initialized', () => {
    const state = createDefaultAppState();
    expect(state.initialized).toBe(true);
  });
});

describe('loadAppStateFromSupabase', () => {
  it('returns default state when Supabase has no data (new account)', async () => {
    const mockStorage = createMockStorage();

    const state = await loadAppStateFromSupabase(mockStorage);

    // Every advisor should have defaults
    for (const id of ALL_ADVISOR_IDS) {
      expect(state.advisors[id].activated).toBe(false);
      expect(state.advisors[id].sessions).toEqual([]);
      expect(state.advisors[id].lastSessionDate).toBeNull();
    }
    expect(state.sharedMetrics).toEqual({});
    expect(state.quickLogs).toEqual([]);
  });

  it('loads existing advisor state from Supabase', async () => {
    const savedState = {
      ...createDefaultAdvisorState('prioritization'),
      activated: true,
      sessions: [{ id: 'sess-1', date: '2025-01-01' }],
      lastSessionDate: '2025-01-01',
    };

    const mockStorage = createMockStorage({
      loadAdvisorState: vi.fn().mockImplementation((id: AdvisorId) =>
        id === 'prioritization' ? Promise.resolve(savedState) : Promise.resolve(null),
      ),
    });

    const state = await loadAppStateFromSupabase(mockStorage);

    expect(state.advisors.prioritization.activated).toBe(true);
    expect(state.advisors.prioritization.sessions).toHaveLength(1);
    // Other advisors should still have defaults
    expect(state.advisors.career.activated).toBe(false);
    expect(state.advisors.career.sessions).toEqual([]);
  });

  it('queries all advisors in parallel', async () => {
    const mockStorage = createMockStorage();

    await loadAppStateFromSupabase(mockStorage);

    expect(mockStorage.loadAdvisorState).toHaveBeenCalledTimes(ALL_ADVISOR_IDS.length);
    for (const id of ALL_ADVISOR_IDS) {
      expect(mockStorage.loadAdvisorState).toHaveBeenCalledWith(id);
    }
  });
});

describe('saveAppStateToSupabase', () => {
  it('saves all advisor states, metrics, and logs', async () => {
    const mockStorage = createMockStorage();
    const state = createDefaultAppState();

    await saveAppStateToSupabase(mockStorage, state);

    expect(mockStorage.saveAdvisorState).toHaveBeenCalledTimes(ALL_ADVISOR_IDS.length);
    expect(mockStorage.saveSharedMetrics).toHaveBeenCalledWith(state.sharedMetrics);
    expect(mockStorage.saveQuickLogs).toHaveBeenCalledWith(state.quickLogs);
  });
});
