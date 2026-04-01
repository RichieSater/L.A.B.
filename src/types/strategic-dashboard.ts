import type { AdvisorId } from './advisor';

export const STRATEGIC_DASHBOARD_SECTION_KEYS = [
  'biggestGoals',
  'landmarkVision',
  'yearGoals',
  'quarterGoals',
  'monthGoals',
] as const;

export type StrategicDashboardSectionKey = (typeof STRATEGIC_DASHBOARD_SECTION_KEYS)[number];
export type StrategicGoalSource = 'manual' | 'compass';

export interface StrategicGoalLinkedTask {
  advisorId: AdvisorId;
  taskId: string;
}

export interface StrategicGoal {
  id: string;
  text: string;
  completed: boolean;
  source: StrategicGoalSource;
  linkedTask: StrategicGoalLinkedTask | null;
}

export interface StrategicDashboardSection {
  key: StrategicDashboardSectionKey;
  label: string;
  description: string;
  goals: StrategicGoal[];
}

export interface StrategicCompassInsights {
  annualGoals: string[];
  dailyRituals: string[];
  supportPeople: string[];
}

export interface StrategicDashboardYear {
  year: number;
  sections: Record<StrategicDashboardSectionKey, StrategicDashboardSection>;
  currentWins: string[];
  previousWins: string[];
}

export interface StrategicDashboardState {
  years: StrategicDashboardYear[];
  latestCompassInsights: StrategicCompassInsights | null;
}

const GOAL_SLOT_COUNT = 3;
const WIN_SLOT_COUNT = 3;

const SECTION_METADATA: Record<
  StrategicDashboardSectionKey,
  { label: string; description: string }
> = {
  biggestGoals: {
    label: 'Biggest Goals',
    description: 'Name the outcomes that would make this season feel meaningfully different.',
  },
  landmarkVision: {
    label: 'Landmark Vision',
    description: 'Capture the scenes, standards, and proof that the future direction is becoming real.',
  },
  yearGoals: {
    label: 'Year Goals',
    description: 'Turn the annual direction into concrete outcomes worth protecting this year.',
  },
  quarterGoals: {
    label: 'Quarter Goals',
    description: 'Define the few moves that matter this quarter so the week stays anchored.',
  },
  monthGoals: {
    label: 'Month Goals',
    description: 'Keep the current month honest with a short list of visible near-term priorities.',
  },
};

function createGoalId(year: number, sectionKey: StrategicDashboardSectionKey, index: number): string {
  return `strat-${year}-${sectionKey}-${index + 1}`;
}

function createStrategicGoal(
  year: number,
  sectionKey: StrategicDashboardSectionKey,
  index: number,
): StrategicGoal {
  return {
    id: createGoalId(year, sectionKey, index),
    text: '',
    completed: false,
    source: 'manual',
    linkedTask: null,
  };
}

function normalizeGoal(
  year: number,
  sectionKey: StrategicDashboardSectionKey,
  index: number,
  goal: Partial<StrategicGoal> | undefined,
): StrategicGoal {
  const fallback = createStrategicGoal(year, sectionKey, index);

  return {
    id: goal?.id ?? fallback.id,
    text: typeof goal?.text === 'string' ? goal.text : fallback.text,
    completed: goal?.completed ?? fallback.completed,
    source: goal?.source ?? fallback.source,
    linkedTask:
      goal?.linkedTask &&
      typeof goal.linkedTask.advisorId === 'string' &&
      typeof goal.linkedTask.taskId === 'string'
        ? goal.linkedTask
        : fallback.linkedTask,
  };
}

function createSection(
  year: number,
  sectionKey: StrategicDashboardSectionKey,
): StrategicDashboardSection {
  return {
    key: sectionKey,
    label: SECTION_METADATA[sectionKey].label,
    description: SECTION_METADATA[sectionKey].description,
    goals: Array.from({ length: GOAL_SLOT_COUNT }, (_, index) =>
      createStrategicGoal(year, sectionKey, index),
    ),
  };
}

