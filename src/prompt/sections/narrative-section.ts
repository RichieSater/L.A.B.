import type { AdvisorState } from '../../types/advisor';

export function buildNarrativeSection(state: AdvisorState): string {
  if (!state.narrative || state.narrative.trim() === '') {
    return `[MY STORY WITH YOU]
This is our first session. We have no history yet. Start by understanding my current situation and establishing a baseline.`;
  }

  return `[MY STORY WITH YOU]
${state.narrative}`;
}
