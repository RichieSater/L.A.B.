import { getAllCompassScreens } from '../lib/compass-flow';
import type {
  CompassAnswerRecord,
  CompassAnswers,
  CompassInsights,
  CompassPromptDefinition,
  CompassSessionDetail,
} from '../types/compass';

type CompassTestScreenValue = string | string[] | Record<string, string>;

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

const COMPASS_TEST_SCREEN_OVERRIDES: Record<string, CompassTestScreenValue> = {
  'preflight-rules': {
    location: 'true',
    distractions: 'true',
    copy: 'true',
    calendar: 'true',
    honesty: 'true',
    music: 'true',
    beverage: 'true',
  },
  'bonfire-write': [
    'Need to simplify my commitments before they start owning the week.',
    'Lingering money pressure is taking up too much background bandwidth.',
  ],
  'bonfire-release': 'Like static leaving the room and my nervous system unclenching for the first time in a while.',
  'bonfire-release-words': {
    word1: 'lighter',
    word2: 'clearer',
    word3: 'steadier',
  },
  'past-monthly-events': {
    month1: JSON.stringify(['Protected a calmer starting point for the year.']),
    month2: JSON.stringify([
      'Shipped a more coherent version of The L.A.B.',
      'Made one clean strategic decision instead of five noisy ones.',
    ]),
    month3: JSON.stringify(['Protected more honest relationships instead of overperforming.']),
    month4: JSON.stringify(['Started sleeping and recovering more consistently.']),
  },
  'past-highlights': {
    workLife: 'Work mattered more when I simplified the active bets.',
    relationships: 'Honesty beat performance in the relationships worth keeping.',
    health: 'The basics mattered more than intensity bursts.',
  },
  'past-lessons': {
    bestThing: 'I kept building through uncertainty instead of disappearing.',
    biggestLesson: 'Fewer commitments create better weeks than more motivation ever will.',
    proud: 'I kept rebuilding momentum even when the pace felt messy.',
    word1: 'revealing',
    word2: 'demanding',
    word3: 'clarifying',
  },
  'past-golden-moments': {
    main: JSON.stringify([
      'Long calm conversations with people who mattered.',
      'Clean focused work that felt quiet instead of frantic.',
      'Moments where my body and mind both felt fully online.',
    ]),
  },
  'past-challenges': {
    challenges: JSON.stringify([
      'Fragmented attention',
      'Financial pressure',
      'Letting ambiguity sit too long',
    ]),
    support: JSON.stringify([
      'A tighter support circle',
      'Cleaner systems',
      'More direct conversations',
    ]),
    lessons: JSON.stringify([
      'I need visible constraints',
      'I need faster honesty with myself',
    ]),
    notProud: 'How often I let stress become an excuse for staying scattered.',
  },
  'past-compassion-box': {
    main: JSON.stringify([
      'Dragging old false starts into every new plan',
      'Letting shame speak louder than action',
    ]),
  },
  'future-brainstorm': {
    main: JSON.stringify([
      'A calm business',
      'A stronger body',
      'Steadier money',
      'Deeper relationships',
      'Work that feels precise instead of frantic',
    ]),
  },
  'future-next-year': {
    workLife: 'Durable creative work, cleaner money, and less reactive decision-making.',
    relationships: 'Closer, warmer, and more available relationships.',
    health: 'A stronger body and more consistent recovery.',
  },
  'perfect-day-morning': {
    wakeTime: '6:18 AM',
    bodyFeeling: 'Rested, strong, and lightly energized instead of stiff or overcaffeinated.',
    firstThoughts: JSON.stringify([
      'I know what matters',
      'I have enough time',
      'I trust the direction',
    ]),
    morningView: 'Soft light, a clean room, and the kind of calm that makes the day feel chosen.',
    location: 'New York',
    salesMessage: 'Yesterday was clean, profitable, and fully handled without frantic effort.',
  },
  'perfect-day-plans': {
    autonomyFeeling: 'Supported, trusted, and free to spend the day on the work that actually matters.',
    workPlans: JSON.stringify([
      'A long creative strategy block',
      'One sharp decision that clears a major bottleneck',
    ]),
    funPlans: JSON.stringify([
      'A walk',
      'A great lunch',
      'An adventure with someone I love',
    ]),
  },
  'perfect-day-style': {
    mirrorView: 'Someone who looks awake, capable, and fully in his own life.',
    selfImageFeeling: 'Proud, relaxed, and at home in myself.',
    outfit: 'A clean, tailored outfit that feels effortless and a little dangerous.',
    outfitFeeling: 'Precise and alive.',
  },
  'perfect-day-midday': {
    breakfast: 'A slow, healthy breakfast that tastes clean and expensive.',
    dayNarrative:
      'I move through deep work, good conversations, and a little adventure without rushing or splintering my attention.',
  },
  'perfect-day-money': {
    spendingAccount: '$148,000',
    financialFreedomFeeling: 'More generous, less defensive, and far less likely to make fear-based decisions.',
    charity: 'A local youth arts program that funds mentors, tools, and space to build.',
  },
  'perfect-day-difference': {
    givingBack: 'I fund useful work, mentor honestly, and make calmer ambition feel possible for other people.',
    weekendTrip: 'A coastal weekend away with someone I adore.',
    weekendActivities: JSON.stringify([
      'Great food',
      'Long walks',
      'A little mischief',
      'Total presence',
    ]),
  },
  'perfect-day-home': {
    weekendFood: 'Fresh food, beautiful wine, and something a little indulgent.',
    homeAtmosphere: 'Calm, warm, perfectly arranged, and carrying that just-cleaned hotel feeling.',
    windowView: 'City lights and enough distance to feel spacious.',
    houseHighlights: JSON.stringify([
      'Books',
      'Records',
      'Art',
      'Tools that make me want to build',
    ]),
    garageHighlights: JSON.stringify([
      'A car I love',
      'The gear for spontaneous escapes',
    ]),
  },
  'perfect-day-evening': {
    specialSomeoneMessage: 'Meet me upstairs. Everything is handled. I love you.',
    nightClose: 'Slow dinner, laughter, soft light, and zero urge to check out of my own life.',
    gratitude: JSON.stringify(['Love', 'Health', 'Freedom']),
  },
  'perfect-day-feeling': 'Calm, turned on, and completely aligned with the life I am building.',
  'perfect-day-commitment':
    'I trust in the direction that my compass has set for me.\nFrom this day forward, I commit, with every fibre of my being, to moving towards my perfect day.',
  'top-3-goals': {
    goals: JSON.stringify(COMPASS_TEST_INSIGHTS.annualGoals),
  },
  'morning-routine': {
    rituals: JSON.stringify(COMPASS_TEST_INSIGHTS.dailyRituals),
  },
  'lighting-environment-joy': {
    environmentJoy: JSON.stringify([
      'Beautiful light',
      'Great music',
      'A workspace that feels intentional',
    ]),
  },
  'financial-help': 'A tighter runway plan, weekly cash visibility, and fewer parallel bets.',
  'health-help': 'Strength training, sleep boundaries, and simple meal defaults.',
  'relationship-help': 'Direct conversations, protected time, and less defensive busyness.',
  'lighting-boundaries': {
    lettingGo: JSON.stringify(['Overcomplicating simple weeks', 'Performing steadiness instead of building it']),
    sayingNo: JSON.stringify(['Reactive commitments', 'Projects that only inflate noise']),
    guiltFreeEnjoyment: JSON.stringify(['Rest', 'Pleasure', 'Spending on beauty when it actually matters']),
  },
  'vulnerability-partners': {
    people: JSON.stringify(COMPASS_TEST_INSIGHTS.supportPeople),
  },
  'lighting-places': {
    places: JSON.stringify(['Tokyo', 'Lisbon', 'Big Sur']),
  },
  'lighting-loved-ones': {
    lovedOnes: JSON.stringify([
      'Take one person I love somewhere beautiful',
      'Say the hard honest thing sooner',
      'Show up without hiding behind busyness',
    ]),
  },
  'lighting-self-rewards': {
    rewards: JSON.stringify([
      'A watch I will keep forever',
      'A proper writing trip',
      'A piece of art that marks the year',
    ]),
  },
  'point-a': {
    main: JSON.stringify([
      'I have momentum.',
      'I still have too much drag from scattered commitments.',
      'Avoidable context switching is stealing a lot of energy.',
    ]),
  },
  'point-b': {
    main: JSON.stringify([
      'Calmer execution',
      'Stronger finances',
      'A body that feels reliable again',
    ]),
  },
  'challenges-obstacles': [
    'Too many active threads at once',
    'Stress-driven overcommitment',
    'Letting ambiguity sit too long before making the hard call',
  ],
  'golden-path-process': {
    pleasure: JSON.stringify([
      'Make the work visible',
      'Keep the rhythm steady',
      'Connect it to people and places I actually enjoy',
    ]),
    help: JSON.stringify([
      'Therapist',
      'Trusted peers',
      'Systems that keep the real bottleneck visible',
    ]),
  },
  'golden-path-final-notes': {
    finalNotes:
      'This year gets better when I simplify faster, tell the truth earlier, and stop waiting to feel completely ready.',
  },
  'movie-title': 'The Quiet Rebuild',
  'final-commitment': {
    name: 'Richie Sater',
    signature: 'I choose this year on purpose and I am willing to act like it.',
  },
  'time-capsule-reflection': {
    location: 'In a calmer home, with a stronger body, reading the note with a little disbelief.',
    feeling: 'Proud that I kept going and grateful that I chose clarity over noise.',
  },
};

