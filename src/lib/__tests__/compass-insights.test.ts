import { describe, expect, it } from 'vitest';
import { extractCompassAdvisorContext } from '../compass-insights';

describe('extractCompassAdvisorContext', () => {
  it('maps The Past and The Perfect Day answers into advisor context', () => {
    const context = extractCompassAdvisorContext({
      sessionId: 'compass-1',
      planningYear: 2026,
      completedAt: '2026-04-09T12:00:00.000Z',
      answers: {
        'past-highlights': {
          items: JSON.stringify(['Left the old job', 'Started L.A.B.']),
        },
        'past-proud': {
          main: 'I stayed steady when things were chaotic.',
        },
        'past-challenges': {
          main: 'Burnout made everything feel heavier than it should have.',
        },
        'past-lessons': {
          main: 'I need clarity before I say yes to new commitments.',
        },
        'past-compassion-box': {
          main: 'Dragging my feet on hard conversations.',
        },
        'perfect-day-overview': {
          main: 'I wake up calm, write, train, and move through deep work without panic.',
        },
        'perfect-day-body': {
          main: 'My body feels strong, rested, and unhurried.',
        },
        'perfect-day-work': {
          main: 'I spend most of the day building useful things that feel meaningful.',
        },
        'perfect-day-relationships': {
          main: 'I am present with the people I care about and not mentally elsewhere.',
        },
      },
    });

    expect(context).toEqual({
      sessionId: 'compass-1',
      planningYear: 2026,
      completedAt: '2026-04-09T12:00:00.000Z',
      past: {
        highlights: ['Left the old job', 'Started L.A.B.'],
        proud: 'I stayed steady when things were chaotic.',
        challenges: 'Burnout made everything feel heavier than it should have.',
        lessons: 'I need clarity before I say yes to new commitments.',
        selfForgiveness: 'Dragging my feet on hard conversations.',
      },
      perfectDay: {
        overview: 'I wake up calm, write, train, and move through deep work without panic.',
        body: 'My body feels strong, rested, and unhurried.',
        work: 'I spend most of the day building useful things that feel meaningful.',
        relationships: 'I am present with the people I care about and not mentally elsewhere.',
      },
    });
  });

  it('drops empty items and lightly trims very long answers', () => {
    const longAnswer = 'a'.repeat(700);
    const longHighlight = 'b'.repeat(220);
    const context = extractCompassAdvisorContext({
      sessionId: 'compass-2',
      planningYear: 2026,
      completedAt: '2026-04-09T13:00:00.000Z',
      answers: {
        'past-highlights': {
          items: JSON.stringify(['  ', longHighlight]),
        },
        'past-proud': {
          main: longAnswer,
        },
      },
    });

    expect(context.past.highlights).toHaveLength(1);
    expect(context.past.highlights[0]).toMatch(/\.\.\.$/);
    expect(context.past.highlights[0]?.length).toBeLessThan(longHighlight.length);
    expect(context.past.proud).toMatch(/\.\.\.$/);
    expect(context.past.proud.length).toBeLessThan(longAnswer.length);
    expect(context.past.challenges).toBe('');
    expect(context.perfectDay.overview).toBe('');
  });
});
