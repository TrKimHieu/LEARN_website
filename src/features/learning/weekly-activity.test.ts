import { describe, expect, it } from 'vitest';
import { buildWeeklyActivity } from './weekly-activity';

const NOW = new Date(2026, 10, 4, 15, 0); // thứ Tư, 4/11/2026, giờ máy

describe('buildWeeklyActivity', () => {
  it('trả đúng 7 ngày, kết thúc ở hôm nay', () => {
    const week = buildWeeklyActivity([], NOW);
    expect(week.map((d) => d.label)).toEqual(['T5', 'T6', 'T7', 'CN', 'T2', 'T3', 'T4']);
    expect(week.at(-1)?.isToday).toBe(true);
    expect(week.every((d) => d.count === 0)).toBe(true);
  });

  it('đếm theo ngày giờ máy và bỏ lượt ngoài 7 ngày', () => {
    const at = (day: number, h = 9) => ({ createdAt: new Date(2026, 10, day, h).toISOString() });
    const week = buildWeeklyActivity(
      [at(4), at(4, 23), at(3), at(1), { createdAt: new Date(2026, 9, 28).toISOString() }],
      NOW,
    );
    expect(week.map((d) => d.count)).toEqual([0, 0, 0, 1, 0, 1, 2]);
  });
});
