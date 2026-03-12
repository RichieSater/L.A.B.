import { describe, expect, it } from 'vitest';
import { ADVISOR_CONFIGS } from '../../advisors/registry';
import { createDefaultAdvisorState } from '../../state/init';
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
});
