const DAY_LABEL = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export interface DayActivity {
  key: string;
  label: string;
  count: number;
  isToday: boolean;
}

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/** Số lần làm bài trong 7 ngày gần nhất, cắt ngày theo giờ máy người dùng. */
export function buildWeeklyActivity(
  items: ReadonlyArray<{ createdAt: string }>,
  now: Date = new Date(),
): DayActivity[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = dayKey(new Date(item.createdAt));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i));
    const key = dayKey(day);
    return { key, label: DAY_LABEL[day.getDay()]!, count: counts.get(key) ?? 0, isToday: i === 6 };
  });
}
