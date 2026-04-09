import type { AppState } from '../../types/app-state';

function pushLabeledField(lines: string[], label: string, value: string) {
  if (!value) {
    return;
  }

  lines.push(label);
  lines.push(value);
}

export function buildLatestCompassContextSection(appState?: AppState): string | null {
  const context = appState?.strategicDashboard.latestCompassAdvisorContext;

  if (!context) {
    return null;
  }

  const lines: string[] = [
    '[LATEST GOLDEN COMPASS CONTEXT]',
    'Use this verbatim context from the latest completed Golden Compass session when it helps you advise me.',
  ];

  const pastLines: string[] = [];
  if (context.past.highlights.length > 0) {
    pastLines.push('Past highlights from the last 12 months:');
    for (const item of context.past.highlights) {
      pastLines.push(`- ${item}`);
    }
  }
  pushLabeledField(pastLines, 'What I am most proud of:', context.past.proud);
  pushLabeledField(pastLines, 'What challenged me most:', context.past.challenges);
  pushLabeledField(pastLines, 'Lessons I want to carry forward:', context.past.lessons);
  pushLabeledField(pastLines, 'What I am ready to forgive myself for:', context.past.selfForgiveness);

  if (pastLines.length > 0) {
    lines.push('The Past:');
    lines.push(...pastLines);
  }

  const perfectDayLines: string[] = [];
  pushLabeledField(
    perfectDayLines,
    'What an ideal day feels like from start to finish:',
    context.perfectDay.overview,
  );
  pushLabeledField(
    perfectDayLines,
    'How my body, health, and energy feel:',
    context.perfectDay.body,
  );
  pushLabeledField(
    perfectDayLines,
    'What work or contribution fills the day:',
    context.perfectDay.work,
  );
  pushLabeledField(
    perfectDayLines,
    'Who is around me and how relationships feel:',
    context.perfectDay.relationships,
  );

  if (perfectDayLines.length > 0) {
    lines.push('The Perfect Day:');
    lines.push(...perfectDayLines);
  }

  if (lines.length === 2) {
    return null;
  }

  return lines.join('\n');
}
