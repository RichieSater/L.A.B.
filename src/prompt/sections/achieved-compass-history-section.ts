import type { AppState } from '../../types/app-state';

export function buildAchievedCompassHistorySection(appState?: AppState): string | null {
  const achievedCompasses = appState?.strategicDashboard.achievedCompassSummaries ?? [];

  if (achievedCompasses.length === 0) {
    return null;
  }

  const lines = [
    '[ACHIEVED GOLDEN COMPASS HISTORY]',
    'These Golden Compass arcs have been substantially achieved in real life. Use them as high-level background only.',
  ];

  for (const compass of achievedCompasses.slice(0, 5)) {
    lines.push(
      `- ${compass.title} (${compass.planningYear}) — achieved ${new Date(compass.achievedAt).toLocaleDateString()}`,
    );
  }

  return lines.join('\n');
}
