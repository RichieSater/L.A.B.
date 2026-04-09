import type { CompassAdvisorContext, CompassAnswers, CompassInsights } from '../types/compass.js';

const ADVISOR_CONTEXT_TEXT_LIMIT = 600;
const ADVISOR_CONTEXT_LIST_ITEM_LIMIT = 180;

function collectValues(record: Record<string, string> | undefined, keys: string[]): string[] {
  return keys
    .map(key => record?.[key]?.trim() ?? '')
    .filter(Boolean);
}

function uniqueValues(values: string[]): string[] {
  return [...new Set(values.map(value => value.trim()).filter(Boolean))];
}

export function countCompassAnswers(answers: CompassAnswers): number {
  return Object.values(answers).reduce<number>((count, record) => {
    return (
      count +
      Object.values(record).filter(value => {
        if (!value) {
          return false;
        }

        if (value === 'true' || value === 'false') {
          return value === 'true';
        }

        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed.length > 0 : true;
        } catch {
          return value.trim().length > 0;
        }
      }).length
    );
  }, 0);
}

export function deriveCompassInsights(answers: CompassAnswers): CompassInsights {
  const annualGoals = collectValues(answers['top-3-goals'], ['goal1', 'goal2', 'goal3']);
  const dailyRituals = collectValues(answers['morning-routine'], ['routine1', 'routine2', 'routine3']);
  const supportPeople = uniqueValues([
    ...collectValues(answers['financial-help'], ['main']),
    ...collectValues(answers['health-help'], ['main']),
    ...collectValues(answers['relationship-help'], ['main']),
    ...collectValues(answers['vulnerability-partners'], ['person1', 'person2', 'person3']),
  ]);

  return {
    annualGoals,
    dailyRituals,
    supportPeople,
  };
}

export function createCompassSessionTitle(planningYear: number): string {
  return `Golden Compass ${planningYear}`;
}

function trimCompassAnswer(value: string | undefined, limit: number): string {
  const normalized = value?.trim() ?? '';

  if (normalized.length <= limit) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(limit - 3, 0)).trimEnd()}...`;
}

function parseStoredListAnswer(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(item => String(item)) : [];
  } catch {
    return [];
  }
}

export function extractCompassAdvisorContext(input: {
  sessionId: string;
  planningYear: number;
  completedAt: string;
  answers: CompassAnswers;
}): CompassAdvisorContext {
  const { answers } = input;

  return {
    sessionId: input.sessionId,
    planningYear: input.planningYear,
    completedAt: input.completedAt,
    past: {
      highlights: parseStoredListAnswer(answers['past-highlights']?.items)
        .map(item => trimCompassAnswer(item, ADVISOR_CONTEXT_LIST_ITEM_LIMIT))
        .filter(Boolean),
      proud: trimCompassAnswer(answers['past-proud']?.main, ADVISOR_CONTEXT_TEXT_LIMIT),
      challenges: trimCompassAnswer(answers['past-challenges']?.main, ADVISOR_CONTEXT_TEXT_LIMIT),
      lessons: trimCompassAnswer(answers['past-lessons']?.main, ADVISOR_CONTEXT_TEXT_LIMIT),
      selfForgiveness: trimCompassAnswer(answers['past-compassion-box']?.main, ADVISOR_CONTEXT_TEXT_LIMIT),
    },
    perfectDay: {
      overview: trimCompassAnswer(answers['perfect-day-overview']?.main, ADVISOR_CONTEXT_TEXT_LIMIT),
      body: trimCompassAnswer(answers['perfect-day-body']?.main, ADVISOR_CONTEXT_TEXT_LIMIT),
      work: trimCompassAnswer(answers['perfect-day-work']?.main, ADVISOR_CONTEXT_TEXT_LIMIT),
      relationships: trimCompassAnswer(answers['perfect-day-relationships']?.main, ADVISOR_CONTEXT_TEXT_LIMIT),
    },
  };
}
