import { describe, expect, it } from 'vitest';
import { ADVISOR_CONFIGS } from '../../advisors/registry';
import { createDefaultAppState, createDefaultAdvisorState } from '../../state/init';
import { createStrategicDashboardYear } from '../../types/strategic-dashboard';
import { buildPrompt } from '../prompt-builder';

describe('buildPrompt', () => {
  it('includes the automatic boot protocol in the copied prompt', () => {
    const prompt = buildPrompt(
      ADVISOR_CONFIGS.career,
      createDefaultAdvisorState('career'),
      {},
      [],
    );

    expect(prompt).toContain('[MANDATORY FIRST RESPONSE - AUTO BOOT]');
    expect(prompt).toContain('Do not wait for the user to type "boot"');
    expect(prompt).toContain('L.A.B. ADVISOR KERNEL');
    expect(prompt).toContain('ASCII boot sequence to render in your first reply');
  });

  it('includes strategic context from Compass and current-year goals', () => {
    const currentYear = new Date().getFullYear();
    const appState = createDefaultAppState();
    const strategicYear = createStrategicDashboardYear(currentYear);

    strategicYear.sections.yearGoals.goals[0].text = 'Ship Golden Compass inside LAB';
    appState.strategicDashboard.years = [strategicYear];
    appState.strategicDashboard.latestCompassInsights = {
      annualGoals: ['Ship Golden Compass inside LAB'],
      dailyRituals: ['Write the daily plan before opening messages'],
      supportPeople: ['Therapist', 'Priya'],
    };
    appState.strategicDashboard.latestCompassAdvisorContext = null;

    const prompt = buildPrompt(
      ADVISOR_CONFIGS.career,
      createDefaultAdvisorState('career'),
      {},
      [],
      appState,
    );

    expect(prompt).toContain('[STRATEGIC CONTEXT]');
    expect(prompt).toContain(`Current-year goals (${currentYear}):`);
    expect(prompt).toContain('Ship Golden Compass inside LAB');
    expect(prompt).toContain('Active Compass daily rituals:');
    expect(prompt).toContain('Write the daily plan before opening messages');
    expect(prompt).toContain('Active Compass support structure:');
    expect(prompt).toContain('Therapist');
  });

  it('includes the latest completed Compass past and perfect-day context for all advisors', () => {
    const appState = createDefaultAppState();
    appState.strategicDashboard.latestCompassAdvisorContext = {
      sessionId: 'compass-1',
      planningYear: new Date().getFullYear(),
      completedAt: '2026-04-09T12:00:00.000Z',
      bonfire: {
        items: ['Burnout', 'Money pressure'],
        releaseFeeling: 'Lighter.',
        releaseWords: ['clear', 'steady', 'lighter'],
      },
      past: {
        highlights: ['Moved through a hard transition', 'Started shipping L.A.B.'],
        yearSnapshot: {
          workLife: 'Work got simpler when I stopped pretending every bet was urgent.',
          relationships: '',
          health: '',
        },
        bestThing: '',
        biggestLesson: 'I need simpler systems.',
        proud: 'I stayed in the fight.',
        yearWords: ['revealing', 'hard', 'clarifying'],
        goldenMoments: '',
        biggestChallenges: ['I kept overcommitting.'],
        challengeSupport: '',
        challengeLessons: 'I need simpler systems.',
        notProud: '',
        selfForgiveness: 'How long I waited to ask for help.',
      },
      future: {
        perfectDayBrainstorm: 'A calm day with deep work and no frantic context switching.',
        nextYearSummary: {
          workLife: '',
          relationships: '',
          health: '',
        },
      },
      perfectDay: {
        wakeTime: '6:18 AM',
        bodyFeeling: 'Strong, rested, and physically present.',
        firstThoughts: '',
        morningView: '',
        location: '',
        salesMessage: '',
        autonomyFeeling: '',
        workPlans: 'Building useful things for long enough to matter.',
        funPlans: '',
        mirrorView: '',
        selfImageFeeling: '',
        outfit: '',
        outfitFeeling: '',
        breakfast: '',
        dayNarrative: 'A calm day with deep work and no frantic context switching.',
        spendingAccount: '',
        financialFreedomFeeling: '',
        charity: '',
        givingBack: '',
        weekendTrip: '',
        weekendActivities: '',
        weekendFood: '',
        homeAtmosphere: '',
        windowView: '',
        houseHighlights: '',
        garageHighlights: '',
        specialSomeoneMessage: '',
        nightClose: 'Close, warm, and genuinely available.',
        gratitude: ['Family', 'Health', 'Direction'],
        compassFeeling: 'Aligned.',
      },
      lightingPath: {
        environmentJoy: ['Morning light'],
        financialSupport: '',
        healthSupport: '',
        relationshipSupport: '',
        lettingGo: ['Overcomplication'],
        sayingNo: [],
        guiltFreeEnjoyment: [],
        supportPeople: ['Therapist'],
        placesToVisit: [],
        lovedOnes: [],
        selfRewards: [],
      },
      goldenPath: {
        pointA: 'Scattered momentum.',
        pointB: 'A calmer year.',
        obstacles: ['Overcommitment'],
        pleasurableProcess: '',
        fasterHelp: '',
        finalNotes: '',
        movieTitle: 'The Quiet Rebuild',
        timeCapsuleLocation: '',
        timeCapsuleFeeling: '',
      },
    };

    const prompt = buildPrompt(
      ADVISOR_CONFIGS.career,
      createDefaultAdvisorState('career'),
      {},
      [],
      appState,
    );

    expect(prompt).toContain('[LATEST GOLDEN COMPASS CONTEXT]');
    expect(prompt).toContain('The Bonfire:');
    expect(prompt).toContain('Burnout');
    expect(prompt).toContain('The Past:');
    expect(prompt).toContain('Moved through a hard transition');
    expect(prompt).toContain('Biggest challenges from the last year:');
    expect(prompt).toContain('I kept overcommitting.');
    expect(prompt).toContain('The Future:');
    expect(prompt).toContain('A calm day with deep work and no frantic context switching.');
    expect(prompt).toContain('The Perfect Day:');
    expect(prompt).toContain('Building useful things for long enough to matter.');
    expect(prompt).toContain('Lighting The Path:');
    expect(prompt).toContain('The Golden Path:');
    expect(prompt.indexOf('[LATEST GOLDEN COMPASS CONTEXT]')).toBeGreaterThan(
      prompt.indexOf('[STRATEGIC CONTEXT]'),
    );
  });

  it('does not include raw Compass answer context when only summary insights exist', () => {
    const appState = createDefaultAppState();
    appState.strategicDashboard.latestCompassInsights = {
      annualGoals: ['Ship Golden Compass inside LAB'],
      dailyRituals: ['Plan before messages'],
      supportPeople: ['Therapist'],
    };
    appState.strategicDashboard.latestCompassAdvisorContext = null;

    const prompt = buildPrompt(
      ADVISOR_CONFIGS.career,
      createDefaultAdvisorState('career'),
      {},
      [],
      appState,
    );

    expect(prompt).not.toContain('[LATEST GOLDEN COMPASS CONTEXT]');
  });

  it('includes achieved Compass history as high-level context only', () => {
    const appState = createDefaultAppState();
    appState.strategicDashboard.achievedCompassSummaries = [
      {
        sessionId: 'compass-1',
        title: 'Golden Compass 2025',
        planningYear: 2025,
        completedAt: '2025-12-30T10:00:00.000Z',
        achievedAt: '2026-04-12T10:00:00.000Z',
      },
    ];

    const prompt = buildPrompt(
      ADVISOR_CONFIGS.career,
      createDefaultAdvisorState('career'),
      {},
      [],
      appState,
    );

    expect(prompt).toContain('[ACHIEVED GOLDEN COMPASS HISTORY]');
    expect(prompt).toContain('Golden Compass 2025');
    expect(prompt).toContain('achieved');
  });
});
