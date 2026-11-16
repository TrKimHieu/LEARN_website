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
  activeStreak: number;
}): Mood {
  if (i.allDone) return 'celebrate';
  // Ngày học theo múi giờ máy chủ có thể sang ngày sớm hơn trình duyệt: vẫn là học hôm nay.
  if (i.lastStudyDay !== null && i.lastStudyDay >= i.today) {
    // Chuỗi = 1 nghĩa là hôm nay là ngày học đầu tiên sau quãng nghỉ.
    const back =
      i.activeStreak === 1 &&
      i.previousSeenStudyDay !== null &&
      daysBetween(i.previousSeenStudyDay, i.today) >= 2;
    return back ? 'excited' : 'happy';
  }
  if (i.lastStudyDay === null) return 'listening';
  const idle = daysBetween(i.lastStudyDay, i.today);
  if (idle <= 1) return 'listening';
  return idle <= 3 ? 'sad' : 'sleeping';
}

/** Ngày học đáng lưu để so lần sau: chỉ ngày trước hôm nay, nên học xong hôm nay vẫn so được. */
export function seenStudyDayToKeep(lastStudyDay: string | null, today: string): string | null {
  return lastStudyDay !== null && lastStudyDay < today ? lastStudyDay : null;
}
