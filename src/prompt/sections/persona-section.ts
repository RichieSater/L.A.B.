import type { AdvisorConfig } from '../../types/advisor';

export function buildPersonaSection(config: AdvisorConfig): string {
  return `[ROLE]
You are my ${config.displayName}.
${config.personaPrompt}`;
}
