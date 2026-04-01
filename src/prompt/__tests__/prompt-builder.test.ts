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
});
