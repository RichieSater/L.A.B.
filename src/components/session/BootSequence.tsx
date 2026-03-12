import type { AdvisorConfig, AdvisorState } from '../../types/advisor';
import { CopyButton } from '../shared/CopyButton';
import { buildBootPreviewPanel } from '../../prompt/boot-sequence';

interface BootSequenceProps {
  config: AdvisorConfig;
  advisorState: AdvisorState;
  prompt: string;
  onCopied: () => void;
}

export function BootSequence({ config, advisorState, prompt, onCopied }: BootSequenceProps) {
  const sessionNumber = advisorState.sessions.length + 1;
  const isFirstSession = advisorState.sessions.length === 0;
  const bootPreview = buildBootPreviewPanel(config, advisorState);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <div className="mb-6 flex items-start gap-4">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-800 bg-gray-950 text-2xl"
              style={{ boxShadow: `0 0 0 1px ${config.domainColor}22 inset` }}
            >
              {config.icon}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">Session Launch</p>
              <h3 className="mt-1 text-xl font-semibold text-gray-100">
                {config.displayName} - Session #{sessionNumber}
              </h3>
              <p className="mt-2 text-sm text-gray-400">
                Copy the prompt, paste it into your AI chat, and press Enter. The prompt now tells the advisor to run the boot sequence automatically.
              </p>
              {isFirstSession && (
                <p className="mt-3 text-sm font-medium" style={{ color: config.domainColor }}>
                  First session - full intake assessment
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-800 bg-gray-950/60 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">Step 1</p>
                  <h4 className="mt-1 text-base font-semibold text-gray-100">Copy the full session prompt</h4>
                  <p className="mt-1 text-sm text-gray-400">
                    This includes the advisor persona, your context, and the automatic boot instructions.
                  </p>
                </div>
                <CopyButton text={prompt} label="Copy Prompt" className="shrink-0" />
              </div>
            </div>

            <div className="rounded-2xl border border-gray-800 bg-gray-950/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">Step 2</p>
              <h4 className="mt-1 text-base font-semibold text-gray-100">Paste it and press Enter</h4>
              <p className="mt-1 text-sm text-gray-400">
                Use ChatGPT, Claude, or Gemini. The first reply should boot immediately without you typing anything extra.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-800 bg-gray-950/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">Step 3</p>
              <h4 className="mt-1 text-base font-semibold text-gray-100">Have the session and bring back the JSON</h4>
              <p className="mt-1 text-sm text-gray-400">
                At the end of the chat, copy the JSON export block and come back here to import it.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-950 p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">First Reply Preview</p>
              <h4 className="mt-1 text-base font-semibold text-gray-100">Expected boot sequence</h4>
            </div>
            <span
              className="rounded-full border px-3 py-1 text-xs font-medium"
              style={{ borderColor: `${config.domainColor}55`, color: config.domainColor }}
            >
              Auto-boot
            </span>
          </div>
          <pre className="overflow-x-auto rounded-2xl border border-gray-800 bg-[#050816] p-4 text-[11px] leading-5 text-gray-300">
            {bootPreview}
          </pre>
          <p className="mt-4 text-sm text-gray-400">
            If the advisor skips this, the prompt was not followed. You should only need to paste once and hit Enter.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-gray-800 bg-gray-900/80 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-gray-100">Once you have pasted the prompt into your AI chat, continue here.</p>
          <p className="mt-1 text-sm text-gray-400">The next screen gives you the fallback JSON export prompt and the import step.</p>
        </div>
        <button
          onClick={onCopied}
          className="rounded-xl bg-blue-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-blue-700"
        >
          Continue to Chat Step &rarr;
        </button>
      </div>
    </div>
  );
}
