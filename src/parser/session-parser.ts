import { extractJson, safeJsonParse } from '../utils/json';
import { validateSessionImport, type ValidationResult } from './schema-validator';

/**
 * Parse a raw string (potentially containing markdown/explanation) into a validated SessionImport.
 */
export function parseSessionImport(rawInput: string): ValidationResult {
  const trimmed = rawInput.trim();

  if (!trimmed) {
    return {
      valid: false,
      errors: [{ field: 'input', message: 'Empty input. Please paste the JSON export from your AI session.', received: '' }],
      warnings: [],
      parsed: null,
    };
  }

  // Extract JSON from potential markdown/text wrapping
  const jsonStr = extractJson(trimmed);

  // Attempt to parse
  const parseResult = safeJsonParse(jsonStr);

  if (!parseResult.success) {
    return {
      valid: false,
      errors: [{
        field: 'json',
        message: `Invalid JSON: ${parseResult.error}. Make sure you copied the complete JSON block from the AI's response.`,
        received: jsonStr.slice(0, 100) + (jsonStr.length > 100 ? '...' : ''),
      }],
      warnings: [],
      parsed: null,
    };
  }

  // Validate the parsed object against our schema
  return validateSessionImport(parseResult.data);
}
