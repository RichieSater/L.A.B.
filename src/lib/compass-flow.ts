import type { CompassScreenDefinition, CompassSectionDefinition } from '../types/compass';

const preflightScreens: CompassScreenDefinition[] = [
  {
    id: 'preflight-welcome',
    sectionIndex: 0,
    sectionKey: 'preflight',
    sectionTitle: 'Preparation',
    type: 'interstitial',
    headline: 'Welcome to Golden Compass',
    narrativeText:
      "Over the next stretch you'll set a clear direction for the year ahead. Take your time, answer honestly, and use the space like a private workshop.",
  },
  {
    id: 'preflight-rules',
    sectionIndex: 0,
    sectionKey: 'preflight',
    sectionTitle: 'Preparation',
    type: 'checklist',
    headline: 'Before You Begin',
    narrativeText:
      "Golden Compass works best when you give it real attention instead of rushing through it between other things.",
    checklistItems: [
      { key: 'alone', label: "I'm in a quiet place where I can think clearly" },
      { key: 'time', label: "I have uninterrupted time for this session" },
      { key: 'phone', label: 'My distractions are put away' },
      { key: 'open', label: "I'm willing to be honest with myself" },
    ],
    requireAllChecked: true,
  },
  {
    id: 'preflight-ready',
    sectionIndex: 0,
    sectionKey: 'preflight',
    sectionTitle: 'Preparation',
    type: 'interstitial',
    headline: "Let's Begin",
    narrativeText:
      'Take one deep breath, release any pressure to make this perfect, and start mapping the year you actually want to build.',
  },
];

const bonfireScreens: CompassScreenDefinition[] = [
  {
    id: 'bonfire-intro',
    sectionIndex: 1,
    sectionKey: 'bonfire',
    sectionTitle: 'The Bonfire',
    type: 'interstitial',
    headline: 'Step 01: The Bonfire',
    narrativeText:
      'Start by clearing mental noise. Get the worries, unfinished loops, and background stressors out of your head and onto the page.',
  },
  {
    id: 'bonfire-write',
    sectionIndex: 1,
    sectionKey: 'bonfire',
    sectionTitle: 'The Bonfire',
    type: 'multi-input',
    questionText: "What's weighing on your mind right now?",
    placeholder: 'Add a worry, loose end, or stressor...',
    isRequired: true,
  },
  {
    id: 'bonfire-complete',
    sectionIndex: 1,
    sectionKey: 'bonfire',
    sectionTitle: 'The Bonfire',
    type: 'interstitial',
    headline: 'Leave It Here',
    narrativeText:
      'You do not need to carry all of that while you plan. Let the noise sit here so the next steps can come from clarity, not static.',
  },
];

const pastScreens: CompassScreenDefinition[] = [
  {
    id: 'past-intro',
    sectionIndex: 2,
    sectionKey: 'past',
    sectionTitle: 'The Past',
    type: 'interstitial',
    headline: 'Step 02: The Past',
    narrativeText:
      'Look backward just long enough to carry forward the right lessons instead of repeating the same year with different dates.',
  },
  {
    id: 'past-highlights',
    sectionIndex: 2,
    sectionKey: 'past',
    sectionTitle: 'The Past',
    type: 'multi-input',
    questionText: 'List the defining events, changes, wins, or losses from the past year',
    placeholder: 'Add a moment that mattered...',
    isRequired: true,
  },
  {
    id: 'past-proud',
    sectionIndex: 2,
    sectionKey: 'past',
    sectionTitle: 'The Past',
    type: 'textarea',
    questionText: 'What are you most proud of from the past year?',
    isRequired: true,
  },
  {
    id: 'past-challenges',
    sectionIndex: 2,
    sectionKey: 'past',
    sectionTitle: 'The Past',
    type: 'textarea',
    questionText: 'What challenged you most, and what did it reveal?',
    isRequired: true,
  },
  {
    id: 'past-lessons',
    sectionIndex: 2,
    sectionKey: 'past',
    sectionTitle: 'The Past',
    type: 'textarea',
    questionText: 'What did you learn about yourself that you want to carry into the next year?',
    isRequired: true,
  },
  {
    id: 'past-compassion-box',
    sectionIndex: 2,
    sectionKey: 'past',
    sectionTitle: 'The Past',
    type: 'textarea',
    headline: 'The Box of Compassion',
    narrativeText:
      'Write down the things from the past year you still judge yourself for so you can stop dragging them forward unexamined.',
    questionText: "What are you ready to forgive yourself for?",
    placeholder: 'List the mistakes, regrets, or shame you want to release...',
    isRequired: true,
  },
  {
    id: 'past-forgiveness',
    sectionIndex: 2,
    sectionKey: 'past',
    sectionTitle: 'The Past',
    type: 'ritual',
    headline: 'Let It Go',
    narrativeText:
      "Read those lines slowly. Forgive yourself for being human, and decide you don't need to re-litigate them while building what's next.",
  },
];

