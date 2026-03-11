import type { AdvisorId } from '../../types/advisor';

export function buildSchemaSection(advisorId: AdvisorId): string {
  return `[SESSION INSTRUCTIONS]
Conduct a focused advisory session. At the end of our conversation, you MUST produce a JSON export block wrapped in \`\`\`json code fences in EXACTLY this format:

\`\`\`json
{
  "advisor": "${advisorId}",
  "date": "YYYY-MM-DD",
  "summary": "2-4 sentence recap of what was discussed and decided",
  "action_items": [
    {
      "id": "${advisorId.slice(0, 3).toUpperCase()}-XXX",
      "task": "Specific actionable task description",
      "due": "YYYY-MM-DD or ongoing",
      "priority": "high | medium | low"
    }
  ],
  "completed_items": ["ID-of-previously-open-item-now-done"],
  "deferred_items": [
    {
      "id": "ID-of-item-being-deferred",
      "reason": "Why this is being deferred",
      "new_due": "YYYY-MM-DD"
    }
  ],
  "metrics": {
    "metric_name": 7
  },
  "context_for_next_session": "Key threads, unresolved questions, or important context to carry forward to next session",
  "mood": "one-word emotional state tag (e.g. focused, anxious, motivated, drained)",
  "energy": 7,
  "session_rating": 8,
  "narrative_update": "2-3 sentences updating the ongoing story of our advisory relationship. What changed, what was learned, what shifted.",
  "card_preview": "1-2 sentence status update for the dashboard card reflecting current focus and progress"
}
\`\`\`

IMPORTANT RULES FOR THE JSON EXPORT:
- The JSON must be valid and parseable
- action_items: Create new items with unique IDs using the format ${advisorId.slice(0, 3).toUpperCase()}-XXX (e.g., ${advisorId.slice(0, 3).toUpperCase()}-001, ${advisorId.slice(0, 3).toUpperCase()}-002)
- completed_items: Reference IDs of previously open items that are now done
- deferred_items: Reference IDs of items being pushed back, with a reason and new date
- metrics: ALL metric values MUST be numbers (integers or decimals). For yes/no metrics use 1 or 0. No strings allowed in metric values.
- energy and session_rating: integers from 1-10
- narrative_update: This becomes part of the permanent record of our relationship
- card_preview: A short 1-2 sentence status shown on your dashboard card. Reflect current focus, progress, or next milestone.

Begin the session now.`;
}
