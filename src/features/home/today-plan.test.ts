import { describe, expect, it } from 'vitest';
import type { HistoryItem } from '@learn/api-contracts';
import { buildTasks, isDone, markDone, parsePlan, planGate, reconcile, type SavedPlan, type TodayTask } from './today-plan';

const lesson = (n: number) => ({ courseId: 'C', lessonId: `L${n}`, title: `Bài ${n}`, courseTitle: 'Khóa', index: n, total: 5 });
const item = (exerciseId: string, passed: boolean): HistoryItem =>
  ({ id: `${exerciseId}-${passed}`, courseId: 'C', lessonId: 'L1', exerciseId, passed, lessonTitle: 'Bài 1', courseTitle: 'Khóa', exerciseTitle: 'Bài tập', score: 3, maxScore: 10, createdAt: '2026-11-17T00:00:00Z' }) as HistoryItem;
const ids = (t: TodayTask[]) => t.map((x) => x.id);

describe('buildTasks', () => {
  it('orders review, next lesson, failed exercise', () => {
    const t = buildTasks({ dueCount: 12, nextLessons: [lesson(1), lesson(2)], history: [item('E1', false)] });
    expect(ids(t)).toEqual(['review', 'lesson:L1', 'exercise:E1']);
  });
  it('adds second course lesson when under two tasks', () => {
    const t = buildTasks({ dueCount: 0, nextLessons: [lesson(1), lesson(2)], history: [] });
    expect(ids(t)).toEqual(['lesson:L1', 'lesson:L2']);
  });
  it('skips exercises passed later', () => {
    const t = buildTasks({ dueCount: 0, nextLessons: [lesson(1)], history: [item('E1', true), item('E1', false)] });
    expect(ids(t).some((i) => i.startsWith('exercise:'))).toBe(false);
  });
});

describe('plan state', () => {
  const fresh = buildTasks({ dueCount: 3, nextLessons: [lesson(1)], history: [] });
  const saved: SavedPlan = { day: '2026-11-17', tasks: fresh, done: ['lesson:L1'] };
  it('keeps saved list on same day', () => {
    expect(reconcile(saved, fresh, '2026-11-17')).toBe(saved);
  });
  it('starts a new list on a new day', () => {
    expect(reconcile({ ...saved, day: '2026-11-16' }, fresh, '2026-11-17')).toEqual({ day: '2026-11-17', tasks: fresh, done: [] });
  });
  it('review is done when nothing is due', () => {
    expect(isDone({ ...saved, done: [] }, fresh[0]!, 0)).toBe(true);
    expect(isDone({ ...saved, done: [] }, fresh[0]!, 2)).toBe(false);
  });
  it('markDone appends once', () => {
    const p = markDone(saved, 'review');
    expect(p.done).toEqual(['lesson:L1', 'review']);
    expect(markDone(p, 'review')).toBe(p);
  });
  it('ignores corrupt saved plan', () => {
    expect(parsePlan('{bad')).toBeNull();
    expect(parsePlan('{"day":1}')).toBeNull();
    expect(parsePlan(null)).toBeNull();
    expect(parsePlan(JSON.stringify(saved))).toEqual(saved);
  });
  it('rejects saved tasks the screen cannot render', () => {
    const plan = (tasks: unknown) => JSON.stringify({ day: '2026-11-17', tasks, done: [] });
    expect(parsePlan(plan([null]))).toBeNull();
    expect(parsePlan(plan([{ kind: 'lesson' }]))).toBeNull();
    expect(parsePlan(plan([{ id: 'x', kind: 'quiz' }]))).toBeNull();
  });
  it('keeps only string ids in done', () => {
    const raw = JSON.stringify({ day: '2026-11-17', tasks: fresh, done: ['review', 3, null] });
    expect(parsePlan(raw)?.done).toEqual(['review']);
  });
});

describe('planGate', () => {
  const ok = { isLoading: false, isLoadingError: false };
  it('waits while any input is loading', () => {
    expect(planGate([ok, { isLoading: true, isLoadingError: false }])).toBe('wait');
  });
  it('blocks the plan when any input failed to load, even if others still load', () => {
    expect(planGate([{ isLoading: true, isLoadingError: false }, { isLoading: false, isLoadingError: true }])).toBe('error');
  });
  it('is ready when every input loaded (disabled queries count as loaded)', () => {
    expect(planGate([ok, ok])).toBe('ready');
    expect(planGate([])).toBe('ready');
  });
});