function defaultText(screenId: string, key: string) {
  return `Test answer for ${screenId} (${key})`;
}

function createDefaultPromptValue(screenId: string, prompt: CompassPromptDefinition): CompassAnswerRecord {
  if (prompt.type === 'textarea' || prompt.type === 'short-text') {
    return { [prompt.key]: defaultText(screenId, prompt.key) };
  }

  if (prompt.type === 'multi-short-text' || prompt.type === 'multi-textarea') {
    return Object.fromEntries(
      (prompt.inputs ?? []).map(input => [input.key, defaultText(screenId, input.key)]),
    );
  }

  if (prompt.type === 'multi-input') {
    return {
      [prompt.key]: JSON.stringify([
        defaultText(screenId, `${prompt.key}-1`),
        defaultText(screenId, `${prompt.key}-2`),
      ]),
    };
  }

  if (prompt.type === 'checklist') {
    return Object.fromEntries((prompt.checklistItems ?? []).map(item => [item.key, 'true']));
  }

  if (prompt.type === 'signature') {
    return {
      name: 'Richie Sater',
      signature: 'I choose this year on purpose and I am willing to act like it.',
    };
  }

  return {};
}

function mergeAnswerRecords(records: CompassAnswerRecord[]): CompassAnswerRecord {
  return records.reduce<CompassAnswerRecord>((merged, record) => ({ ...merged, ...record }), {});
}

export function getCompassTestAnswerRecord(screenId: string): CompassAnswerRecord {
  const override = COMPASS_TEST_SCREEN_OVERRIDES[screenId];
  if (override) {
    return mapCompassTestValueToAnswer(override);
  }

  const screen = getAllCompassScreens().find(entry => entry.id === screenId);
  if (!screen?.prompts?.length) {
    return {};
  }

  return mergeAnswerRecords(screen.prompts.map(prompt => createDefaultPromptValue(screenId, prompt)));
}

function mapCompassTestValueToAnswer(value: CompassTestScreenValue): CompassAnswerRecord {
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
    getAllCompassScreens()
      .filter(screen => (screen.prompts?.length ?? 0) > 0 || Boolean(COMPASS_TEST_SCREEN_OVERRIDES[screen.id]))
      .map(screen => [screen.id, getCompassTestAnswerRecord(screen.id)]),
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
    achievedAt: overrides.achievedAt ?? null,
    isActive: overrides.isActive ?? false,
    insights: overrides.insights ?? (status === 'completed' ? COMPASS_TEST_INSIGHTS : null),
    answers: overrides.answers ?? createCompassTestAnswers(),
  };
}
