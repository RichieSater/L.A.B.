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
    isSaving,
    saveError,
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
          <h2 className="text-xl font-bold text-[color:var(--lab-text)]">{config.displayName} Session</h2>
        </div>

        {/* Step indicator */}
        {flowState.step !== 'complete' && (
          <div className="flex items-center gap-1 sm:gap-2">
            {steps.map((step, i) => (
              <div key={step.key} className="flex items-center gap-1 sm:gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium sm:h-8 sm:w-8 sm:text-sm ${
                    i <= currentStepIndex
                      ? 'bg-[color:var(--lab-gold)] text-[#15181e]'
                      : 'bg-[rgba(19,28,38,0.92)] text-[color:var(--lab-text-dim)]'
                  }`}
                >
                  {i + 1}
                </div>
                <span className={`text-xs sm:text-sm ${
                  i <= currentStepIndex ? 'text-[color:var(--lab-text)]' : 'text-[color:var(--lab-text-dim)]'
                }`}>
                  {step.label}
                </span>
                {i < steps.length - 1 && (
                  <div className={`h-px w-4 sm:w-8 ${
                    i < currentStepIndex ? 'bg-[color:var(--lab-gold)]' : 'bg-[color:var(--lab-border)]'
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
          <h3 className="mb-2 text-xl font-semibold text-[color:var(--lab-text)]">
            Have Your Conversation
          </h3>
          <p className="mx-auto mb-2 max-w-lg text-[color:var(--lab-text-muted)]">
            Paste the prompt into your preferred AI chat (Claude, ChatGPT, Gemini, etc.) and have your advisory session.
          </p>
          <p className="mx-auto mb-8 max-w-lg text-sm text-[color:var(--lab-text-dim)]">
            At the end, the AI will produce a JSON export block. Copy that block.
          </p>

          {/* Force JSON prompt section */}
          <div className="max-w-lg mx-auto mb-8">
            <button
              onClick={() => setShowForcePrompt(!showForcePrompt)}
              className="text-sm text-[color:var(--lab-text-muted)] underline transition-colors hover:text-[color:var(--lab-text)]"
            >
              {showForcePrompt ? 'Hide JSON prompt' : "AI didn't produce JSON? Get the export prompt"}
            </button>
            {showForcePrompt && (
              <div className="mt-4 rounded-[1.5rem] border border-[color:var(--lab-border)] bg-[rgba(8,11,17,0.96)] p-4 text-left">
                <p className="mb-3 text-sm text-[color:var(--lab-text-muted)]">
                  Copy this prompt and paste it into your chat to request the JSON export:
                </p>
                <div className="mb-3">
                  <CopyButton text={forceJsonPrompt} label="Copy JSON Prompt" />
                </div>
                <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap font-mono text-xs text-[color:var(--lab-text-dim)]">
                  {forceJsonPrompt}
                </pre>
              </div>
            )}
          </div>

          <button
            onClick={advanceToImport}
            className="lab-button lab-button--gold rounded-2xl"
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

      {flowState.step === 'confirm' && flowState.parsedImport && flowState.normalizedImport && (
        <SessionConfirmation
          sessionImport={flowState.parsedImport}
          normalizedImport={flowState.normalizedImport}
          warnings={flowState.validationWarnings}
          onConfirm={confirmImport}
          onBack={advanceToImport}
          isSaving={isSaving}
          saveError={saveError}
        />
      )}

      {flowState.step === 'complete' && (
        <SessionComplete advisorName={config.shortName} onNewSession={reset} />
      )}
    </div>
  );
}
