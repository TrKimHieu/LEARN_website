import type { HistoryItem, LessonSummary, ProgressCourse } from '@learn/api-contracts';
import { todayKey } from '../../lib/today-store';

export type TodayTask =
  | { id: 'review'; kind: 'review'; dueCount: number }
  | {
      id: `lesson:${string}`;
      kind: 'lesson';
      courseId: string;
      lessonId: string;
      title: string;
      courseTitle: string;
      index: number;
      total: number;
    }
  | {
      id: `exercise:${string}`;
      kind: 'exercise';
      courseId: string;
      lessonId: string;
      exerciseId: string;
      lessonTitle: string;
      score: number;
    };

export interface TodayInputs {
  dueCount: number;
  // in course priority order; index is 1-based
  nextLessons: Array<Omit<Extract<TodayTask, { kind: 'lesson' }>, 'id' | 'kind'>>;
  history: HistoryItem[]; // newest first
}
export interface SavedPlan { day: string; tasks: TodayTask[]; done: string[] }

const MAX_TASKS = 4;
const KINDS: unknown[] = ['review', 'lesson', 'exercise'];

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

/** `doneToday`: việc đã xong hôm nay trước khi danh sách được chốt (xem `retriedToday`). */
export function reconcile(
  saved: SavedPlan | null,
  fresh: TodayTask[],
  day: string,
  doneToday: string[] = [],
): SavedPlan {
  return saved?.day === day ? saved : { day, tasks: fresh, done: doneToday };
}

/**
 * Bài tập chưa đạt đã được làm lại hôm nay (theo ngày trình duyệt). Làm lại trước lần đầu mở màn
 * Học thì chưa có danh sách để đánh dấu, nên danh sách mới tính các việc này là đã xong.
 */
export function retriedToday(history: HistoryItem[], day: string): string[] {
  const ids = history
    .filter((h) => !h.passed && todayKey(new Date(h.createdAt)) === day)
    .map((h) => `exercise:${h.exerciseId}`);
  return [...new Set(ids)];
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
    const p = JSON.parse(raw) as { day?: unknown; tasks?: unknown; done?: unknown } | null;
    if (typeof p?.day !== 'string' || !Array.isArray(p.tasks) || !Array.isArray(p.done)) {
      return null;
    }
    const renderable = (t: { id?: unknown; kind?: unknown } | null) =>
      typeof t?.id === 'string' && KINDS.includes(t.kind);
    if (!p.tasks.every(renderable)) return null;
    const done = p.done.filter((d): d is string => typeof d === 'string');
    return { day: p.day, tasks: p.tasks as TodayTask[], done };
  } catch {
    return null;
  }
}

/** Khóa đang dở trước, rồi khóa chưa bắt đầu, khóa xong cuối cùng. */
export function rankCourse(c: ProgressCourse): number {
  if (c.percent > 0 && c.percent < 100) return 0;
  if (c.percent === 0) return 1;
  return 2;
}

/** Bài kế tiếp: bài đang dở, nếu không có thì bài chưa bắt đầu đầu tiên. `index` tính từ 0. */
export function pickNextLesson(
  lessons: LessonSummary[],
): { lesson: LessonSummary; index: number } | null {
  let index = lessons.findIndex((l) => l.progressStatus === 'IN_PROGRESS');
  if (index < 0) index = lessons.findIndex((l) => l.progressStatus === 'NOT_STARTED');
  return index < 0 ? null : { lesson: lessons[index]!, index };
}

/**
 * Khi nào được chốt danh sách hôm nay. Một nguồn lỗi lần đầu thì không chốt: danh sách thiếu việc
 * sẽ bị lưu tới hết ngày. Lỗi khi làm tươi (còn dữ liệu cũ) không tính, vì dữ liệu cũ vẫn dùng được.
 */
export function planGate(
  queries: Array<{ isLoading: boolean; isLoadingError: boolean; isFetching: boolean }>,
): 'wait' | 'error' | 'ready' {
  if (queries.some((q) => q.isLoadingError)) return 'error';
  // Chờ cả lần làm tươi: qua ngày thì danh sách mới không được dựng từ số liệu hôm qua.
  return queries.some((q) => q.isLoading || q.isFetching) ? 'wait' : 'ready';
}
