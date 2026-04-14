import type {
  CompassPreviewConfig,
  CompassPromptDefinition,
  CompassScreenDefinition,
  CompassSessionDetail,
} from '../types/compass';
import { COMPASS_FLOW } from './compass-flow';
import { resolveCompassListItems } from './compass-answer-normalization';
import {
  LEGACY_PAST_MONTH_KEYS,
  PAST_MONTHLY_EVENTS_SCREEN_ID,
  PAST_MONTHS_SCREEN_ID,
  resolvePastMonthsState,
} from './compass-past-months';

export interface CompassPreviewTextField {
  kind: 'text';
  label: string;
  value: string;
}

export interface CompassPreviewListField {
  kind: 'list';
  label: string;
  items: string[];
}

export interface CompassPreviewPairsField {
  kind: 'pairs';
  label: string;
  entries: Array<{
    label: string;
    value: string;
  }>;
}

export interface CompassPreviewGroupedListField {
  kind: 'grouped-list';
  label: string;
  groups: Array<{
    label: string;
    items: string[];
  }>;
}

export type CompassPreviewField =
  | CompassPreviewTextField
  | CompassPreviewListField
  | CompassPreviewPairsField
  | CompassPreviewGroupedListField;

export interface CompassPreviewEntry {
  screenId: string;
  title?: string;
  fields: CompassPreviewField[];
}

export interface CompassPreviewSection {
  key: string;
  title: string;
  subtitle: string;
  emphasized: boolean;
  entries: CompassPreviewEntry[];
}

export interface CompassPreviewDocumentData {
  sections: CompassPreviewSection[];
}

function isPresent<T>(value: T | null): value is T {
  return value !== null;
}

function trimValue(value: string | undefined): string {
  return value?.trim() ?? '';
}

function buildTextField(prompt: CompassPromptDefinition, rawValue: string | undefined): CompassPreviewTextField | null {
  const value = trimValue(rawValue);
  if (!value) {
    return null;
  }

  return {
    kind: 'text',
    label: prompt.label,
    value,
  };
}

function buildPairsField(
  prompt: CompassPromptDefinition,
  session: CompassSessionDetail,
  screen: CompassScreenDefinition,
): CompassPreviewPairsField | null {
  const entries = (prompt.inputs ?? [])
    .map(input => ({
      label: input.label ?? input.placeholder ?? input.key,
      value: trimValue(session.answers[screen.id]?.[input.key]),
    }))
    .filter(entry => entry.value.length > 0);

  if (entries.length === 0) {
    return null;
  }

  return {
    kind: 'pairs',
    label: prompt.label,
    entries,
  };
}

function buildMultiInputField(
  prompt: CompassPromptDefinition,
  session: CompassSessionDetail,
  screen: CompassScreenDefinition,
): CompassPreviewListField | null {
  const items = resolveCompassListItems(session.answers[screen.id], {
    key: prompt.key,
    legacyInputKeys: prompt.legacyInputKeys,
  });

  if (items.length === 0) {
    return null;
  }

  return {
    kind: 'list',
    label: prompt.label,
    items,
  };
}

function buildSignatureField(
  session: CompassSessionDetail,
  prompt: CompassPromptDefinition,
  screen: CompassScreenDefinition,
): CompassPreviewPairsField | null {
  const entries = [
    {
      label: 'Name',
      value: trimValue(session.answers[screen.id]?.name),
    },
    {
      label: 'Signature',
      value: trimValue(session.answers[screen.id]?.signature),
    },
  ].filter(entry => entry.value.length > 0);

  if (entries.length === 0) {
    return null;
  }

  return {
    kind: 'pairs',
    label: prompt.label,
    entries,
  };
}

function buildPromptField(
  session: CompassSessionDetail,
  screen: CompassScreenDefinition,
  prompt: CompassPromptDefinition,
): CompassPreviewField | null {
  if (prompt.type === 'checklist') {
    return null;
  }

  if (prompt.type === 'textarea' || prompt.type === 'short-text') {
    return buildTextField(prompt, session.answers[screen.id]?.[prompt.key]);
  }

  if (prompt.type === 'multi-short-text' || prompt.type === 'multi-textarea') {
    return buildPairsField(prompt, session, screen);
  }

  if (prompt.type === 'multi-input') {
    return buildMultiInputField(prompt, session, screen);
  }

  if (prompt.type === 'signature') {
    return buildSignatureField(session, prompt, screen);
  }

  return null;
}

function buildMonthlyEventsEntry(session: CompassSessionDetail, screen: CompassScreenDefinition): CompassPreviewEntry | null {
  const pastMonthsState = resolvePastMonthsState(
    session.answers[PAST_MONTHS_SCREEN_ID],
    new Date(session.createdAt),
  );

  const groups = LEGACY_PAST_MONTH_KEYS.map((fieldKey, index) => {
    const items = resolveCompassListItems(session.answers[screen.id], { key: fieldKey });

    if (items.length === 0) {
      return null;
    }

    return {
      label: pastMonthsState.monthNames[index] ?? `Month ${index + 1}`,
      items,
    };
  }).filter(isPresent);

  if (groups.length === 0) {
    return null;
  }

  return {
    screenId: screen.id,
    title: screen.headline,
    fields: [
      {
        kind: 'grouped-list',
        label: 'Month-by-month review',
        groups,
      },
    ],
  };
}

function buildScreenEntry(session: CompassSessionDetail, screen: CompassScreenDefinition): CompassPreviewEntry | null {
  if (screen.type === 'preview') {
    return null;
  }

  if (screen.id === PAST_MONTHLY_EVENTS_SCREEN_ID) {
    return buildMonthlyEventsEntry(session, screen);
  }

  if (!screen.prompts?.length) {
    return null;
  }

  const fields = screen.prompts
    .map(prompt => buildPromptField(session, screen, prompt))
    .filter(isPresent);

  if (fields.length === 0) {
    return null;
  }

  return {
    screenId: screen.id,
    title: screen.headline,
    fields,
  };
}

export function buildCompassPreview(
  session: CompassSessionDetail,
  config: CompassPreviewConfig,
): CompassPreviewDocumentData {
  const sectionKeySet = new Set(config.sectionKeys);

  const sections = COMPASS_FLOW.filter(section => sectionKeySet.has(section.key))
    .map(section => {
      const entries = section.screens
        .map(screen => buildScreenEntry(session, screen))
        .filter(isPresent);

      return {
        key: section.key,
        title: section.title,
        subtitle: section.subtitle,
        emphasized: section.key === config.emphasisSectionKey,
        entries,
      };
    })
    .filter(section => section.entries.length > 0);

  return { sections };
}

export function createFullCompassPreviewConfig(): CompassPreviewConfig {
  return {
    title: 'Golden Compass View',
    description: 'A formatted workbook view ready to print or save as PDF.',
    sectionKeys: COMPASS_FLOW.map(section => section.key),
    availability: 'full-view',
  };
}