function normalizeSection(
  year: number,
  sectionKey: StrategicDashboardSectionKey,
  section: Partial<StrategicDashboardSection> | undefined,
): StrategicDashboardSection {
  const fallback = createSection(year, sectionKey);
  const rawGoals = Array.isArray(section?.goals) ? section.goals : [];

  return {
    key: sectionKey,
    label: typeof section?.label === 'string' ? section.label : fallback.label,
    description:
      typeof section?.description === 'string' ? section.description : fallback.description,
    goals: Array.from({ length: GOAL_SLOT_COUNT }, (_, index) =>
      normalizeGoal(year, sectionKey, index, rawGoals[index]),
    ),
  };
}

function normalizeWinValues(values: unknown): string[] {
  const rawValues = Array.isArray(values) ? values : [];
  return Array.from({ length: WIN_SLOT_COUNT }, (_, index) =>
    typeof rawValues[index] === 'string' ? rawValues[index] : '',
  );
}

export function createStrategicDashboardYear(year: number): StrategicDashboardYear {
  return {
    year,
    sections: STRATEGIC_DASHBOARD_SECTION_KEYS.reduce(
      (sections, sectionKey) => {
        sections[sectionKey] = createSection(year, sectionKey);
        return sections;
      },
      {} as Record<StrategicDashboardSectionKey, StrategicDashboardSection>,
    ),
    currentWins: Array.from({ length: WIN_SLOT_COUNT }, () => ''),
    previousWins: Array.from({ length: WIN_SLOT_COUNT }, () => ''),
  };
}

export function normalizeStrategicDashboardYear(
  value: Partial<StrategicDashboardYear> | undefined,
): StrategicDashboardYear {
  const year =
    typeof value?.year === 'number' && Number.isFinite(value.year)
      ? value.year
      : new Date().getFullYear();
  const fallback = createStrategicDashboardYear(year);
  const rawSections: Partial<Record<StrategicDashboardSectionKey, Partial<StrategicDashboardSection>>> =
    value?.sections ?? {};

  return {
    year,
    sections: STRATEGIC_DASHBOARD_SECTION_KEYS.reduce(
      (sections, sectionKey) => {
        sections[sectionKey] = normalizeSection(year, sectionKey, rawSections[sectionKey]);
        return sections;
      },
      {} as Record<StrategicDashboardSectionKey, StrategicDashboardSection>,
    ),
    currentWins: normalizeWinValues(value?.currentWins ?? fallback.currentWins),
    previousWins: normalizeWinValues(value?.previousWins ?? fallback.previousWins),
  };
}

export function createDefaultStrategicDashboardState(): StrategicDashboardState {
  return {
    years: [createStrategicDashboardYear(new Date().getFullYear())],
    latestCompassInsights: null,
  };
}

export function normalizeStrategicDashboardState(
  value: Partial<StrategicDashboardState> | undefined,
): StrategicDashboardState {
  const years = Array.isArray(value?.years) ? value.years.map(normalizeStrategicDashboardYear) : [];

  return {
    years:
      years.length > 0
        ? years.sort((a, b) => b.year - a.year)
        : createDefaultStrategicDashboardState().years,
    latestCompassInsights: value?.latestCompassInsights
      ? {
          annualGoals: Array.isArray(value.latestCompassInsights.annualGoals)
            ? value.latestCompassInsights.annualGoals.filter(
                (item): item is string => typeof item === 'string',
              )
            : [],
          dailyRituals: Array.isArray(value.latestCompassInsights.dailyRituals)
            ? value.latestCompassInsights.dailyRituals.filter(
                (item): item is string => typeof item === 'string',
              )
            : [],
          supportPeople: Array.isArray(value.latestCompassInsights.supportPeople)
            ? value.latestCompassInsights.supportPeople.filter(
                (item): item is string => typeof item === 'string',
              )
            : [],
        }
      : null,
  };
}

export function getStrategicDashboardYear(
  state: StrategicDashboardState,
  year: number,
): StrategicDashboardYear {
  return state.years.find(entry => entry.year === year) ?? createStrategicDashboardYear(year);
}
