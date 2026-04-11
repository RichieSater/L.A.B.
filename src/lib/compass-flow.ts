import type {
  CompassContentBlock,
  CompassPromptDefinition,
  CompassScreenDefinition,
  CompassSectionDefinition,
} from '../types/compass';

const THREE_WORD_INPUTS = [
  { key: 'word1', placeholder: 'Word 1' },
  { key: 'word2', placeholder: 'Word 2' },
  { key: 'word3', placeholder: 'Word 3' },
];

function paragraphBlock(...paragraphs: string[]): CompassContentBlock {
  return {
    paragraphs,
  };
}

function numberedBlock(...numberedItems: string[]): CompassContentBlock {
  return {
    numberedItems,
  };
}

function calloutBlock(title: string, ...paragraphs: string[]): CompassContentBlock {
  return {
    title,
    paragraphs,
    tone: 'callout',
  };
}

function quoteBlock(attribution: string, ...paragraphs: string[]): CompassContentBlock {
  return {
    paragraphs,
    attribution,
    tone: 'quote',
  };
}

function screen(
  definition: Omit<CompassScreenDefinition, 'type'> & {
    prompts?: CompassPromptDefinition[];
    type?: CompassScreenDefinition['type'];
  },
): CompassScreenDefinition {
  return {
    type: definition.type ?? 'page',
    ...definition,
  };
}

const preflightScreens: CompassScreenDefinition[] = [
  screen({
    id: 'preflight-exercise',
    sectionIndex: 0,
    sectionKey: 'preflight',
    sectionTitle: 'Preparation',
    headline: 'What Is “The Golden Compass” Exercise?',
    contentBlocks: [
      paragraphBlock(
        'What’s on your screen right now is one of the most powerful and profound activities for creating an exciting future for yourself.',
        'This application will help you plan and achieve the best year of your life just like it has for thousands of others around the world.',
        'Variations of this exercise have been proven successful by entrepreneurs, elite athletes and high achievers from all walks of life.',
        'This is the most advanced version yet.',
        'Use this tool to strip away all the noise and set the direction for your life in a very powerful way that produces reliable and remarkable results.',
        'Many people report an instant “flash” of clarity and peace as they go through this exercise.',
        'And at the end of this exercise, you will have a concrete plan so you can finally achieve your best year ever.',
      ),
      calloutBlock(
        'If you’re looking for a way to achieve clarity, direction, certainty and success…',
        'Without all the drudgery, boredom and tiresome work.',
        'Then this workbook will light your unique path and give you all the help you need.',
      ),
    ],
  }),
  screen({
    id: 'preflight-how-it-works',
    sectionIndex: 0,
    sectionKey: 'preflight',
    sectionTitle: 'Preparation',
    headline: 'How Does It Work?',
    contentBlocks: [
      paragraphBlock('It takes approximately three hours to complete, with three distinct steps:'),
      {
        bullets: [
          'Step 1 — The Bonfire: How to gain instant peace by clearing your mind of all the unnecessary noise.',
          'Step 2 — The Past: Quickly learning the lessons from your past year with compassion and objectivity so you can close the iron gate to your past.',
          'Step 3 — The Future: Setting your Golden Compass to get exactly what you want in the fastest and easiest way possible.',
        ],
      },
    ],
  }),
  screen({
    id: 'preflight-rules',
    sectionIndex: 0,
    sectionKey: 'preflight',
    sectionTitle: 'Preparation',
    headline: 'What Do I Need?',
    narrativeText: 'Complete and tick off all items before you get started.',
    contentBlocks: [
      calloutBlock(
        'Warning',
        'It is very important that you check off each of the items below, or else the process may not be as effective as it should be.',
      ),
    ],
    prompts: [
      {
        key: 'checklist',
        type: 'checklist',
        label: 'Preparation checklist',
        requireAllChecked: true,
        checklistItems: [
          { key: 'location', label: 'Find a quiet, private and inspiring location where you will be uninterrupted for 3 hours.' },
          { key: 'distractions', label: 'Turn off all distractions. (e.g. Phone. Wifi).' },
          { key: 'copy', label: 'Have the prompts in front of you and use the digital workbook slowly, one page at a time.' },
          { key: 'calendar', label: 'Have a calendar of your past year available for reference.' },
          { key: 'honesty', label: 'Bring complete openness and honesty with yourself.' },
          { key: 'music', label: 'Set up the instrumental music or sound environment you want for deep focus.' },
          { key: 'beverage', label: 'Bring coffee, tea, or any beverage you want for the next few hours.' },
        ],
      },
    ],
  }),
  screen({
    id: 'preflight-instructions',
    sectionIndex: 0,
    sectionKey: 'preflight',
    sectionTitle: 'Preparation',
    headline: 'Instructions',
    contentBlocks: [
      numberedBlock(
        'Do not read or look at the questions on the pages ahead. Instead take each page one at a time.',
        'Choose a day and time where you are relaxed and at your peak. For most people this is first thing in the morning. We recommend rising early, getting coffee, and heading straight to it with no phone, email, or anything that hinders a clear mind.',
        'Clear the rest of the day if you can so you can relax and enjoy the afterglow of the exercise.',
        'When answering the questions, go with the first answer that comes to your head. It is usually the best one.',
      ),
    ],
  }),
  screen({
    id: 'preflight-ready',
    sectionIndex: 0,
    sectionKey: 'preflight',
    sectionTitle: 'Preparation',
    headline: 'Get Ready',
    contentBlocks: [
      paragraphBlock(
        'When you’re ready…',
        'Take a deep breath.',
        'And turn the page.',
      ),
    ],
  }),
];

