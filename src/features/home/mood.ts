export type Mood = 'happy' | 'listening' | 'sad' | 'sleeping' | 'excited' | 'celebrate';

const DAY_MS = 86_400_000;

/** Calendar days from a to b (YYYY-MM-DD), a <= b. */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / DAY_MS);
}

export function moodFor(i: {
  today: string;
  lastStudyDay: string | null;
  previousSeenStudyDay: string | null;
  allDone: boolean;
}): Mood {
  if (i.allDone) return 'celebrate';
  if (i.lastStudyDay === i.today) {
    return i.previousSeenStudyDay !== null && daysBetween(i.previousSeenStudyDay, i.today) >= 2 ? 'excited' : 'happy';
  }
  if (i.lastStudyDay === null) return 'listening';
  const idle = daysBetween(i.lastStudyDay, i.today);
  if (idle <= 1) return 'listening';
  return idle <= 3 ? 'sad' : 'sleeping';
}
