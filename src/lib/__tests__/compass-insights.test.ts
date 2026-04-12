import { describe, expect, it } from 'vitest';
import { extractCompassAdvisorContext } from '../compass-insights';

describe('extractCompassAdvisorContext', () => {
  it('maps the richer PDF-faithful answers into advisor context', () => {
    const context = extractCompassAdvisorContext({
      sessionId: 'compass-1',
      planningYear: 2026,
      completedAt: '2026-04-09T12:00:00.000Z',
      answers: {
        'bonfire-write': {
          items: JSON.stringify(['Clear the noise', 'Release the old pressure']),
        },
        'bonfire-release': {
          main: 'Like breathing again.',
        },
        'bonfire-release-words': {
          word1: 'light',
          word2: 'clear',
          word3: 'steady',
        },
        'past-monthly-events': {
          month1: JSON.stringify(['Left the old job']),
          month2: JSON.stringify(['Started L.A.B.']),
        },
        'past-highlights': {
          workLife: 'Work became more honest.',
          relationships: 'I stopped performing calm.',
          health: 'My body needed consistency more than intensity.',
        },
        'past-lessons': {
          bestThing: 'I stayed in the work.',
          biggestLesson: 'Clarity is a system, not a mood.',
          proud: 'I stayed steady when things were chaotic.',
          word1: 'honest',
          word2: 'messy',
          word3: 'clarifying',
        },
        'past-golden-moments': {
          main: 'Long conversations and clean work.',
        },
        'past-challenges': {
          challenge1: 'Burnout',
          challenge2: 'Money pressure',
          challenge3: 'Context switching',
          support: 'Therapy and cleaner systems.',
          lessons: 'I need clarity before I say yes to new commitments.',
          notProud: 'How long I delayed hard conversations.',
        },
        'past-compassion-box': {
          main: 'Dragging my feet on hard conversations.',
        },
        'future-brainstorm': {
          main: 'A calm business and a stronger body.',
        },
        'future-next-year': {
          workLife: 'Useful work with less noise.',
          relationships: 'Warmer and more available.',
          health: 'Strength with recovery.',
        },
        'perfect-day-morning': {
          wakeTime: '6:18 AM',
          bodyFeeling: 'Strong and rested.',
          firstThoughts: 'I know what matters.',
          morningView: 'Soft light and a clean room.',
          location: 'New York',
          salesMessage: 'Yesterday was profitable and calm.',
        },
        'perfect-day-plans': {
          autonomyFeeling: 'Supported and free.',
          workPlans: 'A long deep-work block.',
          funPlans: 'A beautiful lunch and an adventure.',
        },
        'perfect-day-home': {
          homeAtmosphere: 'Clean and warm.',
        },
        'perfect-day-evening': {
          specialSomeoneMessage: 'Everything is handled. I love you.',
          nightClose: 'Dinner, laughter, and no urge to check out.',
          word1: 'Love',
          word2: 'Health',
          word3: 'Freedom',
        },
        'perfect-day-feeling': {
          main: 'Calm and aligned.',
        },
        'lighting-environment-joy': {
          joy1: 'Beautiful light',
          joy2: 'Great music',
          joy3: 'A clean desk',
        },
        'financial-help': {
          main: 'A clearer money system.',
        },
        'lighting-boundaries': {
          lettingGo: JSON.stringify(['Overcomplication']),
          sayingNo: JSON.stringify(['Reactive commitments']),
          guiltFreeEnjoyment: JSON.stringify(['Rest']),
        },
        'vulnerability-partners': {
          person1: 'Therapist',
          person2: 'Best friend',
          person3: 'Training partner',
        },
        'lighting-places': {
          place1: 'Tokyo',
          place2: 'Lisbon',
          place3: 'Big Sur',
        },
        'point-a': {
          main: 'Scattered momentum.',
        },
        'point-b': {
          main: 'A calmer, stronger year.',
        },
        'challenges-obstacles': {
          items: JSON.stringify(['Too many threads', 'Fear-based decisions']),
        },
        'golden-path-process': {
          pleasure: 'By making the work visible and rhythmic.',
          help: 'Trusted peers and therapy.',
        },
        'golden-path-final-notes': {
          finalNotes: 'Simplify earlier.',
        },
        'movie-title': {
          main: 'The Quiet Rebuild',
        },
        'time-capsule-reflection': {
          location: 'In a calmer home.',
          feeling: 'Proud and relieved.',
        },
      },
    });

    expect(context).toEqual({
      sessionId: 'compass-1',
      planningYear: 2026,
      completedAt: '2026-04-09T12:00:00.000Z',
      bonfire: {
        items: ['Clear the noise', 'Release the old pressure'],
        releaseFeeling: 'Like breathing again.',
        releaseWords: ['light', 'clear', 'steady'],
      },
      past: {
        highlights: ['Left the old job', 'Started L.A.B.'],
        yearSnapshot: {
          workLife: 'Work became more honest.',
          relationships: 'I stopped performing calm.',
          health: 'My body needed consistency more than intensity.',
        },
        bestThing: 'I stayed in the work.',
        biggestLesson: 'Clarity is a system, not a mood.',
        proud: 'I stayed steady when things were chaotic.',
        yearWords: ['honest', 'messy', 'clarifying'],
        goldenMoments: 'Long conversations and clean work.',
        biggestChallenges: ['Burnout', 'Money pressure', 'Context switching'],
        challengeSupport: 'Therapy and cleaner systems.',
        challengeLessons: 'I need clarity before I say yes to new commitments.',
        notProud: 'How long I delayed hard conversations.',
        selfForgiveness: 'Dragging my feet on hard conversations.',
      },
      future: {
        perfectDayBrainstorm: 'A calm business and a stronger body.',
        nextYearSummary: {
          workLife: 'Useful work with less noise.',
          relationships: 'Warmer and more available.',
          health: 'Strength with recovery.',
        },
      },
      perfectDay: {
        wakeTime: '6:18 AM',
        bodyFeeling: 'Strong and rested.',
        firstThoughts: 'I know what matters.',
        morningView: 'Soft light and a clean room.',
        location: 'New York',
        salesMessage: 'Yesterday was profitable and calm.',
        autonomyFeeling: 'Supported and free.',
        workPlans: 'A long deep-work block.',
        funPlans: 'A beautiful lunch and an adventure.',
        mirrorView: '',
        selfImageFeeling: '',
        outfit: '',
        outfitFeeling: '',
        breakfast: '',
        dayNarrative: '',
        spendingAccount: '',
        financialFreedomFeeling: '',
        charity: '',
        givingBack: '',
        weekendTrip: '',
        weekendActivities: '',
        weekendFood: '',
        homeAtmosphere: 'Clean and warm.',
        windowView: '',
        houseHighlights: '',
        garageHighlights: '',
        specialSomeoneMessage: 'Everything is handled. I love you.',
        nightClose: 'Dinner, laughter, and no urge to check out.',
        gratitude: ['Love', 'Health', 'Freedom'],
        compassFeeling: 'Calm and aligned.',
      },
      lightingPath: {
        environmentJoy: ['Beautiful light', 'Great music', 'A clean desk'],
        financialSupport: 'A clearer money system.',
        healthSupport: '',
        relationshipSupport: '',
        lettingGo: ['Overcomplication'],
        sayingNo: ['Reactive commitments'],
        guiltFreeEnjoyment: ['Rest'],
        supportPeople: ['Therapist', 'Best friend', 'Training partner'],
        placesToVisit: ['Tokyo', 'Lisbon', 'Big Sur'],
        lovedOnes: [],
        selfRewards: [],
      },
      goldenPath: {
        pointA: 'Scattered momentum.',
        pointB: 'A calmer, stronger year.',
        obstacles: ['Too many threads', 'Fear-based decisions'],
        pleasurableProcess: 'By making the work visible and rhythmic.',
        fasterHelp: 'Trusted peers and therapy.',
        finalNotes: 'Simplify earlier.',
        movieTitle: 'The Quiet Rebuild',
        timeCapsuleLocation: 'In a calmer home.',
        timeCapsuleFeeling: 'Proud and relieved.',
      },
    });
  });

  it('drops empty items and lightly trims very long answers', () => {
    const longAnswer = 'a'.repeat(700);
    const longHighlight = 'b'.repeat(220);
    const context = extractCompassAdvisorContext({
      sessionId: 'compass-2',
      planningYear: 2026,
      completedAt: '2026-04-09T13:00:00.000Z',
      answers: {
        'past-highlights': {
          items: JSON.stringify(['  ', longHighlight]),
        },
        'past-lessons': {
          proud: longAnswer,
        },
      },
    });

    expect(context.past.highlights).toHaveLength(1);
    expect(context.past.highlights[0]).toMatch(/\.\.\.$/);
    expect(context.past.highlights[0]?.length).toBeLessThan(longHighlight.length);
    expect(context.past.proud).toMatch(/\.\.\.$/);
    expect(context.past.proud.length).toBeLessThan(longAnswer.length);
    expect(context.past.bestThing).toBe('');
    expect(context.perfectDay.wakeTime).toBe('');
    expect(context.goldenPath.movieTitle).toBe('');
  });

  it('still reads legacy newline month notes as past highlights', () => {
    const context = extractCompassAdvisorContext({
      sessionId: 'compass-3',
      planningYear: 2026,
      completedAt: '2026-04-09T13:10:00.000Z',
      answers: {
        'past-monthly-events': {
          month1: 'Left the old job\nStarted the company',
        },
      },
    });

    expect(context.past.highlights).toEqual(['Left the old job', 'Started the company']);
  });
});
