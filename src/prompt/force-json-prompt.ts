import type { AdvisorId } from '../types/advisor';

export function buildForceJsonPrompt(advisorId: AdvisorId): string {
  const prefix = advisorId.slice(0, 3).toUpperCase();

  return `Please produce the session export JSON now. Output ONLY a valid JSON block wrapped in \`\`\`json code fences. Use EXACTLY this format:

\`\`\`json
{
  "advisor": "${advisorId}",
  "date": "YYYY-MM-DD",
  "summary": "2-4 sentence recap of what was discussed and decided",
  "action_items": [
    {
      "id": "${prefix}-XXX",
      "task": "Specific actionable task",
      "due": "YYYY-MM-DD or ongoing",
      "priority": "high | medium | low"
    }
  ],
  "completed_items": ["ID-of-completed-item"],
  "deferred_items": [
    {
      "id": "ID-of-deferred-item",
      "reason": "Why deferred",
      "new_due": "YYYY-MM-DD"
    }
  ],
  "metrics": {
    "metric_name": 7
  },
  "context_for_next_session": "Key context to carry forward",
  "mood": "one-word emotional state",
  "energy": 7,
  "session_rating": 8,
  "narrative_update": "2-3 sentences updating our advisory relationship story",
  "card_preview": "1-2 sentence dashboard status"
}
\`\`\`

Base this on our conversation above. All metric values must be numbers. Energy and session_rating must be 1-10 integers.`;
}
