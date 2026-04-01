import type { AdvisorId } from './advisor';
import type { CompassInsights } from './compass';

export const STRATEGIC_DASHBOARD_SECTION_KEYS = [
  'biggestGoals',
  'landmarkVision',
  'yearGoals',
  'quarterGoals',
  'monthGoals',
] as const;

export type StrategicDashboardSectionKey = (typeof STRATEGIC_DASHBOARD_SECTION_KEYS)[number];
export type StrategicGoalSource = 'manual' | 'compass';
export type StrategicWinField = 'currentWins' | 'previousWins';

export interface StrategicGoalLinkedTaskRef {
  advisorId: AdvisorId;
  taskId: string;
}

export interface StrategicDashboardGoal {
  id: string;
  text: string;
  completed: boolean;
  source: StrategicGoalSource;
  linkedTask: StrategicGoalLinkedTaskRef | null;
}

export interface StrategicDashboardSection {
  label: string;
  description: string;
  goals: StrategicDashboardGoal[];
}

export interface StrategicDashboardYear {
  year: number;
  sections: Record<StrategicDashboardSectionKey, StrategicDashboardSection>;
  currentWins: string[];
  previousWins: string[];
  updatedAt: string;
}

export interface StrategicDashboardState {
  years: StrategicDashboardYear[];
  latestCompassInsights: CompassInsights | null;
}

const SECTION_TEMPLATES: Record<
  StrategicDashboardSectionKey,
  { label: string; description: string }
> = {
  biggestGoals: {
    label: 'Biggest goals',
    description: 'The few outcomes that would make this year feel clearly different.',
  },
  landmarkVision: {
    label: 'Landmark vision',
    description: 'Visible signals that prove the year is moving in the right direction.',
  },
  yearGoals: {
    label: 'Year goals',
    description: 'Concrete outcomes to make true before the year closes.',
  },
  quarterGoals: {
    label: 'Quarter goals',
    description: 'The limited set of goals that deserve real motion this quarter.',
  },
  monthGoals: {
    label: 'Month goals',
    description: 'Near-term moves that turn strategy into work this month.',
  },
};

function createStrategicGoalId(year: number, sectionKey: StrategicDashboardSectionKey, index: number): string {
  return `${year}-${sectionKey}-${index + 1}`;
}

function createStrategicGoal(
  year: number,
  sectionKey: StrategicDashboardSectionKey,
  index: number,
): StrategicDashboardGoal {
  return {
    id: createStrategicGoalId(year, sectionKey, index),
    text: '',
    completed: false,
    source: 'manual',
    linkedTask: null,
  };
}

function createStrategicSection(
  year: number,
  sectionKey: StrategicDashboardSectionKey,
): StrategicDashboardSection {
  return {
    ...SECTION_TEMPLATES[sectionKey],
    goals: Array.from({ length: 3 }, (_, index) => createStrategicGoal(year, sectionKey, index)),
  };
}

export function createDefaultStrategicDashboardState(): StrategicDashboardState {
  return {
    years: [],
    latestCompassInsights: null,
  };
}

export function createStrategicDashboardYear(year: number): StrategicDashboardYear {
  return {
    year,
    sections: {
      biggestGoals: createStrategicSection(year, 'biggestGoals'),
      landmarkVision: createStrategicSection(year, 'landmarkVision'),
      yearGoals: createStrategicSection(year, 'yearGoals'),
      quarterGoals: createStrategicSection(year, 'quarterGoals'),
      monthGoals: createStrategicSection(year, 'monthGoals'),
    },
    currentWins: ['', '', ''],
    previousWins: ['', '', ''],
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeStrategicDashboardYear(
  year: StrategicDashboardYear | null | undefined,
  fallbackYear: number,
): StrategicDashboardYear {
  const baseYear = createStrategicDashboardYear(year?.year ?? fallbackYear);

  if (!year) {
    return baseYear;
  }

  return {
    ...baseYear,
    ...year,
    sections: {
      biggestGoals: year.sections?.biggestGoals ?? baseYear.sections.biggestGoals,
      landmarkVision: year.sections?.landmarkVision ?? baseYear.sections.landmarkVision,
      yearGoals: year.sections?.yearGoals ?? baseYear.sections.yearGoals,
      quarterGoals: year.sections?.quarterGoals ?? baseYear.sections.quarterGoals,
      monthGoals: year.sections?.monthGoals ?? baseYear.sections.monthGoals,
    },
    currentWins: [...baseYear.currentWins].map((value, index) => year.currentWins?.[index] ?? value),
    previousWins: [...baseYear.previousWins].map((value, index) => year.previousWins?.[index] ?? value),
    updatedAt: year.updatedAt ?? baseYear.updatedAt,
  };
}

export function normalizeStrategicDashboardState(
  state: StrategicDashboardState | null | undefined,
): StrategicDashboardState {
  if (!state) {
    return createDefaultStrategicDashboardState();
  }

  return {
    years: (state.years ?? [])
      .map(year => normalizeStrategicDashboardYear(year, year?.year ?? new Date().getFullYear()))
      .sort((a, b) => b.year - a.year),
    latestCompassInsights: state.latestCompassInsights ?? null,
  };
}

export function getStrategicDashboardYear(
  state: StrategicDashboardState,
  year: number,
): StrategicDashboardYear {
  const existing = state.years.find(entry => entry.year === year);
  return normalizeStrategicDashboardYear(existing, year);
}