const futureScreens: CompassScreenDefinition[] = [
  {
    id: 'future-intro',
    sectionIndex: 3,
    sectionKey: 'future',
    sectionTitle: 'The Future',
    type: 'interstitial',
    headline: 'Step 03: The Future',
    narrativeText:
      'Now switch from cleanup to imagination. Think in vivid outcomes, not defensive compromises.',
  },
  {
    id: 'future-brainstorm',
    sectionIndex: 3,
    sectionKey: 'future',
    sectionTitle: 'The Future',
    type: 'textarea',
    questionText:
      'Brainstorm everything you would want in an incredible next year if fear and practicality were not allowed to narrow the list yet',
    placeholder: 'Write freely. Quantity first, judgment later.',
    isRequired: true,
  },
  {
    id: 'future-essentials',
    sectionIndex: 3,
    sectionKey: 'future',
    sectionTitle: 'The Future',
    type: 'multi-input',
    questionText: 'What absolutely must feel different by the end of this next year?',
    placeholder: 'Add an essential shift...',
    isRequired: true,
  },
];

const perfectDayScreens: CompassScreenDefinition[] = [
  {
    id: 'perfect-day-intro',
    sectionIndex: 4,
    sectionKey: 'perfect-day',
    sectionTitle: 'The Perfect Day',
    type: 'interstitial',
    headline: 'Step 04: The Perfect Day',
    narrativeText:
      'Describe the lived experience you want, not just the accomplishments. The year should point toward a day you genuinely want to be inside.',
  },
  {
    id: 'perfect-day-overview',
    sectionIndex: 4,
    sectionKey: 'perfect-day',
    sectionTitle: 'The Perfect Day',
    type: 'textarea',
    questionText: 'If the next year worked beautifully, what would an ideal day in that life feel like from start to finish?',
    isRequired: true,
  },
  {
    id: 'perfect-day-body',
    sectionIndex: 4,
    sectionKey: 'perfect-day',
    sectionTitle: 'The Perfect Day',
    type: 'textarea',
    questionText: 'How would your body, health, and energy feel in that day?',
    isRequired: true,
  },
  {
    id: 'perfect-day-work',
    sectionIndex: 4,
    sectionKey: 'perfect-day',
    sectionTitle: 'The Perfect Day',
    type: 'textarea',
    questionText: 'What kind of work, craft, or contribution would fill that day?',
    isRequired: true,
  },
  {
    id: 'perfect-day-relationships',
    sectionIndex: 4,
    sectionKey: 'perfect-day',
    sectionTitle: 'The Perfect Day',
    type: 'textarea',
    questionText: 'Who is around you, and how do your relationships feel in that day?',
    isRequired: true,
  },
];

const lightingScreens: CompassScreenDefinition[] = [
  {
    id: 'lighting-intro',
    sectionIndex: 5,
    sectionKey: 'lighting',
    sectionTitle: 'Lighting the Path',
    type: 'interstitial',
    headline: 'Step 05: Lighting the Path',
    narrativeText:
      'Turn the vision into a few directional commitments that LAB can actually carry forward into year-long strategy.',
  },
  {
    id: 'top-3-goals',
    sectionIndex: 5,
    sectionKey: 'lighting',
    sectionTitle: 'Lighting the Path',
    type: 'multi-short-text',
    questionText: 'These are the top 3 goals I will achieve in the next 12 months',
    inputs: [
      { key: 'goal1', placeholder: 'Goal 1' },
      { key: 'goal2', placeholder: 'Goal 2' },
      { key: 'goal3', placeholder: 'Goal 3' },
    ],
    isRequired: true,
  },
  {
    id: 'morning-routine',
    sectionIndex: 5,
    sectionKey: 'lighting',
    sectionTitle: 'Lighting the Path',
    type: 'multi-short-text',
    questionText: 'These are the three things I will do every morning to feel good about myself',
    inputs: [
      { key: 'routine1', placeholder: 'Morning ritual 1' },
      { key: 'routine2', placeholder: 'Morning ritual 2' },
      { key: 'routine3', placeholder: 'Morning ritual 3' },
    ],
    isRequired: true,
  },
  {
    id: 'financial-help',
    sectionIndex: 5,
    sectionKey: 'lighting',
    sectionTitle: 'Lighting the Path',
    type: 'textarea',
    questionText: 'Who or what will you count on to help you achieve your financial goals?',
    isRequired: true,
  },
  {
    id: 'health-help',
    sectionIndex: 5,
    sectionKey: 'lighting',
    sectionTitle: 'Lighting the Path',
    type: 'textarea',
    questionText: 'Who or what will you count on to help you achieve your health goals?',
    isRequired: true,
  },
  {
    id: 'relationship-help',
    sectionIndex: 5,
    sectionKey: 'lighting',
    sectionTitle: 'Lighting the Path',
    type: 'textarea',
    questionText: 'Who or what will you count on to help you achieve your relationship goals?',
    isRequired: true,
  },
  {
    id: 'vulnerability-partners',
    sectionIndex: 5,
    sectionKey: 'lighting',
    sectionTitle: 'Lighting the Path',
    type: 'multi-short-text',
    questionText: 'These are the three people I will call on during hard moments',
    inputs: [
      { key: 'person1', placeholder: 'Support person 1' },
      { key: 'person2', placeholder: 'Support person 2' },
      { key: 'person3', placeholder: 'Support person 3' },
    ],
    isRequired: true,
  },
];

