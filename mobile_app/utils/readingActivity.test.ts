import { readingActivity } from './readingActivity';

describe('weekly reading activity', () => {
  const now = new Date(2026, 9, 7, 12);
  const session = (day: number, durationSeconds: number) => ({ createdAt: new Date(2026, 9, day, 23, 59).getTime() / 1000, durationSeconds });
  it('aggregates seven local calendar days without filling missing days', () => {
    const days = readingActivity([session(1, 30), session(1, 90), session(7, 60), session(0, 100), session(8, 100)], now);
    expect(days.map(day => day.date.getDate())).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(days.map(day => day.seconds)).toEqual([120, 0, 0, 0, 0, 0, 60]);
  });
  it('returns an empty chart and ignores negative durations', () => {
    expect(readingActivity([], now).every(day => day.seconds === 0)).toBe(true);
    expect(readingActivity([session(7, -10)], now)[6].seconds).toBe(0);
  });
});
