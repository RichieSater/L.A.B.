import type { AdvisorConfig, AdvisorState } from '../../types/advisor';

export function buildIntakeSection(
  config: AdvisorConfig,
  state: AdvisorState,
): string {
  // Only include intake section on first session
  if (state.sessions.length > 0) {
    return '';
  }

  let section = '[FIRST SESSION — INTAKE & ONBOARDING]\n';
  section += 'This is our very first session together. ';
  section += 'Before diving into regular advisory work, take time to understand my current situation in this domain.\n\n';

  if (config.intakePrompt) {
    section += config.intakePrompt;
  } else {
    section += 'Please:\n';
    section += '1. Understand my current situation, baseline, and context in your domain\n';
    section += '2. Learn about my goals, constraints, and challenges\n';
    section += '3. Establish initial metrics and baselines\n';
    section += '4. Set expectations for our ongoing work together\n';
    section += '5. Create initial action items that focus on assessment and baseline-setting\n';
  }

  section += '\n\nIMPORTANT: This is an intake session. Do NOT jump into prescriptive advice. ';
  section += 'Ask questions, listen, and build understanding. The narrative_update in your JSON export ';
  section += 'should capture the initial baseline picture.';

  return section;
}
