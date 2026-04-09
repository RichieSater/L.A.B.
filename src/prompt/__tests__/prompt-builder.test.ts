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
    expect(prompt).toContain('Latest Compass daily rituals:');
    expect(prompt).toContain('Write the daily plan before opening messages');
    expect(prompt).toContain('Latest Compass support structure:');
    expect(prompt).toContain('Therapist');
  });

  it('includes the latest completed Compass past and perfect-day context for all advisors', () => {
    const appState = createDefaultAppState();
    appState.strategicDashboard.latestCompassAdvisorContext = {
      sessionId: 'compass-1',
      planningYear: new Date().getFullYear(),
      completedAt: '2026-04-09T12:00:00.000Z',
      past: {
        highlights: ['Moved through a hard transition', 'Started shipping L.A.B.'],
        proud: 'I stayed in the fight.',
        challenges: 'I kept overcommitting.',
        lessons: 'I need simpler systems.',
        selfForgiveness: 'How long I waited to ask for help.',
      },
      perfectDay: {
        overview: 'A calm day with deep work and no frantic context switching.',
        body: 'Strong, rested, and physically present.',
        work: 'Building useful things for long enough to matter.',
        relationships: 'Close, warm, and genuinely available.',
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
    expect(prompt).toContain('The Past:');
    expect(prompt).toContain('Moved through a hard transition');
    expect(prompt).toContain('What challenged me most:');
    expect(prompt).toContain('I kept overcommitting.');
    expect(prompt).toContain('The Perfect Day:');
    expect(prompt).toContain('Building useful things for long enough to matter.');
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
});
