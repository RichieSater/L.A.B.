import type { CompassAnswerRecord } from '../types/compass';

export function normalizeCompassListItems(items: string[]): string[] {
  return items
    .map(item => item.trim())
    .filter(Boolean);
}

export function encodeCompassListAnswer(items: string[]): string {
  return JSON.stringify(normalizeCompassListItems(items));
}

export function parseCompassJsonListAnswer(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? normalizeCompassListItems(parsed.map(item => String(item)))
      : [];
  } catch {
    return [];
  }
}

export function parseCompassListAnswer(value: string | undefined): string[] {
  const jsonItems = parseCompassJsonListAnswer(value);
  if (jsonItems.length > 0) {
    return jsonItems;
  }

  return normalizeCompassListItems((value ?? '').split('\n'));
}

export function resolveCompassListItems(
  record: CompassAnswerRecord | undefined,
  options: {
    key?: string;
    legacyInputKeys?: string[];
  } = {},
): string[] {
  const key = options.key ?? 'items';
  const items = parseCompassListAnswer(record?.[key]);
  if (items.length > 0) {
    return items;
  }

  return normalizeCompassListItems(
    (options.legacyInputKeys ?? []).map(legacyKey => record?.[legacyKey] ?? ''),
  );
}
