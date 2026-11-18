import { describe, expect, it } from 'vitest';
import type { HistoryItem, LessonSummary } from '@learn/api-contracts';
import {
  buildTasks,
  isDone,
  markDone,
  parsePlan,
  pickNextLesson,
  planGate,
  reconcile,
  retriedToday,
  taskHref,
  type SavedPlan,
  type TodayTask,
} from './today-plan';

const lesson = (n: number) => ({
  courseId: 'C',
  lessonId: `L${n}`,
  title: `Bài ${n}`,
  courseTitle: 'Khóa',
  index: n,
  total: 5,
});
const item = (
  exerciseId: string,
  passed: boolean,
  createdAt = '2026-11-17T00:00:00Z',
): HistoryItem =>
  ({
    id: `${exerciseId}-${passed}`,
    courseId: 'C',
    lessonId: 'L1',
    exerciseId,
    passed,
    lessonTitle: 'Bài 1',
    courseTitle: 'Khóa',
    exerciseTitle: 'Bài tập',
    score: 3,
    maxScore: 10,
    createdAt,
  }) as HistoryItem;
const ids = (t: TodayTask[]) => t.map((x) => x.id);

describe('buildTasks', () => {
  it('orders review, next lesson, failed exercise', () => {
    const history = [item('E1', false)];
    const t = buildTasks({ dueCount: 12, nextLessons: [lesson(1), lesson(2)], history });
    expect(ids(t)).toEqual(['review', 'lesson:L1', 'exercise:E1']);
  });
  it('adds second course lesson when under two tasks', () => {
    const t = buildTasks({ dueCount: 0, nextLessons: [lesson(1), lesson(2)], history: [] });
    expect(ids(t)).toEqual(['lesson:L1', 'lesson:L2']);
  });
  it('skips exercises passed later', () => {
    const history = [item('E1', true), item('E1', false)];
    const t = buildTasks({ dueCount: 0, nextLessons: [lesson(1)], history });
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
    expect(reconcile({ ...saved, day: '2026-11-16' }, fresh, '2026-11-17')).toEqual({
      day: '2026-11-17',
      tasks: fresh,
      done: [],
    });
  });
  it('a new list starts with the tasks already done today', () => {
    const plan = reconcile(null, fresh, '2026-11-17', ['exercise:E1']);
    expect(plan.done).toEqual(['exercise:E1']);
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

describe('retriedToday', () => {
  // Giờ địa phương, để ngày của createdAt khớp với ngày trình duyệt.
  const at = (d: number, h: number) => new Date(2026, 10, d, h).toISOString();
  it('counts a failed exercise retried today (local day) as done', () => {
    const history = [item('E1', false, at(17, 9)), item('E2', false, at(16, 9))];
    expect(retriedToday(history, '2026-11-17')).toEqual(['exercise:E1']);
  });
  it('lists each exercise once and ignores passed attempts', () => {
    const history = [
      item('E1', false, at(17, 10)),
      item('E1', false, at(17, 9)),
      item('E3', true, at(17, 8)),
    ];
    expect(retriedToday(history, '2026-11-17')).toEqual(['exercise:E1']);
  });
});

describe('planGate', () => {
  const ok = { isLoading: false, isLoadingError: false, isFetching: false };
  it('waits while any input is loading', () => {
    expect(planGate([ok, { ...ok, isLoading: true, isFetching: true }])).toBe('wait');
  });
  it('waits while any input is refetching, so a new day never uses stale data', () => {
    expect(planGate([ok, { ...ok, isFetching: true }])).toBe('wait');
  });
  it('blocks the plan when any input failed to load, even if others still load', () => {
    expect(planGate([{ ...ok, isLoading: true }, { ...ok, isLoadingError: true }])).toBe('error');
  });
  it('is ready when every input loaded (disabled queries count as loaded)', () => {
    expect(planGate([ok, ok])).toBe('ready');
    expect(planGate([])).toBe('ready');
  });
});

describe('pickNextLesson', () => {
  const l = (id: string, progressStatus: string) => ({ id, progressStatus }) as LessonSummary;
  it('prefers the lesson in progress', () => {
    const list = [l('a', 'COMPLETED'), l('b', 'NOT_STARTED'), l('c', 'IN_PROGRESS')];
    expect(pickNextLesson(list)).toEqual({ lesson: list[2], index: 2 });
  });
  it('falls back to the first not started', () => {
    const list = [l('a', 'COMPLETED'), l('b', 'NOT_STARTED'), l('c', 'NOT_STARTED')];
    expect(pickNextLesson(list)).toEqual({ lesson: list[1], index: 1 });
  });
  it('returns null when all are done', () => {
    expect(pickNextLesson([l('a', 'COMPLETED')])).toBeNull();
    expect(pickNextLesson([])).toBeNull();
  });
});

describe('taskHref', () => {
  it('review goes to /review', () => {
    expect(taskHref({ id: 'review', kind: 'review', dueCount: 3 })).toBe('/review');
  });
  it('lesson goes to the lesson page', () => {
    expect(
      taskHref({
        id: 'lesson:L',
        kind: 'lesson',
        courseId: 'C',
        lessonId: 'L',
        title: 't',
        courseTitle: 'c',
        index: 1,
        total: 2,
      }),
    ).toBe('/courses/C/lessons/L');
  });
  it('exercise goes to practice with the exercise encoded', () => {
    expect(
      taskHref({
        id: 'exercise:E/1',
        kind: 'exercise',
        courseId: 'C',
        lessonId: 'L',
        exerciseId: 'E/1',
        lessonTitle: 'l',
        score: 40,
      }),
    ).toBe('/courses/C/lessons/L/practice?exercise=E%2F1');
  });
});
