import { getAllCompassScreens } from '../lib/compass-flow';
import type {
  CompassAnswers,
  CompassInsights,
  CompassSessionDetail,
} from '../types/compass';

export const COMPASS_TEST_INSIGHTS: CompassInsights = {
  annualGoals: [
    'Ship The L.A.B. with calm, durable execution',
    'Stabilize money without shrinking ambition',
    'Protect a stronger body and clearer baseline',
  ],
  dailyRituals: [
    'Make the plan before opening inboxes',
    'Move my body before noon',
    'Review the day before shutting down',
  ],
  supportPeople: [
    'Therapist',
    'Training partner',
    'Close friend who tells the truth kindly',
  ],
};

export const COMPASS_TEST_SCREEN_VALUES: Record<string, string | string[] | Record<string, string>> = {
  'preflight-rules': {
    alone: 'true',
    time: 'true',
    phone: 'true',
    open: 'true',
  },
  'bonfire-write': [
    'Need to simplify my commitments before they start owning the week.',
    'Lingering money pressure is taking up too much background bandwidth.',
  ],
  'past-highlights': [
    'Shipped a more coherent version of The L.A.B.',
    'Protected more honest relationships instead of overperforming.',
  ],
  'past-proud': 'I kept rebuilding momentum even when the pace felt messy.',
  'past-challenges': 'Fragmented attention kept turning simple weeks into expensive ones.',
  'past-lessons': 'I need fewer priorities, more visible constraints, and faster honesty with myself.',
  'past-compassion-box': 'I am ready to stop dragging old false starts into every new plan.',
  'future-brainstorm': 'A calm business, stronger body, steadier money, and work that feels precise instead of frantic.',
  'future-essentials': [
    'My weeks feel deliberate instead of reactive.',
    'Financial pressure is lower because the system is simpler.',
    'My health has a real floor, not just bursts of effort.',
  ],
  'perfect-day-overview': 'I wake up clear, know the few things that matter, and move through the day without hidden panic.',
  'perfect-day-body': 'My body feels awake, strong, and lightly energized instead of stiff or overcaffeinated.',
  'perfect-day-work': 'Focused creative work, clean decisions, and enough space to finish what I start.',
  'perfect-day-relationships': 'I am warm, available, and not half-elsewhere when I am with people I love.',
  'top-3-goals': {
    goal1: COMPASS_TEST_INSIGHTS.annualGoals[0],
    goal2: COMPASS_TEST_INSIGHTS.annualGoals[1],
    goal3: COMPASS_TEST_INSIGHTS.annualGoals[2],
  },
  'morning-routine': {
    routine1: COMPASS_TEST_INSIGHTS.dailyRituals[0],
    routine2: COMPASS_TEST_INSIGHTS.dailyRituals[1],
    routine3: COMPASS_TEST_INSIGHTS.dailyRituals[2],
  },
  'financial-help': 'A tighter runway plan, weekly cash visibility, and fewer parallel bets.',
  'health-help': 'Strength training, sleep boundaries, and simple meal defaults.',
  'relationship-help': 'Direct conversations, protected time, and less defensive busyness.',
  'vulnerability-partners': {
    person1: COMPASS_TEST_INSIGHTS.supportPeople[0],
    person2: COMPASS_TEST_INSIGHTS.supportPeople[1],
    person3: COMPASS_TEST_INSIGHTS.supportPeople[2],
  },
  'point-a': 'Right now I have momentum, but too much drag from scattered commitments and avoidable context switching.',
  'point-b': 'A year defined by calmer execution, stronger finances, and a body that feels reliable again.',
  'challenges-obstacles': [
    'Too many active threads at once',
    'Stress-driven overcommitment',
    'Letting ambiguity sit too long before making the hard call',
  ],
  'movie-title': 'The Quiet Rebuild',
  'final-commitment': {
    name: 'Richie Sater',
    signature: 'I choose this year on purpose and I am willing to act like it.',
  },
};

function mapCompassTestValueToAnswer(value: string | string[] | Record<string, string>): Record<string, string> {
  if (typeof value === 'string') {
    return { main: value };
  }

  if (Array.isArray(value)) {
    return { items: JSON.stringify(value) };
  }

  return value;
}

export function createCompassTestAnswers(): CompassAnswers {
  return Object.fromEntries(
    Object.entries(COMPASS_TEST_SCREEN_VALUES).map(([screenId, value]) => [
      screenId,
      mapCompassTestValueToAnswer(value),
    ]),
  );
}

export function getCompassScreenIndex(screenId: string): number {
  const index = getAllCompassScreens().findIndex(screen => screen.id === screenId);

  if (index === -1) {
    throw new Error(`Unknown Compass screen id: ${screenId}`);
  }

  return index;
}

export function createCompassTestSession(
  overrides: Partial<CompassSessionDetail> = {},
): CompassSessionDetail {
  const planningYear = overrides.planningYear ?? new Date().getFullYear();
  const status = overrides.status ?? 'in_progress';

  return {
    id: overrides.id ?? 'compass-test-session',
    title: overrides.title ?? `Golden Compass ${planningYear}`,
    planningYear,
    status,
    currentScreen: overrides.currentScreen ?? 0,
    answerCount: overrides.answerCount ?? Object.keys(overrides.answers ?? createCompassTestAnswers()).length,
    createdAt: overrides.createdAt ?? '2026-04-11T12:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-04-11T12:15:00.000Z',
    completedAt: overrides.completedAt ?? (status === 'completed' ? '2026-04-11T12:20:00.000Z' : null),
    insights: overrides.insights ?? (status === 'completed' ? COMPASS_TEST_INSIGHTS : null),
    answers: overrides.answers ?? createCompassTestAnswers(),
  };
}
