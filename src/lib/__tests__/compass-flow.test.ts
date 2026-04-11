import { describe, expect, it } from 'vitest';
import { COMPASS_FLOW, getAllCompassScreens } from '../compass-flow';

describe('COMPASS_FLOW', () => {
  it('keeps the PDF-derived section order and key screen ids intact', () => {
    expect(COMPASS_FLOW.map(section => section.key)).toEqual([
      'preflight',
      'bonfire',
      'past',
      'future',
      'perfect-day',
      'calibration',
      'lighting',
      'golden-path',
      'closeout',
    ]);

    expect(getAllCompassScreens().map(screen => screen.id)).toEqual([
      'preflight-exercise',
      'preflight-how-it-works',
      'preflight-rules',
      'preflight-instructions',
      'preflight-ready',
      'bonfire-intro',
      'bonfire-write',
      'bonfire-release',
      'bonfire-release-words',
      'past-intro',
      'past-months',
      'past-highlights',
      'past-lessons',
      'past-golden-moments',
      'past-challenges',
      'past-compassion-box',
      'past-forgiveness',
      'future-intro',
      'future-brainstorm',
      'future-next-year',
      'perfect-day-intro',
      'perfect-day-morning',
      'perfect-day-plans',
      'perfect-day-style',
      'perfect-day-midday',
      'perfect-day-money',
      'perfect-day-difference',
      'perfect-day-home',
      'perfect-day-evening',
      'perfect-day-feeling',
      'perfect-day-compass',
      'perfect-day-commitment',
      'lighting-intro',
      'top-3-goals',
      'morning-routine',
      'lighting-environment-joy',
      'financial-help',
      'health-help',
      'relationship-help',
      'lighting-boundaries',
      'vulnerability-partners',
      'lighting-places',
      'lighting-loved-ones',
      'lighting-self-rewards',
      'golden-path-intro',
      'golden-path-instructions',
      'point-a',
      'point-b',
      'challenges-obstacles',
      'golden-path-example',
      'golden-path-process',
      'golden-path-hourglass',
      'golden-path-final-notes',
      'movie-title',
      'final-commitment',
      'time-capsule',
      'time-capsule-reflection',
      'congratulations',
    ]);
  });

  it('retains critical descriptor copy from the PDF source', () => {
    const screens = new Map(getAllCompassScreens().map(screen => [screen.id, screen]));

    expect(screens.get('preflight-exercise')?.headline).toContain('Golden Compass');
    expect(screens.get('preflight-how-it-works')?.contentBlocks?.[0]?.paragraphs?.[0]).toContain(
      'approximately three hours',
    );
    expect(screens.get('bonfire-intro')?.narrativeText).toContain('instant peace');
    expect(screens.get('past-forgiveness')?.contentBlocks?.[0]?.numberedItems?.[1]).toContain(
      'forgiving yourself',
    );
    expect(screens.get('perfect-day-compass')?.headline).toContain('Golden Compass');
    expect(screens.get('golden-path-hourglass')?.headline).toContain('Hourglass Principle');
    expect(screens.get('time-capsule')?.headline).toContain('Universal Time Capsule');
    expect(screens.get('congratulations')?.headline).toContain('Congratulations');
  });
});
