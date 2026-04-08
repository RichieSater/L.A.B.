import type { CompassAnswers, CompassInsights } from '../types/compass.js';

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