const bonfireScreens: CompassScreenDefinition[] = [
  screen({
    id: 'bonfire-intro',
    sectionIndex: 1,
    sectionKey: 'bonfire',
    sectionTitle: 'The Bonfire',
    headline: 'Step 01: The Bonfire',
    narrativeText: 'How to gain instant peace by clearing your mind of all the unnecessary noise.',
  }),
  screen({
    id: 'bonfire-write',
    sectionIndex: 1,
    sectionKey: 'bonfire',
    sectionTitle: 'The Bonfire',
    headline: 'Clearing Your Mind',
    contentBlocks: [
      paragraphBlock(
        'To start, we are going to clear out all the mental noise that you may be carrying.',
        'In the space below, write down all the big and little things that are causing discomfort in your life right now:',
      ),
    ],
    prompts: [
      {
        key: 'items',
        type: 'multi-input',
        label: 'What is causing discomfort in your life right now?',
        placeholder: 'Add a worry, loose end, or source of discomfort...',
        isRequired: true,
      },
    ],
  }),
  screen({
    id: 'bonfire-release',
    sectionIndex: 1,
    sectionKey: 'bonfire',
    sectionTitle: 'The Bonfire',
    contentBlocks: [
      paragraphBlock(
        'Imagine that right now, all of these big and little issues you’ve just recorded were physically thrown on to a bonfire and completely burned away.',
        'Gone.',
        'So that you finally have permission to let go of everything contained in the box on the previous page.',
      ),
    ],
    prompts: [
      {
        key: 'main',
        type: 'textarea',
        label: 'How would it feel to mentally let go of everything that’s in the box?',
        isRequired: true,
      },
    ],
  }),
  screen({
    id: 'bonfire-release-words',
    sectionIndex: 1,
    sectionKey: 'bonfire',
    sectionTitle: 'The Bonfire',
    contentBlocks: [
      paragraphBlock('Hold on to this feeling of total weightlessness as you move to the next step.'),
    ],
    prompts: [
      {
        key: 'words',
        type: 'multi-short-text',
        label: 'What are the three words that describe this feeling?',
        inputs: THREE_WORD_INPUTS,
        isRequired: true,
      },
    ],
  }),
];

