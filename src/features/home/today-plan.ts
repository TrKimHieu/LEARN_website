import type { HistoryItem } from '@learn/api-contracts';
import { TODAY_KEY } from '../../lib/today-store';

export type TodayTask =
  | { id: 'review'; kind: 'review'; dueCount: number }
  | { id: `lesson:${string}`; kind: 'lesson'; courseId: string; lessonId: string; title: string; courseTitle: string; index: number; total: number }
  | { id: `exercise:${string}`; kind: 'exercise'; courseId: string; lessonId: string; exerciseId: string; lessonTitle: string; score: number };

export interface TodayInputs {
  dueCount: number;
  nextLessons: Array<Omit<Extract<TodayTask, { kind: 'lesson' }>, 'id' | 'kind'>>; // in course priority order; index is 1-based
  history: HistoryItem[]; // newest first
}
export interface SavedPlan { day: string; tasks: TodayTask[]; done: string[] }

const MAX_TASKS = 4;

function lessonTask(l: TodayInputs['nextLessons'][number]): TodayTask {
  return { ...l, id: `lesson:${l.lessonId}`, kind: 'lesson' };
}

export function buildTasks({ dueCount, nextLessons, history }: TodayInputs): TodayTask[] {
  const tasks: TodayTask[] = [];
  if (dueCount > 0) tasks.push({ id: 'review', kind: 'review', dueCount });
  if (nextLessons[0]) tasks.push(lessonTask(nextLessons[0]));
  const passed = new Set(history.filter((h) => h.passed).map((h) => h.exerciseId));
  const failed = history.find((h) => !h.passed && !passed.has(h.exerciseId));
  if (failed) {
    tasks.push({
      id: `exercise:${failed.exerciseId}`,
      kind: 'exercise',
      courseId: failed.courseId,
      lessonId: failed.lessonId,
      exerciseId: failed.exerciseId,
      lessonTitle: failed.lessonTitle,
      score: failed.score,
    });
  }
  if (tasks.length < 2 && nextLessons[1]) tasks.push(lessonTask(nextLessons[1]));
  return tasks.slice(0, MAX_TASKS);
}

export function reconcile(saved: SavedPlan | null, fresh: TodayTask[], day: string): SavedPlan {
  return saved?.day === day ? saved : { day, tasks: fresh, done: [] };
}

export function isDone(plan: SavedPlan, task: TodayTask, dueCount: number): boolean {
  return plan.done.includes(task.id) || (task.kind === 'review' && dueCount === 0);
}

export function markDone(plan: SavedPlan, taskId: string): SavedPlan {
  return plan.done.includes(taskId) ? plan : { ...plan, done: [...plan.done, taskId] };
}

export function parsePlan(raw: string | null): SavedPlan | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as Partial<SavedPlan> | null;
    if (typeof p?.day !== 'string' || !Array.isArray(p.tasks) || !Array.isArray(p.done)) return null;
    return p as SavedPlan;
  } catch {
    return null;
  }
}

export { TODAY_KEY };
