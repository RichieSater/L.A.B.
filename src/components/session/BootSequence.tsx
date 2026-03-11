import type { AdvisorConfig, AdvisorState } from '../../types/advisor';
import { CopyButton } from '../shared/CopyButton';
import { BOOT_ART } from './boot-art';
import { formatDateLong, formatDaysAgo } from '../../utils/date';

interface BootSequenceProps {
  config: AdvisorConfig;
  advisorState: AdvisorState;
  prompt: string;
  onCopied: () => void;
}

function extractPersonaName(config: AdvisorConfig): string {
  const match = config.personaPrompt.match(/^You are (.+?)[\s—–-]+my/);
  return match ? match[1] : config.displayName;
}

function getOpenActionItems(state: AdvisorState): number {
  return state.actionItems.filter(a => a.status === 'open').length;
}

function getTrackedMetricsCount(state: AdvisorState): number {
  return Object.keys(state.metricsLatest).length;
}

export function BootSequence({ config, advisorState, prompt, onCopied }: BootSequenceProps) {
  const personaName = extractPersonaName(config);
  const sessionCount = advisorState.sessions.length;
  const isFirstSession = sessionCount === 0;
  const openItems = getOpenActionItems(advisorState);
  const totalItems = advisorState.actionItems.length;
  const trackedMetrics = getTrackedMetricsCount(advisorState);
  const now = new Date().toISOString().split('T')[0];

  const lastSessionDisplay = advisorState.lastSessionDate
    ? `${advisorState.lastSessionDate} (${formatDaysAgo(advisorState.lastSessionDate)})`
    : 'N/A -- FIRST SESSION';

  const streakDisplay = advisorState.streak > 0
    ? `${advisorState.streak} consecutive`
    : isFirstSession ? '0 -- INITIALIZING' : '0';

  return (
    <div>
      {/* Terminal window */}
      <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 sm:p-6 overflow-x-auto">
          <pre className="text-xs sm:text-sm font-mono leading-relaxed whitespace-pre">
            {/* ASCII Art Header */}
            <span style={{ color: config.domainColor }}>{BOOT_ART[config.id]}</span>

            {'\n\n'}

            {/* System ID Block */}
            <span className="text-green-400">
{'  L.A.B. ADVISORY SYSTEM v2.1'}{'\n'}
{'  ══════════════════════════════════════════'}{'\n'}
            </span>
            <span className="text-gray-400">
{'  MODULE:  '}</span><span style={{ color: config.domainColor }}>{config.displayName}</span>{'\n'}
            <span className="text-gray-400">
{'  ADVISOR: '}</span><span className="text-gray-200">{personaName}</span>{'\n'}
            <span className="text-gray-400">
{'  DATE:    '}</span><span className="text-gray-200">{formatDateLong(now)}</span>{'\n'}
            <span className="text-gray-400">
{'  SESSION: '}</span><span className="text-gray-200">#{sessionCount + 1}</span>{'\n'}

            {'\n'}

            {/* System Check Lines */}
            <span className="text-green-400">
{'  ══════════════════════════════════════════'}{'\n'}
{'  SYSTEM DIAGNOSTICS'}{'\n'}
{'  ══════════════════════════════════════════'}{'\n'}
            </span>

            {'\n'}

            <span className="text-green-500">{'  [OK] '}</span>
            <span className="text-gray-400">{'Advisor persona loaded'}</span>{'\n'}

            <span className="text-green-500">{'  [OK] '}</span>
            <span className="text-gray-400">{'Session history verified ......... '}</span>
            <span className="text-gray-200">{sessionCount} sessions on record</span>{'\n'}

            <span className="text-green-500">{'  [OK] '}</span>
            <span className="text-gray-400">{'Streak status ................... '}</span>
            <span className="text-gray-200">{streakDisplay}</span>{'\n'}

            <span className="text-green-500">{'  [OK] '}</span>
            <span className="text-gray-400">{'Last session .................... '}</span>
            <span className="text-gray-200">{lastSessionDisplay}</span>{'\n'}

            <span className="text-green-500">{'  [OK] '}</span>
            <span className="text-gray-400">{'Action items loaded ............. '}</span>
            <span className="text-gray-200">{openItems} open / {totalItems} total</span>{'\n'}

            <span className="text-green-500">{'  [OK] '}</span>
            <span className="text-gray-400">{'Metrics baseline loaded ......... '}</span>
            <span className="text-gray-200">{trackedMetrics} tracked</span>{'\n'}

            <span className="text-green-500">{'  [OK] '}</span>
            <span className="text-gray-400">{'Cross-advisor context synced'}</span>{'\n'}

            {'\n'}

            {/* Session Status Panel */}
            <span className="text-green-400">
{'  ══════════════════════════════════════════'}{'\n'}
{'  SESSION STATUS'}{'\n'}
{'  ══════════════════════════════════════════'}{'\n'}
            </span>

            {'\n'}

            {isFirstSession ? (
              <>
                <span style={{ color: config.domainColor }}>
{'  >>> FIRST SESSION -- INTAKE MODE <<<'}{'\n'}
                </span>
                {'\n'}
                <span className="text-gray-400">
{'  Full diagnostic assessment. No prior data.'}{'\n'}
{'  Building baseline metrics and action items.'}{'\n'}
{'  All frameworks will be initialized.'}{'\n'}
                </span>
              </>
            ) : (
              <>
                {advisorState.lastSessionSummary && (
                  <>
                    <span className="text-gray-500">{'  LAST SESSION BRIEF:'}</span>{'\n'}
                    <span className="text-gray-300">
{'  '}{advisorState.lastSessionSummary.length > 160
  ? advisorState.lastSessionSummary.slice(0, 160) + '...'
  : advisorState.lastSessionSummary}{'\n'}
                    </span>
                  </>
                )}
                {'\n'}
                {advisorState.contextForNextSession && (
                  <>
                    <span className="text-gray-500">{'  CARRY-FORWARD CONTEXT:'}</span>{'\n'}
                    <span className="text-gray-300">
{'  '}{advisorState.contextForNextSession.length > 160
  ? advisorState.contextForNextSession.slice(0, 160) + '...'
  : advisorState.contextForNextSession}{'\n'}
                    </span>
                  </>
                )}
                {'\n'}
                {Object.keys(advisorState.metricsLatest).length > 0 && (
                  <>
                    <span className="text-gray-500">{'  KEY METRICS:'}</span>{'\n'}
                    {Object.entries(advisorState.metricsLatest).slice(0, 5).map(([key, val]) => (
                      <span key={key} className="text-gray-300">
{'  '}{key.replace(/_/g, ' ').toUpperCase()}: {val}{'\n'}
                      </span>
                    ))}
                  </>
                )}
              </>
            )}

            {'\n'}

            {/* Deployment Instructions */}
            <span className="text-amber-400">
{'  ══════════════════════════════════════════'}{'\n'}
{'  DEPLOYMENT INSTRUCTIONS'}{'\n'}
{'  ══════════════════════════════════════════'}{'\n'}
            </span>

            {'\n'}

            <span className="text-gray-300">
{'  1. Click '}</span><span className="text-amber-400">{'[COPY PROMPT]'}</span><span className="text-gray-300">{' below'}{'\n'}</span>
            <span className="text-gray-300">
{'  2. Open ChatGPT or Claude in a new tab'}{'\n'}</span>
            <span className="text-gray-300">
{'  3. Paste the prompt into the chat'}{'\n'}</span>
            <span className="text-gray-300">
{'  4. Press Enter to begin your session'}{'\n'}</span>
            <span className="text-gray-300">
{'  5. Have a natural conversation --'}{'\n'}</span>
            <span className="text-gray-300">
{'     the AI knows your full context'}{'\n'}</span>
            <span className="text-gray-300">
{'  6. At the end, the AI will produce'}{'\n'}</span>
            <span className="text-gray-300">
{'     a JSON export block'}{'\n'}</span>
            <span className="text-gray-300">
{'  7. Copy the JSON block'}{'\n'}</span>
            <span className="text-gray-300">
{'  8. Return here and click'}{'\n'}</span>
            <span className="text-gray-300">
{'     '}</span><span className="text-amber-400">{'[I HAVE THE JSON EXPORT]'}</span>{'\n'}

            {'\n'}

            <span className="text-green-400">
{'  ══════════════════════════════════════════'}{'\n'}
{'  READY. AWAITING DEPLOYMENT.'}{'\n'}
{'  ══════════════════════════════════════════'}{'\n'}
            </span>
          </pre>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
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