const pastScreens: CompassScreenDefinition[] = [
  screen({
    id: 'past-intro',
    sectionIndex: 2,
    sectionKey: 'past',
    sectionTitle: 'The Past',
    headline: 'Step 02: The Past',
    narrativeText:
      'Quickly learning the lessons from your past year with compassion and objectivity so you can close that chapter of your life.',
  }),
  screen({
    id: 'past-months',
    sectionIndex: 2,
    sectionKey: 'past',
    sectionTitle: 'The Past',
    contentBlocks: [
      paragraphBlock(
        'In order to design your best year, we need to take an objective look at where this past twelve months has gone.',
        'Open up your calendar for this past year and note any events that had a significant impact on your life.',
        'In the blank space, write the names of the previous 12 months.',
      ),
    ],
  }),
  screen({
    id: 'past-highlights',
    sectionIndex: 2,
    sectionKey: 'past',
    sectionTitle: 'The Past',
    headline: 'The Snapshot Of Your Past Year',
    contentBlocks: [
      paragraphBlock(
        'Looking at all the significant events of the past 12 months, summarize briefly what was important to you in the following areas:',
      ),
    ],
    prompts: [
      {
        key: 'items',
        type: 'multi-input',
        label: 'Significant events, changes, wins, or losses from the past year',
        placeholder: 'Add a defining event from the last 12 months...',
        isRequired: true,
      },
      {
        key: 'snapshot',
        type: 'multi-textarea',
        label: 'Briefly summarize what was important to you',
        inputs: [
          { key: 'workLife', label: 'Work life & wealth', placeholder: 'What mattered most in work life & wealth?' },
          {
            key: 'relationships',
            label: 'Relationships, family & friends',
            placeholder: 'What mattered most in relationships, family & friends?',
          },
          { key: 'health', label: 'Health & fitness', placeholder: 'What mattered most in health & fitness?' },
        ],
        isRequired: true,
      },
    ],
  }),
  screen({
    id: 'past-lessons',
    sectionIndex: 2,
    sectionKey: 'past',
    sectionTitle: 'The Past',
    headline: 'The Lessons Of Your Past Year',
    prompts: [
      {
        key: 'bestThing',
        type: 'textarea',
        label: 'What was the best thing that happened to you this past 12 months?',
        isRequired: true,
      },
      {
        key: 'biggestLesson',
        type: 'textarea',
        label: 'What was the biggest lesson you learned?',
        isRequired: true,
      },
      {
        key: 'proud',
        type: 'textarea',
        label: 'What are you proud of yourself for?',
        isRequired: true,
      },
      {
        key: 'yearWords',
        type: 'multi-short-text',
        label: 'Three words to describe the past year',
        inputs: THREE_WORD_INPUTS,
        isRequired: true,
      },
    ],
  }),
  screen({
    id: 'past-golden-moments',
    sectionIndex: 2,
    sectionKey: 'past',
    sectionTitle: 'The Past',
    headline: 'Golden Moments',
    contentBlocks: [
      paragraphBlock(
        'What were some of the best moments in this past year? What were you feeling? What were you doing?',
        'Use your senses to re-create these moments in your mind like a movie. Sketch or describe them in rich detail below:',
      ),
    ],
    prompts: [
      {
        key: 'main',
        type: 'textarea',
        label: 'Golden moments from the last year',
        isRequired: true,
      },
    ],
  }),
  screen({
    id: 'past-challenges',
    sectionIndex: 2,
    sectionKey: 'past',
    sectionTitle: 'The Past',
    headline: 'The Challenges',
    prompts: [
      {
        key: 'challenges',
        type: 'multi-textarea',
        label: 'What are your three biggest challenges from the last year?',
        inputs: [
          { key: 'challenge1', label: 'Challenge 1', placeholder: 'Biggest challenge 1' },
          { key: 'challenge2', label: 'Challenge 2', placeholder: 'Biggest challenge 2' },
          { key: 'challenge3', label: 'Challenge 3', placeholder: 'Biggest challenge 3' },
        ],
        isRequired: true,
      },
      {
        key: 'support',
        type: 'textarea',
        label: 'What or who helped you overcome these challenges?',
        isRequired: true,
      },
      {
        key: 'lessons',
        type: 'textarea',
        label: 'What did you learn about yourself whilst overcoming these challenges?',
        isRequired: true,
      },
      {
        key: 'notProud',
        type: 'textarea',
        label: 'What are you not proud of yourself for?',
        isRequired: true,
      },
    ],
  }),
  screen({
    id: 'past-compassion-box',
    sectionIndex: 2,
    sectionKey: 'past',
    sectionTitle: 'The Past',
    headline: 'The Box Of Compassion',
    contentBlocks: [
      paragraphBlock(
        'Do you feel bad, angry, or sad about some of the things you’ve done this past year? Are there things you feel ashamed and guilty about?',
        'Write down all the things you’re not happy with from the past year:',
      ),
    ],
    prompts: [
      {
        key: 'main',
        type: 'textarea',
        label: 'What are you ready to forgive yourself for?',
        isRequired: true,
      },
    ],
  }),
  screen({
    id: 'past-forgiveness',
    sectionIndex: 2,
    sectionKey: 'past',
    sectionTitle: 'The Past',
    type: 'ritual',
    headline: 'How To Finally Let Go So You Can Move Forward',
    contentBlocks: [
      numberedBlock(
        'Look at the first item on the previous page.',
        'Spend a few seconds consciously forgiving yourself for it. Say to yourself: “It’s ok. I forgive you for this”.',
        'Allow yourself to let go of the feelings toward the things you’re not happy with.',
        'Put a big cross through it to signify that you have forgiven yourself for it and can move on.',
      ),
      paragraphBlock('Repeat the above for all the items on your list before moving to the next section.'),
    ],
  }),
];

const futureScreens: CompassScreenDefinition[] = [
  screen({
    id: 'future-intro',
    sectionIndex: 3,
    sectionKey: 'future',
    sectionTitle: 'The Future',
    headline: 'Step 03: The Future',
    narrativeText:
      'Setting your Golden Compass to get exactly what you want in the fastest and easiest way possible.',
  }),
  screen({
    id: 'future-brainstorm',
    sectionIndex: 3,
    sectionKey: 'future',
    sectionTitle: 'The Future',
    headline: 'The Future',
    contentBlocks: [
      paragraphBlock(
        'A year is made up of 365 individual days.',
        'So in order to have an amazing year you need to start with having an amazing day.',
        'Now is the time to think and dream big.',
        'In the space below, brainstorm all the things you want in an absolutely perfect day in your life without any expectations or limitations. Write, sketch, and go wild with ideas.',
      ),
    ],
    prompts: [
      {
        key: 'main',
        type: 'textarea',
        label: 'Brainstorm your absolutely perfect day',
        isRequired: true,
      },
    ],
  }),
  screen({
    id: 'future-next-year',
    sectionIndex: 3,
    sectionKey: 'future',
    sectionTitle: 'The Future',
    headline: 'My Next Year',
    contentBlocks: [
      paragraphBlock('This is what my next year will be about (briefly summarise in each area below):'),
    ],
    prompts: [
      {
        key: 'summary',
        type: 'multi-textarea',
        label: 'What your next year will be about',
        inputs: [
          { key: 'workLife', label: 'Work life & wealth', placeholder: 'What will next year be about in work life & wealth?' },
          {
            key: 'relationships',
            label: 'Relationships, family & friends',
            placeholder: 'What will next year be about in relationships, family & friends?',
          },
          { key: 'health', label: 'Health & fitness', placeholder: 'What will next year be about in health & fitness?' },
        ],
        isRequired: true,
      },
    ],
  }),
];

