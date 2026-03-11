import { useEffect, useState, useMemo } from 'react';
import type { AdvisorId } from '../../types/advisor';
import { ADVISOR_CONFIGS } from '../../advisors/registry';
import { useSessionFlow } from '../../hooks/use-session-flow';
import { useAdvisor } from '../../hooks/use-advisor';
import { PromptDisplay } from './PromptDisplay';
import { JsonImport } from './JsonImport';
import { SessionConfirmation } from './SessionConfirmation';
import { SessionComplete } from './SessionComplete';
import { CopyButton } from '../shared/CopyButton';
import { buildForceJsonPrompt } from '../../prompt/force-json-prompt';

interface SessionFlowProps {
  advisorId: AdvisorId;
}

export function SessionFlow({ advisorId }: SessionFlowProps) {
  const config = ADVISOR_CONFIGS[advisorId];
  const { state: advisorState } = useAdvisor(advisorId);
  const [showForcePrompt, setShowForcePrompt] = useState(false);
  const forceJsonPrompt = useMemo(() => buildForceJsonPrompt(advisorId), [advisorId]);
  const {
    flowState,
    generatePrompt,
    advanceToAwaiting,
    advanceToImport,
    parseJson,
    confirmImport,
    reset,
  } = useSessionFlow(advisorId);

  // Generate prompt on mount
  useEffect(() => {
    generatePrompt();
  }, [generatePrompt]);

  // Step indicator
  const steps = [
    { key: 'generate', label: 'Generate' },
    { key: 'awaiting', label: 'Chat' },
    { key: 'import', label: 'Import' },
    { key: 'confirm', label: 'Confirm' },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === flowState.step);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">{config.icon}</span>
          <h2 className="text-xl font-bold text-gray-100">{config.displayName} Session</h2>
        </div>

        {/* Step indicator */}
        {flowState.step !== 'complete' && (
          <div className="flex items-center gap-1 sm:gap-2">
            {steps.map((step, i) => (
              <div key={step.key} className="flex items-center gap-1 sm:gap-2">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                    i <= currentStepIndex
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-500'
                  }`}
                >
                  {i + 1}
                </div>
                <span className={`text-xs sm:text-sm ${
                  i <= currentStepIndex ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {step.label}
                </span>
                {i < steps.length - 1 && (
                  <div className={`w-4 sm:w-8 h-px ${
                    i < currentStepIndex ? 'bg-blue-600' : 'bg-gray-800'
                  }`} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step content */}
      {flowState.step === 'generate' && flowState.generatedPrompt && (
        <PromptDisplay
          prompt={flowState.generatedPrompt}
          onCopied={advanceToAwaiting}
          config={config}
          advisorState={advisorState}
        />
      )}

      {flowState.step === 'awaiting' && (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">&#128172;</div>
          <h3 className="text-xl font-semibold text-gray-100 mb-2">
            Have Your Conversation
          </h3>
          <p className="text-gray-400 mb-2 max-w-lg mx-auto">
            Paste the prompt into your preferred AI chat (Claude, ChatGPT, Gemini, etc.) and have your advisory session.
          </p>
          <p className="text-gray-500 text-sm mb-8 max-w-lg mx-auto">
            At the end, the AI will produce a JSON export block. Copy that block.
          </p>

          {/* Force JSON prompt section */}
          <div className="max-w-lg mx-auto mb-8">
            <button
              onClick={() => setShowForcePrompt(!showForcePrompt)}
              className="text-sm text-gray-400 hover:text-gray-200 underline transition-colors"
            >
              {showForcePrompt ? 'Hide JSON prompt' : "AI didn't produce JSON? Get the export prompt"}
            </button>
            {showForcePrompt && (
              <div className="mt-4 bg-gray-900 border border-gray-800 rounded-xl p-4 text-left">
                <p className="text-sm text-gray-400 mb-3">
                  Copy this prompt and paste it into your chat to request the JSON export:
                </p>
                <div className="mb-3">
                  <CopyButton text={forceJsonPrompt} label="Copy JSON Prompt" />
                </div>
                <pre className="text-xs text-gray-500 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {forceJsonPrompt}
                </pre>
              </div>
            )}
          </div>

          <button
            onClick={advanceToImport}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            I Have the JSON Export &rarr;
          </button>
        </div>
      )}

      {flowState.step === 'import' && (
        <JsonImport
          onParse={parseJson}
          errors={flowState.validationErrors}
          warnings={flowState.validationWarnings}
        />
      )}

      {flowState.step === 'confirm' && flowState.parsedExport && (
        <SessionConfirmation
          sessionExport={flowState.parsedExport}
          warnings={flowState.validationWarnings}
          onConfirm={confirmImport}
          onBack={advanceToImport}
        />
      )}

      {flowState.step === 'complete' && (
        <SessionComplete advisorName={config.shortName} onNewSession={reset} />
      )}
    </div>
  );
}
