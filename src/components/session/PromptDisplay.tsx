import type { AdvisorConfig, AdvisorState } from '../../types/advisor';
import { BootSequence } from './BootSequence';

interface PromptDisplayProps {
  prompt: string;
  onCopied: () => void;
  config: AdvisorConfig;
  advisorState: AdvisorState;
}

export function PromptDisplay({ prompt, onCopied, config, advisorState }: PromptDisplayProps) {
  return (
    <BootSequence
      config={config}
      advisorState={advisorState}
      prompt={prompt}
      onCopied={onCopied}
    />
  );
}