const perfectDayScreens: CompassScreenDefinition[] = [
  screen({
    id: 'perfect-day-intro',
    sectionIndex: 4,
    sectionKey: 'perfect-day',
    sectionTitle: 'The Perfect Day',
    headline: 'Step 04: The Perfect Day',
    contentBlocks: [
      paragraphBlock(
        'You’re now about to live your absolute perfect day from when you open your eyes in the morning to going to bed at night.',
        'For this section it’s best to use all of your senses to create a vivid image in your mind like a mental movie.',
        'Ready?',
        'Turn the page.',
      ),
    ],
  }),
  screen({
    id: 'perfect-day-morning',
    sectionIndex: 4,
    sectionKey: 'perfect-day',
    sectionTitle: 'The Perfect Day',
    contentBlocks: [
      paragraphBlock(
        'Good morning.',
        'You’ve just woken up after the perfect amount of restful sleep.',
      ),
    ],
    prompts: [
      {
        key: 'wakeTime',
        type: 'short-text',
        label: 'What time is this?',
        isRequired: true,
      },
      {
        key: 'bodyFeeling',
        type: 'textarea',
        label: 'What is the feeling of your body when you wake up?',
        isRequired: true,
      },
      {
        key: 'firstThoughts',
        type: 'textarea',
        label: 'What are the first three things that come into your head?',
        isRequired: true,
      },
      {
        key: 'morningView',
        type: 'textarea',
        label: 'When you sit up out of bed, what do you see?',
        isRequired: true,
      },
      {
        key: 'location',
        type: 'short-text',
        label: 'What city or place are you in?',
        isRequired: true,
      },
      {
        key: 'salesMessage',
        type: 'textarea',
        label: 'Your phone beeps with some sales stats for the last day. What does this message say?',
        isRequired: true,
      },
    ],
  }),
  screen({
    id: 'perfect-day-plans',
    sectionIndex: 4,
    sectionKey: 'perfect-day',
    sectionTitle: 'The Perfect Day',
    contentBlocks: [
      paragraphBlock(
        'Your phone beeps again.',
        'It’s your main assistant letting you know that everything is under control and you’re not needed for the day because your team has everything under control.',
        'Your Freedom Business grows without you like a well oiled machine.',
      ),
    ],
    prompts: [
      {
        key: 'autonomyFeeling',
        type: 'textarea',
        label: 'How does this make you feel?',
        isRequired: true,
      },
      {
        key: 'workPlans',
        type: 'textarea',
        label: 'What are the exciting work strategy plans for the day?',
        isRequired: true,
      },
      {
        key: 'funPlans',
        type: 'textarea',
        label: 'What adventure or fun plans are part of the day?',
        isRequired: true,
      },
    ],
  }),
  screen({
    id: 'perfect-day-style',
    sectionIndex: 4,
    sectionKey: 'perfect-day',
    sectionTitle: 'The Perfect Day',
    contentBlocks: [
      paragraphBlock(
        'You now jump out of bed.',
        'You look in the mirror on the way to the shower and smile to yourself.',
      ),
    ],
    prompts: [
      {
        key: 'mirrorView',
        type: 'textarea',
        label: 'What do you see?',
        isRequired: true,
      },
      {
        key: 'selfImageFeeling',
        type: 'textarea',
        label: 'How do you feel about yourself when you look in the mirror?',
        isRequired: true,
      },
      {
        key: 'outfit',
        type: 'textarea',
        label: 'You put on the coolest outfit for the day. What does this look like?',
        isRequired: true,
      },
      {
        key: 'outfitFeeling',
        type: 'textarea',
        label: 'How does this outfit make you feel?',
        isRequired: true,
      },
    ],
  }),
  screen({
    id: 'perfect-day-midday',
    sectionIndex: 4,
    sectionKey: 'perfect-day',
    sectionTitle: 'The Perfect Day',
    prompts: [
      {
        key: 'breakfast',
        type: 'textarea',
        label: 'What is your favourite healthy breakfast to start the day with? Visualise and feel how good it tastes.',
        isRequired: true,
      },
      {
        key: 'dayNarrative',
        type: 'textarea',
        label: 'Write a paragraph on how your day plays out — where you go, how you get there, who you see. Really live it in your mind and feel it in your body in the most vivid way possible.',
        isRequired: true,
      },
    ],
  }),
  screen({
    id: 'perfect-day-money',
    sectionIndex: 4,
    sectionKey: 'perfect-day',
    sectionTitle: 'The Perfect Day',
    contentBlocks: [
      paragraphBlock(
        'On your way home from your day, you pass an atm that reminds you how much money you have in your personal spending account.',
      ),
    ],
    prompts: [
      {
        key: 'spendingAccount',
        type: 'short-text',
        label: 'How much is this?',
        isRequired: true,
      },
      {
        key: 'financialFreedomFeeling',
        type: 'textarea',
        label: 'How does financial security and freedom make you feel and act in the world?',
        isRequired: true,
      },
      {
        key: 'charity',
        type: 'textarea',
        label: 'You get a calendar reminder about giving to your favourite charity. What charity is this and how does it help them?',
        isRequired: true,
      },
    ],
  }),
  screen({
    id: 'perfect-day-difference',
    sectionIndex: 4,
    sectionKey: 'perfect-day',
    sectionTitle: 'The Perfect Day',
    contentBlocks: [
      paragraphBlock('On your way home you think about the awesome trip you’re going to take this weekend.'),
    ],
    prompts: [
      {
        key: 'givingBack',
        type: 'textarea',
        label: 'Since you have financial freedom, briefly summarise the way you make a difference and “give back” to the world.',
        isRequired: true,
      },
      {
        key: 'weekendTrip',
        type: 'textarea',
        label: 'Where are you going and who are you going with?',
        isRequired: true,
      },
      {
        key: 'weekendActivities',
        type: 'textarea',
        label: 'What activities are planned for the weekend?',
        isRequired: true,
      },
    ],
  }),
  screen({
    id: 'perfect-day-home',
    sectionIndex: 4,
    sectionKey: 'perfect-day',
    sectionTitle: 'The Perfect Day',
    contentBlocks: [
      paragraphBlock(
        'You arrive back home, where everything has been cleaned and arranged exactly how you like it whilst you were out, just like a 5 star hotel.',
      ),
    ],
    prompts: [
      {
        key: 'weekendFood',
        type: 'textarea',
        label: 'What sort of food are you guys going to eat?',
        isRequired: true,
      },
      {
        key: 'homeAtmosphere',
        type: 'textarea',
        label: 'What does it look and smell like in your home?',
        isRequired: true,
      },
      {
        key: 'windowView',
        type: 'textarea',
        label: 'What can you see out the window?',
        isRequired: true,
      },
      {
        key: 'houseHighlights',
        type: 'textarea',
        label: 'What are some of the cool things in your house?',
        isRequired: true,
      },
      {
        key: 'garageHighlights',
        type: 'textarea',
        label: 'What’s in your garage?',
        isRequired: true,
      },
    ],
  }),
  screen({
    id: 'perfect-day-evening',
    sectionIndex: 4,
    sectionKey: 'perfect-day',
    sectionTitle: 'The Perfect Day',
    contentBlocks: [
      paragraphBlock(
        'You get a text message from a “special someone”…',
        'You dim the lights and climb into the most comfortable, soft bed in the world.',
        'The room is the perfect sleeping temperature.',
        'Serene, dark and silent.',
        'You smile as you close your eyes because you just lived your absolutely perfect day, and are excited to wake up and do it all again tomorrow.',
      ),
    ],
    prompts: [
      {
        key: 'specialSomeoneMessage',
        type: 'textarea',
        label: 'Who is it from and what does it say?',
        isRequired: true,
      },
      {
        key: 'nightClose',
        type: 'textarea',
        label: 'How do you finish off the rest of the night?',
        isRequired: true,
      },
      {
        key: 'gratitude',
        type: 'multi-short-text',
        label: 'What are the three things you are most grateful for that you think about as you drift off to sleep?',
        inputs: THREE_WORD_INPUTS.map((input, index) => ({
          ...input,
          placeholder: `Gratitude ${index + 1}`,
        })),
        isRequired: true,
      },
    ],
  }),
];

