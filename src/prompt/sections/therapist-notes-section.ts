import type { AdvisorConfig } from '../../types/advisor';
import type { AppState } from '../../types/app-state';
import { ADVISOR_CONFIGS } from '../../advisors/registry';
import { selectActivatedAdvisorIds } from '../../state/selectors';

const MAX_SESSIONS_PER_ADVISOR = 5;
const MAX_NARRATIVE_CHARS = 500;

export function buildTherapistNotesSection(
  config: AdvisorConfig,
  appState?: AppState,
): string {
  if (config.id !== 'therapist' || !appState) {
    return '';
  }

  const activatedIds = selectActivatedAdvisorIds(appState);
  const otherIds = activatedIds.filter(id => id !== 'therapist');

  if (otherIds.length === 0) {
    return `[CROSS-ADVISOR SESSION NOTES]
No other advisors are activated yet. No session notes available.`;
  }

  let section = '[CROSS-ADVISOR SESSION NOTES]\n';
  section += 'Below are recent session summaries from all other active advisors. ';
  section += 'Use these to identify emotional patterns, avoidance behaviors, ';
  section += 'cross-domain stress indicators, and unconscious themes.\n';

  let hasAnyNotes = false;

  for (const id of otherIds) {
    const advisorState = appState.advisors[id];
    const otherConfig = ADVISOR_CONFIGS[id];

    if (!advisorState || advisorState.sessions.length === 0) {
      continue;
    }

    hasAnyNotes = true;
    const recentSessions = advisorState.sessions
      .slice(-MAX_SESSIONS_PER_ADVISOR)
      .reverse();

    section += `\n--- ${otherConfig.displayName} (${otherConfig.icon}) ---\n`;

    const narrative = advisorState.narrative?.trim();
    if (narrative) {
      const truncated = narrative.length > MAX_NARRATIVE_CHARS
        ? narrative.slice(0, MAX_NARRATIVE_CHARS) + '...'
        : narrative;
      section += `Narrative: ${truncated}\n`;
    }

    section += `Sessions (${recentSessions.length} most recent):\n`;

    for (const sess of recentSessions) {
      section += `[${sess.date}] Mood: ${sess.mood}, Energy: ${sess.energy}/10\n`;
      section += `  Summary: ${sess.summary}\n`;
      if (sess.narrativeUpdate) {
        section += `  Narrative update: ${sess.narrativeUpdate}\n`;
      }
    }
  }

  if (!hasAnyNotes) {
    section += '\nNo session notes available from other advisors yet.';
  }

  return section;
}
