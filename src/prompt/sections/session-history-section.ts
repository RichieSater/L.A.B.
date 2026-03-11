import type { AdvisorState } from '../../types/advisor';

export function buildSessionHistorySection(state: AdvisorState): string {
  if (state.sessions.length <= 1) {
    return '';
  }

  // Show last 5 sessions (excluding the most recent, which is covered by "last session" section)
  const pastSessions = state.sessions
    .slice(-6, -1)
    .reverse();

  if (pastSessions.length === 0) return '';

  let section = '[SESSION HISTORY]\n';
  section += `${state.sessions.length} total sessions. Recent history:\n\n`;

  for (const session of pastSessions) {
    section += `[${session.date}] ${session.summary}`;
    if (session.actionItemsCreated > 0) {
      section += ` (${session.actionItemsCreated} tasks created)`;
    }
    section += '\n';
  }

  return section;
}
