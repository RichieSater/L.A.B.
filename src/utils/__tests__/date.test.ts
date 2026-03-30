import { describe, expect, it, vi } from 'vitest';
import { formatDateKey, today } from '../date';

describe('formatDateKey', () => {
  it('keeps the local calendar date for users west of UTC', () => {
    const date = new Date('2026-03-31T00:30:00Z');

    expect(formatDateKey(date, 'America/New_York')).toBe('2026-03-30');
  });

  it('returns the next date when the local timezone has crossed midnight', () => {
    const date = new Date('2026-03-30T23:30:00Z');

    expect(formatDateKey(date, 'Asia/Tokyo')).toBe('2026-03-31');
  });
});

describe('today', () => {
  it('uses the local calendar day instead of UTC when a timezone is provided', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-31T00:30:00Z'));

    expect(today('America/New_York')).toBe('2026-03-30');

    vi.useRealTimers();
  });
});
