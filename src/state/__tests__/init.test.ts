import { describe, it, expect, vi } from 'vitest';
import {
  createDefaultAdvisorState,
  createDefaultAppState,
  loadAppStateFromStorage,
  saveAppStateToStorage,
  type AppPersistence,
} from '../init';
import { ALL_ADVISOR_IDS } from '../../advisors/registry';
import type { AdvisorId } from '../../types/advisor';

function createMockStorage(overrides: Partial<AppPersistence> = {}): AppPersistence {
  return {
    loadAdvisorState: vi.fn().mockResolvedValue(null),
    saveAdvisorState: vi.fn().mockResolvedValue(undefined),
    loadSharedMetrics: vi.fn().mockResolvedValue({}),
    saveSharedMetrics: vi.fn().mockResolvedValue(undefined),
    loadQuickLogs: vi.fn().mockResolvedValue([]),
    saveQuickLogs: vi.fn().mockResolvedValue(undefined),
    loadTaskPlanning: vi.fn().mockResolvedValue({}),
    saveTaskPlanning: vi.fn().mockResolvedValue(undefined),
    loadDailyPlanning: vi.fn().mockResolvedValue({
      entries: [],
    }),
    saveDailyPlanning: vi.fn().mockResolvedValue(undefined),
    loadWeeklyFocus: vi.fn().mockResolvedValue({
      weeks: [],
    }),
    saveWeeklyFocus: vi.fn().mockResolvedValue(undefined),
    loadWeeklyReview: vi.fn().mockResolvedValue({
      entries: [],
    }),
    saveWeeklyReview: vi.fn().mockResolvedValue(undefined),
    loadStrategicDashboard: vi.fn().mockResolvedValue({
      years: [],
      activeCompassSessionId: null,
      latestCompassInsights: null,
      latestCompassAdvisorContext: null,
      achievedCompassSummaries: [],
    }),
    saveStrategicDashboard: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('createDefaultAdvisorState', () => {
  it('creates a clean V3 advisor state', () => {
    const state = createDefaultAdvisorState('prioritization');

    expect(state.advisorId).toBe('prioritization');
    expect(state.tasks.length).toBeGreaterThan(0);
    expect(state.habits).toEqual([]);
    expect(state.checkInConfig).toBeDefined();
    expect(state.sessions).toEqual([]);
  });
});

describe('createDefaultAppState', () => {
  it('creates default state for all advisors', () => {
    const state = createDefaultAppState();
    expect(Object.keys(state.advisors)).toHaveLength(ALL_ADVISOR_IDS.length);
    expect(state.taskPlanning).toEqual({});
    expect(state.dailyPlanning).toEqual({
      entries: [],
    });
    expect(state.weeklyFocus).toEqual({
      weeks: [],
    });
    expect(state.weeklyReview).toEqual({
      entries: [],
    });
    expect(state.strategicDashboard).toEqual({
      years: [],
      activeCompassSessionId: null,
      latestCompassInsights: null,
      latestCompassAdvisorContext: null,
      achievedCompassSummaries: [],
    });
  });
});

describe('loadAppStateFromStorage', () => {
  it('returns default state when storage is empty', async () => {
    const mockStorage = createMockStorage();
    const state = await loadAppStateFromStorage(mockStorage);

    for (const id of ALL_ADVISOR_IDS) {
      expect(Array.isArray(state.advisors[id].tasks)).toBe(true);
      expect(state.advisors[id].habits).toEqual([]);
    }
    expect(state.taskPlanning).toEqual({});
    expect(state.dailyPlanning).toEqual({
      entries: [],
    });
    expect(state.weeklyFocus).toEqual({
      weeks: [],
    });
    expect(state.weeklyReview).toEqual({
      entries: [],
    });
    expect(state.strategicDashboard).toEqual({
      years: [],
      activeCompassSessionId: null,
      latestCompassInsights: null,
      latestCompassAdvisorContext: null,
      achievedCompassSummaries: [],
    });
  });

  it('loads existing advisor state from storage', async () => {
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

    const state = await loadAppStateFromStorage(mockStorage);
    expect(state.advisors.prioritization.activated).toBe(true);
    expect(state.advisors.prioritization.sessions).toHaveLength(1);
  });
});

describe('saveAppStateToStorage', () => {
  it('saves all advisor states, metrics, logs, and task planning metadata', async () => {
    const mockStorage = createMockStorage();
    const state = createDefaultAppState();

    await saveAppStateToStorage(mockStorage, state);

    expect(mockStorage.saveAdvisorState).toHaveBeenCalledTimes(ALL_ADVISOR_IDS.length);
    expect(mockStorage.saveSharedMetrics).toHaveBeenCalledWith(state.sharedMetrics);
    expect(mockStorage.saveQuickLogs).toHaveBeenCalledWith(state.quickLogs);
    expect(mockStorage.saveTaskPlanning).toHaveBeenCalledWith(state.taskPlanning);
    expect(mockStorage.saveDailyPlanning).toHaveBeenCalledWith(state.dailyPlanning);
    expect(mockStorage.saveWeeklyFocus).toHaveBeenCalledWith(state.weeklyFocus);
    expect(mockStorage.saveWeeklyReview).toHaveBeenCalledWith(state.weeklyReview);
    expect(mockStorage.saveStrategicDashboard).toHaveBeenCalledWith(state.strategicDashboard);
  });
});