const calibrationScreens: CompassScreenDefinition[] = [
  screen({
    id: 'perfect-day-feeling',
    sectionIndex: 5,
    sectionKey: 'calibration',
    sectionTitle: 'Calibrating Your Golden Compass',
    headline: 'How Does Your Perfect Day Make You Feel?',
    contentBlocks: [
      paragraphBlock('Take a moment to reflect on this feeling.'),
    ],
    prompts: [
      {
        key: 'main',
        type: 'textarea',
        label: 'How does your perfect day make you feel?',
        isRequired: true,
      },
    ],
  }),
  screen({
    id: 'perfect-day-compass',
    sectionIndex: 5,
    sectionKey: 'calibration',
    sectionTitle: 'Calibrating Your Golden Compass',
    headline: 'This Is Your Golden Compass',
    contentBlocks: [
      paragraphBlock('And it’s pointing you in the right direction.'),
    ],
  }),
  screen({
    id: 'perfect-day-commitment',
    sectionIndex: 5,
    sectionKey: 'calibration',
    sectionTitle: 'Calibrating Your Golden Compass',
    headline: 'Commitment',
    contentBlocks: [
      paragraphBlock('Now it’s time for your total commitment to the direction of your compass.'),
    ],
    prompts: [
      {
        key: 'main',
        type: 'textarea',
        label: 'Write these two sentences in the box below',
        copyLines: [
          'I trust in the direction that my compass has set for me.',
          'From this day forward, I commit, with every fibre of my being, to moving towards my perfect day.',
        ],
        isRequired: true,
      },
    ],
  }),
];

