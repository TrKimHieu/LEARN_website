import { describe, expect, it } from 'vitest';
import { freshestPlan, isLearningPath, nudgeSummary, parseLastShown, shouldNudge } from './nudge';
import type { SavedPlan, TodayTask } from './today-plan';

const at = (d: number, h: number, m = 0) => new Date(2026, 10, d, h, m);
const base = { pathname: '/dashboard', ready: true, pendingCount: 2 };

const review: TodayTask = { id: 'review', kind: 'review', dueCount: 12 };
const lesson = (id: string): TodayTask => ({
  id: `lesson:${id}`,
  kind: 'lesson',
  courseId: 'C',
  lessonId: id,
  title: 't',
  courseTitle: 'c',
  index: 1,
  total: 3,
});
const exercise: TodayTask = {
  id: 'exercise:E',
  kind: 'exercise',
  courseId: 'C',
  lessonId: 'L',
  exerciseId: 'E',
  lessonTitle: 'l',
  score: 40,
};

describe('shouldNudge', () => {
  it('first ever open shows', () => {
    expect(shouldNudge({ ...base, now: at(18, 9), lastShown: null })).toBe(true);
  });
  it('same day within 4 hours does not show', () => {
    expect(shouldNudge({ ...base, now: at(18, 13, 59), lastShown: at(18, 10) })).toBe(false);
  });
  it('same day after 4 hours shows', () => {
    expect(shouldNudge({ ...base, now: at(18, 14), lastShown: at(18, 10) })).toBe(true);
  });
  it('new day shows even within 4 hours', () => {
    expect(shouldNudge({ ...base, now: at(19, 0, 30), lastShown: at(18, 23) })).toBe(true);
  });
  it('nothing pending does not show', () => {
    expect(shouldNudge({ ...base, pendingCount: 0, now: at(18, 9), lastShown: null })).toBe(false);
  });
  it('not ready does not show', () => {
    expect(shouldNudge({ ...base, ready: false, now: at(18, 9), lastShown: null })).toBe(false);
  });
  it('learning path neither shows nor counts', () => {
    for (const p of [
      '/courses/a/lessons/b',
      '/courses/a/lessons/b/practice',
      '/review',
      '/decks/x/review',
      '/focus',
    ]) {
      expect(isLearningPath(p)).toBe(true);
    }
    for (const p of ['/dashboard', '/courses', '/courses/a', '/decks', '/decks/x', '/settings']) {
      expect(isLearningPath(p)).toBe(false);
    }
    expect(shouldNudge({ ...base, pathname: '/review', now: at(18, 9), lastShown: null })).toBe(
      false,
    );
  });
});

describe('parseLastShown', () => {
  it('corrupt value counts as never shown', () => {
    expect(parseLastShown('nope')).toBeNull();
    expect(parseLastShown(null)).toBeNull();
    expect(parseLastShown('{}')).toBeNull();
  });
  it('reads an ISO time back', () => {
    const t = at(18, 10);
    expect(parseLastShown(t.toISOString())?.getTime()).toBe(t.getTime());
  });
});

describe('nudgeSummary', () => {
  it('summary joins kinds in plan order', () => {
    expect(nudgeSummary([review, lesson('L1'), exercise])).toBe(
      '12 thẻ đến hạn · 1 bài học · 1 bài cần luyện lại',
    );
  });
  it('summary adds same kinds', () => {
    expect(nudgeSummary([lesson('L1'), lesson('L2')])).toBe('2 bài học');
  });
});

describe('freshestPlan', () => {
  const plan = (day: string, done: string[]): SavedPlan => ({
    day,
    tasks: [lesson('L1')],
    done,
  });
  it('prefers the saved plan of today, which has the latest done marks', () => {
    const saved = plan('2026-11-18', ['lesson:L1']);
    expect(freshestPlan(saved, plan('2026-11-18', []), '2026-11-18')).toBe(saved);
  });
  it('ignores a saved plan from another day', () => {
    const mine = plan('2026-11-18', []);
    expect(freshestPlan(plan('2026-11-17', ['lesson:L1']), mine, '2026-11-18')).toBe(mine);
  });
  it('falls back to the hook plan when nothing is saved', () => {
    const mine = plan('2026-11-18', []);
    expect(freshestPlan(null, mine, '2026-11-18')).toBe(mine);
  });
});
