import type { AdvisorConfig, AdvisorState } from '../../types/advisor';
import { CopyButton } from '../shared/CopyButton';

interface BootSequenceProps {
  config: AdvisorConfig;
  advisorState: AdvisorState;
  prompt: string;
  onCopied: () => void;
}

export function BootSequence({ config, advisorState, prompt, onCopied }: BootSequenceProps) {
  const sessionNumber = advisorState.sessions.length + 1;
  const isFirstSession = advisorState.sessions.length === 0;

  const instructions = [
    'Click "Copy Prompt" below to copy your session prompt.',
    'Open ChatGPT, Claude, or Gemini in a new tab.',
    'Paste the prompt into the chat and press Enter.',
    'Have a natural conversation \u2014 the AI knows your full context.',
    'At the end, the AI will produce a JSON export block.',
    'Copy the JSON block.',
    'Return here and click "I\'ve Copied the Prompt" to continue.',
  ];

  return (
    <div>
      {/* Session info card */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{config.icon}</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-100">
              {config.displayName} &mdash; Session #{sessionNumber}
            </h3>
            {isFirstSession && (
              <p className="text-sm" style={{ color: config.domainColor }}>
                First session &mdash; full intake assessment
              </p>
            )}
          </div>
        </div>

        {/* Instructions */}
        <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
          Instructions
        </h4>
        <ol className="space-y-2">
          {instructions.map((instruction, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-800 text-gray-400 flex items-center justify-center text-xs font-medium">
                {i + 1}
              </span>
              <span className="text-gray-300 text-sm">{instruction}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <CopyButton text={prompt} label="Copy Prompt" className="self-start sm:self-auto" />
        <button
          onClick={onCopied}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          I've Copied the Prompt &rarr;
        </button>
      </div>
    </div>
  );
}