const lightingScreens: CompassScreenDefinition[] = [
  screen({
    id: 'lighting-intro',
    sectionIndex: 6,
    sectionKey: 'lighting',
    sectionTitle: 'Lighting The Path',
    headline: 'Lighting The Path',
    contentBlocks: [
      paragraphBlock('Now that you’ve set your compass, let’s light a direct path for you to get there.'),
    ],
  }),
  screen({
    id: 'top-3-goals',
    sectionIndex: 6,
    sectionKey: 'lighting',
    sectionTitle: 'Lighting The Path',
    prompts: [
      {
        key: 'goals',
        type: 'multi-short-text',
        label: 'These are the top 3 goals I will achieve in the next 12 months',
        inputs: [
          { key: 'goal1', placeholder: 'Goal 1' },
          { key: 'goal2', placeholder: 'Goal 2' },
          { key: 'goal3', placeholder: 'Goal 3' },
        ],
        isRequired: true,
      },
    ],
  }),
  screen({
    id: 'morning-routine',
    sectionIndex: 6,
    sectionKey: 'lighting',
    sectionTitle: 'Lighting The Path',
    prompts: [
      {
        key: 'rituals',
        type: 'multi-short-text',
        label: 'These are the three things I will do every morning to feel good about myself',
        inputs: [
          { key: 'routine1', placeholder: 'Morning ritual 1' },
          { key: 'routine2', placeholder: 'Morning ritual 2' },
          { key: 'routine3', placeholder: 'Morning ritual 3' },
        ],
        isRequired: true,
      },
    ],
  }),
  screen({
    id: 'lighting-environment-joy',
    sectionIndex: 6,
    sectionKey: 'lighting',
    sectionTitle: 'Lighting The Path',
    prompts: [
      {
        key: 'environmentJoy',
        type: 'multi-short-text',
        label: 'I’ll use these three things to make my daily environment an absolute joy to be in',
        inputs: [
          { key: 'joy1', placeholder: 'Environment joy 1' },
          { key: 'joy2', placeholder: 'Environment joy 2' },
          { key: 'joy3', placeholder: 'Environment joy 3' },
        ],
        isRequired: true,
      },
    ],
  }),
  screen({
    id: 'financial-help',
    sectionIndex: 6,
    sectionKey: 'lighting',
    sectionTitle: 'Lighting The Path',
    prompts: [
      {
        key: 'main',
        type: 'textarea',
        label: 'This is the person or thing I will count on to help me achieve my financial goals',
        isRequired: true,
      },
    ],
  }),
  screen({
    id: 'health-help',
    sectionIndex: 6,
    sectionKey: 'lighting',
    sectionTitle: 'Lighting The Path',
    prompts: [
      {
        key: 'main',
        type: 'textarea',
        label: 'This is the person or thing I will count on to help me achieve my health goals',
        isRequired: true,
      },
    ],
  }),
  screen({
    id: 'relationship-help',
    sectionIndex: 6,
    sectionKey: 'lighting',
    sectionTitle: 'Lighting The Path',
    prompts: [
      {
        key: 'main',
        type: 'textarea',
        label: 'This is the person or thing I will count on to help me achieve my relationship goals',
        isRequired: true,
      },
    ],
  }),
  screen({
    id: 'lighting-boundaries',
    sectionIndex: 6,
    sectionKey: 'lighting',
    sectionTitle: 'Lighting The Path',
    prompts: [
      {
        key: 'lettingGo',
        type: 'multi-input',
        label: 'I’m ready to let go of these things',
        placeholder: 'Add something you are ready to let go of...',
        isRequired: true,
      },
      {
        key: 'sayingNo',
        type: 'multi-input',
        label: 'I’m ready to say no to these things',
        placeholder: 'Add something you are ready to say no to...',
        isRequired: true,
      },
      {
        key: 'guiltFreeEnjoyment',
        type: 'multi-input',
        label: 'These are the things I will allow myself to enjoy without feeling guilty',
        placeholder: 'Add a guilt-free enjoyment...',
        isRequired: true,
      },
    ],
  }),
  screen({
    id: 'vulnerability-partners',
    sectionIndex: 6,
    sectionKey: 'lighting',
    sectionTitle: 'Lighting The Path',
    prompts: [
      {
        key: 'people',
        type: 'multi-short-text',
        label: 'These are the three people I will call on, and be vulnerable with, to help me during tough times',
        inputs: [
          { key: 'person1', placeholder: 'Support person 1' },
          { key: 'person2', placeholder: 'Support person 2' },
          { key: 'person3', placeholder: 'Support person 3' },
        ],
        isRequired: true,
      },
    ],
  }),
  screen({
    id: 'lighting-places',
    sectionIndex: 6,
    sectionKey: 'lighting',
    sectionTitle: 'Lighting The Path',
    prompts: [
      {
        key: 'places',
        type: 'multi-short-text',
        label: 'Here’s the 3 places I will visit this year',
        inputs: [
          { key: 'place1', placeholder: 'Place 1' },
          { key: 'place2', placeholder: 'Place 2' },
          { key: 'place3', placeholder: 'Place 3' },
        ],
        isRequired: true,
      },
    ],
  }),
  screen({
    id: 'lighting-loved-ones',
    sectionIndex: 6,
    sectionKey: 'lighting',
    sectionTitle: 'Lighting The Path',
    prompts: [
      {
        key: 'lovedOnes',
        type: 'multi-short-text',
        label: 'Here’s the three things I will do for my loved ones',
        inputs: [
          { key: 'loved1', placeholder: 'Thing for loved ones 1' },
          { key: 'loved2', placeholder: 'Thing for loved ones 2' },
          { key: 'loved3', placeholder: 'Thing for loved ones 3' },
        ],
        isRequired: true,
      },
    ],
  }),
  screen({
    id: 'lighting-self-rewards',
    sectionIndex: 6,
    sectionKey: 'lighting',
    sectionTitle: 'Lighting The Path',
    prompts: [
      {
        key: 'rewards',
        type: 'multi-short-text',
        label: 'Here’s the three things I will buy myself as a reward this year',
        inputs: [
          { key: 'reward1', placeholder: 'Reward 1' },
          { key: 'reward2', placeholder: 'Reward 2' },
          { key: 'reward3', placeholder: 'Reward 3' },
        ],
        isRequired: true,
      },
    ],
  }),
];

