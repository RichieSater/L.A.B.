export const MAX_WEEKLY_REVIEW_HISTORY_WEEKS = 12;

export interface WeeklyReviewEntry {
  weekStart: string;
  completedAt: string | null;
  biggestWin: string;
  biggestLesson: string;
  nextWeekNote: string;
}

export interface WeeklyReviewState {
  entries: WeeklyReviewEntry[];
}

export type WeeklyReviewField = keyof Pick<
  WeeklyReviewEntry,
  'biggestWin' | 'biggestLesson' | 'nextWeekNote'
>;

export function createWeeklyReviewEntry(weekStart: string): WeeklyReviewEntry {
  return {
    weekStart,
    completedAt: null,
    biggestWin: '',
    biggestLesson: '',
    nextWeekNote: '',
  };
}

export function createDefaultWeeklyReviewState(): WeeklyReviewState {
  return {
    entries: [],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object';
}

function normalizeWeeklyReviewEntry(value: unknown): WeeklyReviewEntry | null {
  if (!isRecord(value) || typeof value.weekStart !== 'string') {
    return null;
  }

  return {
    weekStart: value.weekStart,
    completedAt: typeof value.completedAt === 'string' ? value.completedAt : null,
    biggestWin: typeof value.biggestWin === 'string' ? value.biggestWin : '',
    biggestLesson: typeof value.biggestLesson === 'string' ? value.biggestLesson : '',
    nextWeekNote: typeof value.nextWeekNote === 'string' ? value.nextWeekNote : '',
  };
}

export function sortWeeklyReviewEntries(entries: WeeklyReviewEntry[]): WeeklyReviewEntry[] {
  return [...entries]
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart))
    .slice(0, MAX_WEEKLY_REVIEW_HISTORY_WEEKS);
}

export function normalizeWeeklyReviewState(value: unknown): WeeklyReviewState {
  if (!isRecord(value)) {
    return createDefaultWeeklyReviewState();
  }

  if (Array.isArray(value.entries)) {
    return {
      entries: sortWeeklyReviewEntries(
        value.entries
          .map(entry => normalizeWeeklyReviewEntry(entry))
          .filter((entry): entry is WeeklyReviewEntry => entry !== null),
      ),
    };
  }

  if (typeof value.lastCompletedWeekStart === 'string') {
    return {
      entries: [
        {
          ...createWeeklyReviewEntry(value.lastCompletedWeekStart),
          completedAt: typeof value.completedAt === 'string' ? value.completedAt : null,
        },
      ],
    };
  }

  return createDefaultWeeklyReviewState();
}
