import type { CompassAnswerRecord } from '../types/compass';
import { parseCompassListAnswer } from './compass-answer-normalization';
import {
  getCompassPastMonthNames,
  getDefaultCompassPastMonthsIncludeCurrentMonth,
} from '../utils/date';

export type CompassPastMonthsStateSource = 'saved' | 'legacy' | 'default';

export interface CompassPastMonthsState {
  includeCurrentMonth: boolean;
  monthNames: string[];
  source: CompassPastMonthsStateSource;
}

export const PAST_MONTHS_SCREEN_ID = 'past-months';
export const PAST_MONTHLY_EVENTS_SCREEN_ID = 'past-monthly-events';
export const PAST_MONTHS_INCLUDE_CURRENT_KEY = 'includeCurrentMonth';
export const LEGACY_PAST_MONTH_KEYS = Array.from({ length: 12 }, (_, index) => `month${index + 1}`);

function normalizeMonthName(value: string): string {
  return value.trim().toLowerCase();
}

function collectLegacyPastMonthNames(record: CompassAnswerRecord | undefined): string[] {
  return LEGACY_PAST_MONTH_KEYS.map(key => record?.[key]?.trim() ?? '').filter(Boolean);
}

function matchesMonthWindow(savedMonths: string[], generatedMonths: string[]): boolean {
  return (
    savedMonths.length === generatedMonths.length &&
    savedMonths.every((month, index) => normalizeMonthName(month) === normalizeMonthName(generatedMonths[index] ?? ''))
  );
}

export function hasPastMonthlyEventEntries(record: CompassAnswerRecord): boolean {
  return LEGACY_PAST_MONTH_KEYS.some(key => parseCompassListAnswer(record[key]).length > 0);
}

export function resolvePastMonthsState(
  record: CompassAnswerRecord | undefined,
  sessionCreatedAt: Date,
): CompassPastMonthsState {
  const explicitMode = record?.[PAST_MONTHS_INCLUDE_CURRENT_KEY];
  if (explicitMode === 'true' || explicitMode === 'false') {
    const includeCurrentMonth = explicitMode === 'true';

    return {
      includeCurrentMonth,
      monthNames: getCompassPastMonthNames(sessionCreatedAt, includeCurrentMonth),
      source: 'saved',
    };
  }

  const legacyMonths = collectLegacyPastMonthNames(record);
  if (legacyMonths.length === LEGACY_PAST_MONTH_KEYS.length) {
    const includeCurrentMonthMonths = getCompassPastMonthNames(sessionCreatedAt, true);
    if (matchesMonthWindow(legacyMonths, includeCurrentMonthMonths)) {
      return {
        includeCurrentMonth: true,
        monthNames: includeCurrentMonthMonths,
        source: 'legacy',
      };
    }

    const lastFullMonths = getCompassPastMonthNames(sessionCreatedAt, false);
    if (matchesMonthWindow(legacyMonths, lastFullMonths)) {
      return {
        includeCurrentMonth: false,
        monthNames: lastFullMonths,
        source: 'legacy',
      };
    }
  }

  const includeCurrentMonth = getDefaultCompassPastMonthsIncludeCurrentMonth(sessionCreatedAt);
  return {
    includeCurrentMonth,
    monthNames: getCompassPastMonthNames(sessionCreatedAt, includeCurrentMonth),
    source: 'default',
  };
}