const goldenPathScreens: CompassScreenDefinition[] = [
  screen({
    id: 'golden-path-intro',
    sectionIndex: 7,
    sectionKey: 'golden-path',
    sectionTitle: 'The Golden Path',
    headline: 'The Golden Path',
    contentBlocks: [
      paragraphBlock(
        'We are now going to draw a direct path to your perfect day, along with milestones to achieve this.',
        'Point A is where you are now. Point B is your perfect day.',
      ),
    ],
  }),
  screen({
    id: 'golden-path-instructions',
    sectionIndex: 7,
    sectionKey: 'golden-path',
    sectionTitle: 'The Golden Path',
    headline: 'Golden Path Instructions',
    contentBlocks: [
      numberedBlock(
        'Summarise in three lines where you are at today in point A.',
        'List the top three goals you wish to achieve from point B.',
        'List every major challenge or obstacle standing in your way along the timeline.',
      ),
      paragraphBlock('See the example on the next page.'),
    ],
  }),
  screen({
    id: 'point-a',
    sectionIndex: 7,
    sectionKey: 'golden-path',
    sectionTitle: 'The Golden Path',
    prompts: [
      {
        key: 'main',
        type: 'textarea',
        label: 'Point A — Summarise where you are at today in a few lines',
        isRequired: true,
      },
    ],
  }),
  screen({
    id: 'point-b',
    sectionIndex: 7,
    sectionKey: 'golden-path',
    sectionTitle: 'The Golden Path',
    prompts: [
      {
        key: 'main',
        type: 'textarea',
        label: 'Point B — Restate the top three goals that define the year you want to build',
        isRequired: true,
      },
    ],
    prefillFrom: 'top-3-goals',
  }),
  screen({
    id: 'challenges-obstacles',
    sectionIndex: 7,
    sectionKey: 'golden-path',
    sectionTitle: 'The Golden Path',
    prompts: [
      {
        key: 'items',
        type: 'multi-input',
        label: 'List the major challenges or obstacles standing between Point A and Point B',
        placeholder: 'Add a challenge or obstacle...',
        isRequired: true,
      },
    ],
  }),
  screen({
    id: 'golden-path-example',
    sectionIndex: 7,
    sectionKey: 'golden-path',
    sectionTitle: 'The Golden Path',
    headline: 'An Example',
    contentBlocks: [
      paragraphBlock(
        'If the big obstacle is your job or income, the first step may be to build an online business so you can quit your day job whilst being financially secure.',
        'The secret: in order to move from point A (where you are now) to point B (your perfect day), all you need to do is solve these challenges.',
      ),
    ],
  }),
  screen({
    id: 'golden-path-process',
    sectionIndex: 7,
    sectionKey: 'golden-path',
    sectionTitle: 'The Golden Path',
    contentBlocks: [
      paragraphBlock(
        'Can you see how mapping this out makes everything less scary?',
        'Can you see how this makes everything a lot more simple?',
        'Here’s how to make this even more powerful: the process can actually be easy and enjoyable.',
      ),
    ],
    prompts: [
      {
        key: 'pleasure',
        type: 'textarea',
        label: 'How can I make the process of solving this challenge fun and pleasurable for me?',
        isRequired: true,
      },
      {
        key: 'help',
        type: 'textarea',
        label: 'Who can help me solve this challenge faster and easier?',
        isRequired: true,
      },
    ],
  }),
  screen({
    id: 'golden-path-hourglass',
    sectionIndex: 7,
    sectionKey: 'golden-path',
    sectionTitle: 'The Golden Path',
    headline: 'The Hourglass Principle',
    contentBlocks: [
      quoteBlock(
        'Dale Carnegie, “How to Stop Worrying and Start Living.”',
        '“An Army doctor gave me some advice which has completely changed my life. After giving me a thorough physical examination, he informed me that my troubles were mental. "Ted", he said, "I want you to think of your life as an hourglass. You know there are thousands of grains of sand in the top of the hourglass; and they all pass slowly and evenly through the narrow neck in the middle. Nothing you or I could do would make more than one grain of sand pass through this narrow neck without impairing the hourglass. You and I and everyone else are like this hourglass. When we start in the morning, there are hundreds of tasks which we feel that we must accomplish that day, but if we do not take them one at a time and let them pass through the day slowly and evenly, as do the grains of sand passing through the narrow neck of the hourglass, then we are bound to break our own physical or mental structure.”',
      ),
      calloutBlock(
        'The Lesson',
        'Focus on the first challenge and the first step you need to take. One grain at a time.',
      ),
    ],
  }),
  screen({
    id: 'golden-path-final-notes',
    sectionIndex: 7,
    sectionKey: 'golden-path',
    sectionTitle: 'The Golden Path',
    headline: 'You’re Almost Done',
    prompts: [
      {
        key: 'finalNotes',
        type: 'textarea',
        label: 'How do you feel? Write a few final notes to yourself:',
        isRequired: true,
      },
    ],
  }),
  screen({
    id: 'movie-title',
    sectionIndex: 7,
    sectionKey: 'golden-path',
    sectionTitle: 'The Golden Path',
    prompts: [
      {
        key: 'main',
        type: 'short-text',
        label: 'If your next year was the title of a movie… what would it be?',
        placeholder: 'Your movie title...',
        isRequired: true,
      },
    ],
  }),
  screen({
    id: 'final-commitment',
    sectionIndex: 7,
    sectionKey: 'golden-path',
    sectionTitle: 'The Golden Path',
    headline: 'Sealing Your Commitment To Success',
    contentBlocks: [
      paragraphBlock(
        'This year I commit to being a source of light in the world.',
        'I will solve the challenges in front of me all the way up to achieving my perfect day.',
        'If I can achieve my perfect day, this will inspire others to reach theirs as well.',
        'Whenever I feel darkness, I will remember to check in with my Golden Compass and use it to direct me back on the path to my perfect day.',
        'This signature seals my commitment.',
      ),
    ],
    prompts: [
      {
        key: 'signature',
        type: 'signature',
        label: 'Signature',
        isRequired: true,
      },
    ],
  }),
];

