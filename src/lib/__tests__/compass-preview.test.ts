import { describe, expect, it } from 'vitest';
import { createCompassTestSession } from '../../testing/compass-test-data';
import {
  buildCompassPreview,
  createFullCompassPreviewConfig,
} from '../compass-preview';

describe('buildCompassPreview', () => {
  it('groups meaningful answers by workbook section and skips checklist-only prep screens', () => {
    const preview = buildCompassPreview(createCompassTestSession(), {
      title: 'Past-Year Preview',
      sectionKeys: ['preflight', 'bonfire', 'past'],
      emphasisSectionKey: 'past',
      availability: 'checkpoint',
    });

    expect(preview.sections.map(section => section.key)).toEqual(['bonfire', 'past']);
    expect(preview.sections.find(section => section.key === 'past')?.emphasized).toBe(true);
  });

  it('formats month-by-month review groups from the session month window and respects the saved toggle', () => {
    const session = createCompassTestSession({
      createdAt: '2026-04-11T12:00:00.000Z',
      answers: {
        'past-months': {
          includeCurrentMonth: 'false',
        },
        'past-monthly-events': {
          month1: JSON.stringify(['Started the quarter with less noise.']),
          month2: JSON.stringify(['Made the first clean strategic cut.']),
        },
      },
    });

    const preview = buildCompassPreview(session, {
      title: 'Past-Year Preview',
      sectionKeys: ['past'],
      emphasisSectionKey: 'past',
      availability: 'checkpoint',
    });

    const monthlyField = preview.sections[0]?.entries[0]?.fields[0];
    expect(monthlyField?.kind).toBe('grouped-list');

    if (monthlyField?.kind !== 'grouped-list') {
      throw new Error('Expected grouped month field.');
    }

    expect(monthlyField.groups.map(group => group.label)).toEqual(['April', 'May']);
  });

  it('includes signature data in the final full preview and filters empty sections', () => {
    const preview = buildCompassPreview(
      createCompassTestSession({ status: 'completed' }),
      createFullCompassPreviewConfig(),
    );

    const goldenPathSection = preview.sections.find(section => section.key === 'golden-path');
    const signatureEntry = goldenPathSection?.entries.find(entry => entry.screenId === 'final-commitment');

    expect(signatureEntry).toBeDefined();
    expect(signatureEntry?.fields[0]).toMatchObject({
      kind: 'pairs',
      label: 'Signature',
    });
  });
});