const goldenPathScreens: CompassScreenDefinition[] = [
  {
    id: 'golden-path-intro',
    sectionIndex: 6,
    sectionKey: 'golden-path',
    sectionTitle: 'The Golden Path',
    type: 'interstitial',
    headline: 'Step 06: The Golden Path',
    narrativeText:
      'Name the distance between your current reality and the year you want so your strategy is grounded in the actual obstacles ahead.',
  },
  {
    id: 'point-a',
    sectionIndex: 6,
    sectionKey: 'golden-path',
    sectionTitle: 'The Golden Path',
    type: 'textarea',
    headline: 'Point A',
    questionText: 'Summarize where you are today in a few lines',
    isRequired: true,
  },
  {
    id: 'point-b',
    sectionIndex: 6,
    sectionKey: 'golden-path',
    sectionTitle: 'The Golden Path',
    type: 'textarea',
    headline: 'Point B',
    questionText: 'Restate the top three goals that define the year you want to build',
    prefillFrom: 'top-3-goals',
    isRequired: true,
  },
  {
    id: 'challenges-obstacles',
    sectionIndex: 6,
    sectionKey: 'golden-path',
    sectionTitle: 'The Golden Path',
    type: 'multi-input',
    questionText: 'List the major challenges or obstacles standing between Point A and Point B',
    placeholder: 'Add a challenge...',
    isRequired: true,
  },
];

const finalScreens: CompassScreenDefinition[] = [
  {
    id: 'movie-title',
    sectionIndex: 7,
    sectionKey: 'final',
    sectionTitle: 'Final Steps',
    type: 'short-text',
    questionText: 'If your next year was the title of a movie, what would it be?',
    placeholder: 'Your movie title...',
    isRequired: true,
  },
  {
    id: 'final-commitment',
    sectionIndex: 7,
    sectionKey: 'final',
    sectionTitle: 'Final Steps',
    type: 'signature',
    headline: 'Seal the Commitment',
    narrativeText:
      "Write your name as a signal that you're choosing this direction on purpose, not leaving it as another half-formed hope.",
  },
  {
    id: 'congratulations',
    sectionIndex: 7,
    sectionKey: 'final',
    sectionTitle: 'Final Steps',
    type: 'animation',
    headline: 'Compass Set',
    narrativeText:
      "You've set a direction for the year ahead. LAB can now carry the clearest goals, rituals, and support structure back into your weekly planning system.",
  },
];

export const COMPASS_FLOW: CompassSectionDefinition[] = [
  {
    index: 0,
    key: 'preflight',
    title: 'Preparation',
    subtitle: 'Get into a reflective, intentional state',
    screens: preflightScreens,
  },
  {
    index: 1,
    key: 'bonfire',
    title: 'The Bonfire',
    subtitle: 'Clear the noise first',
    screens: bonfireScreens,
  },
  {
    index: 2,
    key: 'past',
    title: 'The Past',
    subtitle: 'Extract the right lessons from the last year',
    screens: pastScreens,
  },
  {
    index: 3,
    key: 'future',
    title: 'The Future',
    subtitle: 'Dream without shrinking the vision too early',
    screens: futureScreens,
  },
  {
    index: 4,
    key: 'perfect-day',
    title: 'The Perfect Day',
    subtitle: 'Describe the life this year points toward',
    screens: perfectDayScreens,
  },
  {
    index: 5,
    key: 'lighting',
    title: 'Lighting the Path',
    subtitle: 'Turn the vision into goals, rituals, and support',
    screens: lightingScreens,
  },
  {
    index: 6,
    key: 'golden-path',
    title: 'The Golden Path',
    subtitle: 'Name the real path between today and that year',
    screens: goldenPathScreens,
  },
  {
    index: 7,
    key: 'final',
    title: 'Final Steps',
    subtitle: 'Commit to the direction you just chose',
    screens: finalScreens,
  },
];

export function getAllCompassScreens(): CompassScreenDefinition[] {
  return COMPASS_FLOW.flatMap(section => section.screens);
}

export function getTotalCompassScreens(): number {
  return getAllCompassScreens().length;
}
