export interface ActivityDay { date: Date; seconds: number }

// Local calendar boundaries keep late-night sessions on the correct day, including DST.
export function readingActivity(sessions: { createdAt: number; durationSeconds: number }[], now = new Date()): ActivityDay[] {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - 6 + index);
    return { date, seconds: 0 };
  });
  for (const session of sessions) {
    const date = new Date(session.createdAt * 1000);
    date.setHours(0, 0, 0, 0);
    const day = days.find(day => day.date.getTime() === date.getTime());
    if (day) day.seconds += Math.max(0, session.durationSeconds);
  }
  return days;
}
