export const MAX_DAILY_PLANNING_HISTORY_DAYS = 30;

export interface DailyPlanningEntry {
  date: string;
  completedAt: string | null;
  headline: string;
  guardrail: string;
}

export interface DailyPlanningState {
  entries: DailyPlanningEntry[];
}

export type DailyPlanningField = keyof Pick<DailyPlanningEntry, 'headline' | 'guardrail'>;

export function createDailyPlanningEntry(date: string): DailyPlanningEntry {
  return {
    date,
    completedAt: null,
    headline: '',
    guardrail: '',
  };
}

export function createDefaultDailyPlanningState(): DailyPlanningState {
  return {
    entries: [],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object';
}

function normalizeDailyPlanningEntry(value: unknown): DailyPlanningEntry | null {
  if (!isRecord(value) || typeof value.date !== 'string') {
    return null;
  }

  return {
    date: value.date,
    completedAt: typeof value.completedAt === 'string' ? value.completedAt : null,
    headline: typeof value.headline === 'string' ? value.headline : '',
    guardrail: typeof value.guardrail === 'string' ? value.guardrail : '',
  };
}

export function sortDailyPlanningEntries(entries: DailyPlanningEntry[]): DailyPlanningEntry[] {
  return [...entries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, MAX_DAILY_PLANNING_HISTORY_DAYS);
}

export function normalizeDailyPlanningState(value: unknown): DailyPlanningState {
  if (!isRecord(value) || !Array.isArray(value.entries)) {
    return createDefaultDailyPlanningState();
  }

  return {
    entries: sortDailyPlanningEntries(
      value.entries
        .map(entry => normalizeDailyPlanningEntry(entry))
        .filter((entry): entry is DailyPlanningEntry => entry !== null),
    ),
  };
}