const closeoutScreens: CompassScreenDefinition[] = [
  screen({
    id: 'time-capsule',
    sectionIndex: 8,
    sectionKey: 'closeout',
    sectionTitle: 'Closeout',
    headline: 'The Universal Time Capsule',
    contentBlocks: [
      paragraphBlock('One year from now, you will receive an automatic email from the universe with this workbook.'),
      numberedBlock(
        'Scan or take individual photos of the pages of this completed workbook.',
        'Upload the digital files to Google Drive or Dropbox called Golden Compass Time Capsule.',
        'Go to Futureme.org and send an email to yourself 1 year from now with the link to your folder.',
      ),
    ],
  }),
  screen({
    id: 'time-capsule-reflection',
    sectionIndex: 8,
    sectionKey: 'closeout',
    sectionTitle: 'Closeout',
    headline: 'The Universal Time Capsule',
    prompts: [
      {
        key: 'location',
        type: 'textarea',
        label: 'Where do you think you will be when you open this email?',
        isRequired: true,
      },
      {
        key: 'feeling',
        type: 'textarea',
        label: 'How will you feel when you get this email in 1 year?',
        isRequired: true,
      },
    ],
  }),
  screen({
    id: 'congratulations',
    sectionIndex: 8,
    sectionKey: 'closeout',
    sectionTitle: 'Closeout',
    type: 'animation',
    headline: 'Congratulations',
    contentBlocks: [
      paragraphBlock(
        'Well done.',
        'You should be proud of yourself.',
        'You have now set your life compass for the next year.',
        'To make this process even more successful, refer to this book daily to realign your Golden Compass.',
      ),
    ],
  }),
];

export const COMPASS_FLOW: CompassSectionDefinition[] = [
  {
    index: 0,
    key: 'preflight',
    title: 'Preparation',
    subtitle: 'Set the conditions for a deep, honest reset',
    screens: preflightScreens,
  },
  {
    index: 1,
    key: 'bonfire',
    title: 'The Bonfire',
    subtitle: 'Clear the noise before you choose direction',
    screens: bonfireScreens,
  },
  {
    index: 2,
    key: 'past',
    title: 'The Past',
    subtitle: 'Close the last year with compassion and objectivity',
    screens: pastScreens,
  },
  {
    index: 3,
    key: 'future',
    title: 'The Future',
    subtitle: 'Start dreaming the next year into focus',
    screens: futureScreens,
  },
  {
    index: 4,
    key: 'perfect-day',
    title: 'The Perfect Day',
    subtitle: 'Live the day your next year should point toward',
    screens: perfectDayScreens,
  },
  {
    index: 5,
    key: 'calibration',
    title: 'Calibrating Your Golden Compass',
    subtitle: 'Name the feeling and commit to the direction',
    screens: calibrationScreens,
  },
  {
    index: 6,
    key: 'lighting',
    title: 'Lighting The Path',
    subtitle: 'Turn the compass direction into goals, rituals, and support',
    screens: lightingScreens,
  },
  {
    index: 7,
    key: 'golden-path',
    title: 'The Golden Path',
    subtitle: 'Map the real path between today and your perfect day',
    screens: goldenPathScreens,
  },
  {
    index: 8,
    key: 'closeout',
    title: 'Closeout',
    subtitle: 'Seal the workbook and send it forward to your future self',
    screens: closeoutScreens,
  },
];

export function getAllCompassScreens(): CompassScreenDefinition[] {
  return COMPASS_FLOW.flatMap(section => section.screens);
}

export function getTotalCompassScreens(): number {
  return getAllCompassScreens().length;
}
