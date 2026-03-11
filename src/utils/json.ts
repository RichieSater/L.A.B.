export interface JsonParseResult<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export function safeJsonParse<T>(str: string): JsonParseResult<T> {
  try {
    const data = JSON.parse(str) as T;
    return { success: true, data, error: null };
  } catch (e) {
    return {
      success: false,
      data: null,
      error: e instanceof Error ? e.message : 'Unknown JSON parse error',
    };
  }
}

/**
 * Extract a JSON object from text that may contain surrounding content.
 * Handles markdown code fences and explanatory text wrapping.
 */
export function extractJson(text: string): string {
  // Strip markdown code fences
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }

  // Try to find a JSON object by looking for outermost { }
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1);
  }

  // Return as-is if no extraction possible
  return text.trim();
}
