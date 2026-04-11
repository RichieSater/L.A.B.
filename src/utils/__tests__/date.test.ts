import { describe, expect, it, vi } from 'vitest';
import {
  formatDateKey,
  getCompassPastMonthNames,
  getDefaultCompassPastMonthsIncludeCurrentMonth,
  today,
} from '../date';

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

describe('getDefaultCompassPastMonthsIncludeCurrentMonth', () => {
  it('includes the current month after the 10th day', () => {
    expect(getDefaultCompassPastMonthsIncludeCurrentMonth(new Date('2026-04-11T12:00:00.000Z'))).toBe(true);
  });

  it('uses the last full 12 months on the 10th day or earlier', () => {
    expect(getDefaultCompassPastMonthsIncludeCurrentMonth(new Date('2026-04-10T12:00:00.000Z'))).toBe(false);
  });
});

describe('getCompassPastMonthNames', () => {
  it('returns the last 12 months in chronological order when including the current month', () => {
    expect(getCompassPastMonthNames(new Date('2026-04-11T12:00:00.000Z'), true)).toEqual([
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
      'January',
      'February',
      'March',
      'April',
    ]);
  });

  it('returns the last full 12 completed months in chronological order across year boundaries', () => {
    expect(getCompassPastMonthNames(new Date('2026-04-10T12:00:00.000Z'), false)).toEqual([
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
      'January',
      'February',
      'March',
    ]);
  });
});
