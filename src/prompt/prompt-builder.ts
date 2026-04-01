import type { AdvisorConfig, AdvisorState } from '../types/advisor';
import type { AppState } from '../types/app-state';
import type { SharedMetricsStore } from '../types/metrics';
import type { QuickLogEntry } from '../types/quick-log';
import { today as getToday, formatDateLong, formatDaysAgo } from '../utils/date';
import { buildPersonaSection } from './sections/persona-section';
import { buildNarrativeSection } from './sections/narrative-section';
import { buildActionItemsSection } from './sections/action-items-section';
import { buildMetricsSection } from './sections/metrics-section';
import { buildCrossAdvisorSection } from './sections/cross-advisor-section';
import { buildSessionHistorySection } from './sections/session-history-section';
import { buildFocusSection } from './sections/focus-section';
import { buildSchemaSection } from './sections/schema-section';
import { buildQuickLogSection } from './sections/quick-log-section';
import { buildIntakeSection } from './sections/intake-section';
import { buildTherapistNotesSection } from './sections/therapist-notes-section';
import { buildStrategicContextSection } from './sections/strategic-context-section';
import { buildStartupProtocol } from './boot-sequence';

export function buildPrompt(
  config: AdvisorConfig,
  advisorState: AdvisorState,
  sharedMetrics: SharedMetricsStore,
  quickLogs: QuickLogEntry[] = [],
  appState?: AppState,
): string {
  const now = getToday();

  const sections: string[] = [];

  // Header
  sections.push(`=== LIFE ADVISORY BOARD — SESSION PROMPT ===
Advisor: ${config.displayName}
Date: ${formatDateLong(now)}
Total sessions to date: ${advisorState.sessions.length}
Current streak: ${advisorState.streak} consecutive on-time sessions`);

  // Auto-boot behavior for the first assistant reply
  sections.push(buildStartupProtocol(config, advisorState));

  // Persona
  sections.push(buildPersonaSection(config));

  // First session intake (only shown when sessions.length === 0)
  const intakeSection = buildIntakeSection(config, advisorState);
  if (intakeSection) {
    sections.push(intakeSection);
  }

  // Narrative
  sections.push(buildNarrativeSection(advisorState));

  // Last session
  if (advisorState.lastSessionDate && advisorState.lastSessionSummary) {
    sections.push(`[LAST SESSION: ${advisorState.lastSessionDate} (${formatDaysAgo(advisorState.lastSessionDate)})]
${advisorState.lastSessionSummary}`);
  } else {
    sections.push(`[LAST SESSION]
No previous sessions. This is our first conversation.`);
  }

  // Session history
  const historySection = buildSessionHistorySection(advisorState);
  if (historySection) {
    sections.push(historySection);
  }

  // Action items
  sections.push(buildActionItemsSection(advisorState));

  // Current metrics
  sections.push(buildMetricsSection(config, advisorState));

  // Cross-advisor context
  sections.push(buildCrossAdvisorSection(config, sharedMetrics, appState));

  const strategicContext = buildStrategicContextSection(appState);
  if (strategicContext) {
    sections.push(strategicContext);
  }

  // Therapist-specific: cross-advisor session notes
  const therapistNotes = buildTherapistNotesSection(config, appState);
  if (therapistNotes) {
    sections.push(therapistNotes);
  }

  // Quick log data since last session
  const quickLogSection = buildQuickLogSection(config, advisorState, quickLogs);
  if (quickLogSection) {
    sections.push(quickLogSection);
  }

  // Context from last session
  if (advisorState.contextForNextSession) {
    sections.push(`[CONTEXT FROM LAST SESSION]
${advisorState.contextForNextSession}`);
  }

  // Suggested focus
  sections.push(buildFocusSection(config, advisorState, sharedMetrics));

  // JSON export schema
  sections.push(buildSchemaSection(config.id));

  return sections.join('\n\n');
}
