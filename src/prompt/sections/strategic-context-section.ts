import type { AppState } from '../../types/app-state';
import { getStrategicDashboardYear } from '../../types/strategic-dashboard';

export function buildStrategicContextSection(appState?: AppState): string | null {
  if (!appState) {
    return null;
  }

  const planningYear = new Date().getFullYear();
  const strategicYear = getStrategicDashboardYear(appState.strategicDashboard, planningYear);
  const yearGoals = strategicYear.sections.yearGoals.goals
    .map(goal => goal.text.trim())
    .filter(Boolean);
  const dailyRituals = appState.strategicDashboard.latestCompassInsights?.dailyRituals ?? [];
  const supportPeople = appState.strategicDashboard.latestCompassInsights?.supportPeople ?? [];

  if (yearGoals.length === 0 && dailyRituals.length === 0 && supportPeople.length === 0) {
    return null;
  }

  const lines: string[] = ['[STRATEGIC CONTEXT]'];

  if (yearGoals.length > 0) {
    lines.push(`Current-year goals (${planningYear}):`);
    for (const goal of yearGoals.slice(0, 3)) {
      lines.push(`- ${goal}`);
    }
  }

  if (dailyRituals.length > 0) {
    lines.push('Active Compass daily rituals:');
    for (const ritual of dailyRituals.slice(0, 3)) {
      lines.push(`- ${ritual}`);
    }
  }

  if (supportPeople.length > 0) {
    lines.push('Active Compass support structure:');
    for (const person of supportPeople.slice(0, 5)) {
      lines.push(`- ${person}`);
    }
  }

  lines.push('Keep your advice aligned with this direction when you help me decide what matters next.');

  return lines.join('\n');
}
