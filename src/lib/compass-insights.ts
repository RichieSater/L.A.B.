import type { CompassAdvisorContext, CompassAnswers, CompassInsights } from '../types/compass.js';
import { parseCompassListAnswer, resolveCompassListItems } from './compass-answer-normalization.js';

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

function trimCompassAnswer(value: string | undefined, limit: number): string {
  const normalized = value?.trim() ?? '';

  if (normalized.length <= limit) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(limit - 3, 0)).trimEnd()}...`;
}

function trimCompassList(values: string[]): string[] {
  return values
    .map(value => trimCompassAnswer(value, ADVISOR_CONTEXT_LIST_ITEM_LIMIT))
    .filter(Boolean);
}

function firstNonEmptyValue(
  answers: CompassAnswers,
  selectors: Array<{ screenId: string; key?: string }>,
  limit = ADVISOR_CONTEXT_TEXT_LIMIT,
): string {
  for (const selector of selectors) {
    const value = answers[selector.screenId]?.[selector.key ?? 'main'];
    if (value?.trim()) {
      return trimCompassAnswer(value, limit);
    }
  }

  return '';
}

function firstNonEmptyList(
  answers: CompassAnswers,
  selectors: Array<{ screenId: string; key?: string; keys?: string[]; legacyInputKeys?: string[] }>,
): string[] {
  for (const selector of selectors) {
    if (selector.keys?.length) {
      const values = collectValues(answers[selector.screenId], selector.keys);
      if (values.length > 0) {
        return trimCompassList(values);
      }
      continue;
    }

    const values = resolveCompassListItems(answers[selector.screenId], {
      key: selector.key ?? 'items',
      legacyInputKeys: selector.legacyInputKeys,
    });
    if (values.length > 0) {
      return trimCompassList(values);
    }
  }

  return [];
}

function firstNonEmptyMonthlyEventList(
  answers: CompassAnswers,
  selectors: Array<{ screenId: string; keys: string[] }>,
): string[] {
  for (const selector of selectors) {
    const values = selector.keys.flatMap(key =>
      parseCompassListAnswer(answers[selector.screenId]?.[key]),
    );

    if (values.length > 0) {
      return trimCompassList(values);
    }
  }

  return [];
}

function firstNonEmptyChallengeList(answers: CompassAnswers): string[] {
  const structuredChallenges = resolveCompassListItems(answers['past-challenges'], {
    key: 'challenges',
    legacyInputKeys: ['challenge1', 'challenge2', 'challenge3'],
  });
  if (structuredChallenges.length > 0) {
    return trimCompassList(structuredChallenges);
  }

  const legacyChallenge = firstNonEmptyValue(
    answers,
    [{ screenId: 'past-challenges' }, { screenId: 'past-challenges', key: 'main' }],
    ADVISOR_CONTEXT_LIST_ITEM_LIMIT,
  );
  return legacyChallenge ? [legacyChallenge] : [];
}

export function countCompassAnswers(answers: CompassAnswers): number {
  return Object.values(answers).reduce<number>((count, record) => {
    return (
      count +
      Object.entries(record).filter(([key, value]) => {
        if (!value) {
          return false;
        }

        if (value === 'true' || value === 'false') {
          return key === 'includeCurrentMonth' ? true : value === 'true';
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
  const annualGoals = resolveCompassListItems(answers['top-3-goals'], {
    key: 'goals',
    legacyInputKeys: ['goal1', 'goal2', 'goal3'],
  });
  const dailyRituals = resolveCompassListItems(answers['morning-routine'], {
    key: 'rituals',
    legacyInputKeys: ['routine1', 'routine2', 'routine3'],
  });
  const supportPeople = uniqueValues([
    ...collectValues(answers['financial-help'], ['main']),
    ...collectValues(answers['health-help'], ['main']),
    ...collectValues(answers['relationship-help'], ['main']),
    ...resolveCompassListItems(answers['vulnerability-partners'], {
      key: 'people',
      legacyInputKeys: ['person1', 'person2', 'person3'],
    }),
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

export function extractCompassAdvisorContext(input: {
  sessionId: string;
  planningYear: number;
  completedAt: string;
  answers: CompassAnswers;
}): CompassAdvisorContext {
  const { answers } = input;
  const monthlyHighlights = firstNonEmptyMonthlyEventList(answers, [
    {
      screenId: 'past-monthly-events',
      keys: ['month1', 'month2', 'month3', 'month4', 'month5', 'month6', 'month7', 'month8', 'month9', 'month10', 'month11', 'month12'],
    },
  ]);

  return {
    sessionId: input.sessionId,
    planningYear: input.planningYear,
    completedAt: input.completedAt,
    bonfire: {
      items: firstNonEmptyList(answers, [{ screenId: 'bonfire-write' }]),
      releaseFeeling: firstNonEmptyValue(answers, [{ screenId: 'bonfire-release' }]),
      releaseWords: firstNonEmptyList(answers, [{ screenId: 'bonfire-release-words', keys: ['word1', 'word2', 'word3'] }]),
    },
    past: {
      highlights: monthlyHighlights.length > 0 ? monthlyHighlights : firstNonEmptyList(answers, [{ screenId: 'past-highlights' }]),
      yearSnapshot: {
        workLife: firstNonEmptyValue(answers, [{ screenId: 'past-highlights', key: 'workLife' }]),
        relationships: firstNonEmptyValue(answers, [{ screenId: 'past-highlights', key: 'relationships' }]),
        health: firstNonEmptyValue(answers, [{ screenId: 'past-highlights', key: 'health' }]),
      },
      bestThing: firstNonEmptyValue(answers, [{ screenId: 'past-lessons', key: 'bestThing' }]),
      biggestLesson: firstNonEmptyValue(answers, [
        { screenId: 'past-lessons', key: 'biggestLesson' },
        { screenId: 'past-lessons' },
      ]),
      proud: firstNonEmptyValue(answers, [
        { screenId: 'past-lessons', key: 'proud' },
        { screenId: 'past-proud' },
      ]),
      yearWords: firstNonEmptyList(answers, [{ screenId: 'past-lessons', keys: ['word1', 'word2', 'word3'] }]),
      goldenMoments: firstNonEmptyList(answers, [{ screenId: 'past-golden-moments', key: 'main' }]),
      biggestChallenges: firstNonEmptyChallengeList(answers),
      challengeSupport: firstNonEmptyList(answers, [{ screenId: 'past-challenges', key: 'support' }]),
      challengeLessons: firstNonEmptyList(answers, [{ screenId: 'past-challenges', key: 'lessons' }]),
      notProud: firstNonEmptyValue(answers, [{ screenId: 'past-challenges', key: 'notProud' }]),
      selfForgiveness: firstNonEmptyList(answers, [{ screenId: 'past-compassion-box', key: 'main' }]),
    },
    future: {
      perfectDayBrainstorm: firstNonEmptyList(answers, [{ screenId: 'future-brainstorm', key: 'main' }]),
      nextYearSummary: {
        workLife: firstNonEmptyValue(answers, [{ screenId: 'future-next-year', key: 'workLife' }]),
        relationships: firstNonEmptyValue(answers, [{ screenId: 'future-next-year', key: 'relationships' }]),
        health: firstNonEmptyValue(answers, [{ screenId: 'future-next-year', key: 'health' }]),
      },
    },
    perfectDay: {
      wakeTime: firstNonEmptyValue(answers, [{ screenId: 'perfect-day-morning', key: 'wakeTime' }]),
      bodyFeeling: firstNonEmptyValue(answers, [
        { screenId: 'perfect-day-morning', key: 'bodyFeeling' },
        { screenId: 'perfect-day-body' },
      ]),
      firstThoughts: firstNonEmptyList(answers, [{ screenId: 'perfect-day-morning', key: 'firstThoughts' }]),
      morningView: firstNonEmptyValue(answers, [{ screenId: 'perfect-day-morning', key: 'morningView' }]),
      location: firstNonEmptyValue(answers, [{ screenId: 'perfect-day-morning', key: 'location' }]),
      salesMessage: firstNonEmptyValue(answers, [{ screenId: 'perfect-day-morning', key: 'salesMessage' }]),
      autonomyFeeling: firstNonEmptyValue(answers, [{ screenId: 'perfect-day-plans', key: 'autonomyFeeling' }]),
      workPlans: firstNonEmptyList(answers, [{ screenId: 'perfect-day-plans', key: 'workPlans' }]),
      funPlans: firstNonEmptyList(answers, [{ screenId: 'perfect-day-plans', key: 'funPlans' }]),
      mirrorView: firstNonEmptyValue(answers, [{ screenId: 'perfect-day-style', key: 'mirrorView' }]),
      selfImageFeeling: firstNonEmptyValue(answers, [{ screenId: 'perfect-day-style', key: 'selfImageFeeling' }]),
      outfit: firstNonEmptyValue(answers, [{ screenId: 'perfect-day-style', key: 'outfit' }]),
      outfitFeeling: firstNonEmptyValue(answers, [{ screenId: 'perfect-day-style', key: 'outfitFeeling' }]),
      breakfast: firstNonEmptyValue(answers, [{ screenId: 'perfect-day-midday', key: 'breakfast' }]),
      dayNarrative: firstNonEmptyValue(answers, [
        { screenId: 'perfect-day-midday', key: 'dayNarrative' },
        { screenId: 'perfect-day-overview' },
      ]),
      spendingAccount: firstNonEmptyValue(answers, [{ screenId: 'perfect-day-money', key: 'spendingAccount' }]),
      financialFreedomFeeling: firstNonEmptyValue(answers, [{ screenId: 'perfect-day-money', key: 'financialFreedomFeeling' }]),
      charity: firstNonEmptyValue(answers, [{ screenId: 'perfect-day-money', key: 'charity' }]),
      givingBack: firstNonEmptyValue(answers, [{ screenId: 'perfect-day-difference', key: 'givingBack' }]),
      weekendTrip: firstNonEmptyValue(answers, [{ screenId: 'perfect-day-difference', key: 'weekendTrip' }]),
      weekendActivities: firstNonEmptyList(answers, [{ screenId: 'perfect-day-difference', key: 'weekendActivities' }]),
      weekendFood: firstNonEmptyValue(answers, [{ screenId: 'perfect-day-home', key: 'weekendFood' }]),
      homeAtmosphere: firstNonEmptyValue(answers, [{ screenId: 'perfect-day-home', key: 'homeAtmosphere' }]),
      windowView: firstNonEmptyValue(answers, [{ screenId: 'perfect-day-home', key: 'windowView' }]),
      houseHighlights: firstNonEmptyList(answers, [{ screenId: 'perfect-day-home', key: 'houseHighlights' }]),
      garageHighlights: firstNonEmptyList(answers, [{ screenId: 'perfect-day-home', key: 'garageHighlights' }]),
      specialSomeoneMessage: firstNonEmptyValue(answers, [{ screenId: 'perfect-day-evening', key: 'specialSomeoneMessage' }]),
      nightClose: firstNonEmptyValue(answers, [
        { screenId: 'perfect-day-evening', key: 'nightClose' },
        { screenId: 'perfect-day-relationships' },
      ]),
      gratitude: firstNonEmptyList(answers, [
        {
          screenId: 'perfect-day-evening',
          key: 'gratitude',
          legacyInputKeys: ['word1', 'word2', 'word3'],
        },
      ]),
      compassFeeling: firstNonEmptyValue(answers, [{ screenId: 'perfect-day-feeling' }]),
    },
    lightingPath: {
      environmentJoy: firstNonEmptyList(answers, [
        {
          screenId: 'lighting-environment-joy',
          key: 'environmentJoy',
          legacyInputKeys: ['joy1', 'joy2', 'joy3'],
        },
      ]),
      financialSupport: firstNonEmptyValue(answers, [{ screenId: 'financial-help' }]),
      healthSupport: firstNonEmptyValue(answers, [{ screenId: 'health-help' }]),
      relationshipSupport: firstNonEmptyValue(answers, [{ screenId: 'relationship-help' }]),
      lettingGo: firstNonEmptyList(answers, [{ screenId: 'lighting-boundaries', key: 'lettingGo' }]),
      sayingNo: firstNonEmptyList(answers, [{ screenId: 'lighting-boundaries', key: 'sayingNo' }]),
      guiltFreeEnjoyment: firstNonEmptyList(answers, [{ screenId: 'lighting-boundaries', key: 'guiltFreeEnjoyment' }]),
      supportPeople: firstNonEmptyList(answers, [
        {
          screenId: 'vulnerability-partners',
          key: 'people',
          legacyInputKeys: ['person1', 'person2', 'person3'],
        },
      ]),
      placesToVisit: firstNonEmptyList(answers, [
        {
          screenId: 'lighting-places',
          key: 'places',
          legacyInputKeys: ['place1', 'place2', 'place3'],
        },
      ]),
      lovedOnes: firstNonEmptyList(answers, [
        {
          screenId: 'lighting-loved-ones',
          key: 'lovedOnes',
          legacyInputKeys: ['loved1', 'loved2', 'loved3'],
        },
      ]),
      selfRewards: firstNonEmptyList(answers, [
        {
          screenId: 'lighting-self-rewards',
          key: 'rewards',
          legacyInputKeys: ['reward1', 'reward2', 'reward3'],
        },
      ]),
    },
    goldenPath: {
      pointA: firstNonEmptyList(answers, [{ screenId: 'point-a', key: 'main' }]),
      pointB: firstNonEmptyList(answers, [{ screenId: 'point-b', key: 'main' }]),
      obstacles: firstNonEmptyList(answers, [{ screenId: 'challenges-obstacles' }]),
      pleasurableProcess: firstNonEmptyList(answers, [{ screenId: 'golden-path-process', key: 'pleasure' }]),
      fasterHelp: firstNonEmptyList(answers, [{ screenId: 'golden-path-process', key: 'help' }]),
      finalNotes: firstNonEmptyValue(answers, [{ screenId: 'golden-path-final-notes', key: 'finalNotes' }]),
      movieTitle: firstNonEmptyValue(answers, [{ screenId: 'movie-title' }]),
      timeCapsuleLocation: firstNonEmptyValue(answers, [{ screenId: 'time-capsule-reflection', key: 'location' }]),
      timeCapsuleFeeling: firstNonEmptyValue(answers, [{ screenId: 'time-capsule-reflection', key: 'feeling' }]),
    },
  };
}
