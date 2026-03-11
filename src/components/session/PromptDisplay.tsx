import { CopyButton } from '../shared/CopyButton';

interface PromptDisplayProps {
  prompt: string;
  onCopied: () => void;
}

export function PromptDisplay({ prompt, onCopied }: PromptDisplayProps) {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-100">Session Prompt Generated</h3>
          <p className="text-sm text-gray-400 mt-1">
            Copy this prompt and paste it into your AI chat (Claude, ChatGPT, etc.)
          </p>
        </div>
        <CopyButton text={prompt} label="Copy Prompt" className="self-start sm:self-auto" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
            {prompt}
          </pre>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
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
