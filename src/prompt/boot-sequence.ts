import type { AdvisorConfig, AdvisorId, AdvisorState } from '../types/advisor';

export const BOOT_ART: Record<AdvisorId, string> = {
  prioritization: `
      .-----------------------.
     /  PRIORITY TARGETING    \\
    |    [1]---FOCUS---[3]     |
    |           |              |
    |       TARGET LOCK        |
     \\_________________________/`,

  career: `
            /\\
           /  \\
          / /\\ \\
         / ____ \\
        /_/    \\_\\
       CAREER LAUNCH`,

  financial: `
      .-----------------------.
     |   IRON VAULT :: $$$    |
     |  RUNWAY   [||||||| ]   |
     |  INFLOW   [||||||  ]   |
     |  BURN     [|||     ]   |
      '-----------------------'`,

  performance: `
             (  )
            (    )
           ( FIRE )
            (    )
             )  (
            BLAZE MODE`,

  fitness: `
         [==]==========[==]
             \\  ||  /
              \\ || /
               \\||/
             BODY LOAD`,

  therapist: `
          .-""""-.
        .'  .--.  '.
       /   (o  o)   \\
      |      --      |
       \\   .____.   /
        '._MIND___.'
`,

  creativity: `
            .-====-.
          .'  *  *  '.
         /  *  !  *   \\
         |  *  *  *   |
         \\   *   *   /
          '._CREATE_.'`,
};

function buildBootPreview(config: AdvisorConfig, advisorState: AdvisorState): string {
  const sessionNumber = advisorState.sessions.length + 1;
  const mode = advisorState.sessions.length === 0 ? 'intake-mode' : 'returning-session';

  return `${BOOT_ART[config.id].trim()}

+---------------------------------------+
| L.A.B. ADVISOR KERNEL                |
| advisor : ${config.shortName}
| session : ${sessionNumber}
| status  : online
| mode    : ${mode}
+---------------------------------------+`;
}

export function buildStartupProtocol(config: AdvisorConfig, advisorState: AdvisorState): string {
  const bootPreview = buildBootPreview(config, advisorState);

  return `[MANDATORY FIRST RESPONSE - AUTO BOOT]
The user will paste this prompt and press Enter once. Do not wait for the user to type "boot" or request a startup sequence.

Your first reply must:
1. Immediately render the ASCII boot sequence below.
2. Continue straight into your in-character opening line.
3. Start the actual advisory conversation in the same reply.

Rules:
- The boot sequence must happen automatically in the first reply.
- Use ASCII characters only for the boot block.
- Do not ask the user to trigger, enable, or confirm the boot sequence.
- Keep the boot block visually clean and compact.

ASCII boot sequence to render in your first reply:
\`\`\`text
${bootPreview}
\`\`\`

After the boot block, continue naturally in character without breaking immersion.`;
}

export function buildBootPreviewPanel(config: AdvisorConfig, advisorState: AdvisorState): string {
  return buildBootPreview(config, advisorState);
}
