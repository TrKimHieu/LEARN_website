import type { SavedPlan, TodayTask } from './today-plan';

/** Lần cuối popup nhắc học hiện ra (ISO). */
export const NUDGE_KEY = 'learn.nudge';
/** Quay lại sau ngần này thì nhắc lại trong cùng ngày. */
export const NUDGE_GAP_MS = 4 * 60 * 60 * 1000;

/** Trang đang học: popup không chặn ở đây và cũng không tính là đã thấy. */
const LEARNING = [
  /^\/courses\/[^/]+\/lessons\/[^/]+(\/.*)?$/,
  /^\/review\/?$/,
  /^\/decks\/[^/]+\/review\/?$/,
  /^\/focus\/?$/,
];

export function isLearningPath(pathname: string): boolean {
  return LEARNING.some((re) => re.test(pathname));
}

export function parseLastShown(raw: string | null): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

const dayOf = (d: Date) => d.toLocaleDateString('en-CA');

export function shouldNudge(i: {
  now: Date;
  lastShown: Date | null;
  pathname: string;
  ready: boolean;
  pendingCount: number;
}): boolean {
  if (!i.ready || i.pendingCount === 0 || isLearningPath(i.pathname)) return false;
  if (!i.lastShown) return true;
  return (
    dayOf(i.lastShown) !== dayOf(i.now) ||
    i.now.getTime() - i.lastShown.getTime() >= NUDGE_GAP_MS
  );
}

/** "12 thẻ đến hạn · 1 bài học · 1 bài cần luyện lại", theo thứ tự việc trong danh sách. */
export function nudgeSummary(pending: TodayTask[]): string {
  const parts = new Map<TodayTask['kind'], number>();
  for (const t of pending) {
    parts.set(t.kind, (parts.get(t.kind) ?? 0) + (t.kind === 'review' ? t.dueCount : 1));
  }
  const label = { review: 'thẻ đến hạn', lesson: 'bài học', exercise: 'bài cần luyện lại' };
  return [...parts].map(([kind, n]) => `${n} ${label[kind]}`).join(' · ');
}

/**
 * Bản lưu của hôm nay mang dấu xong mới nhất (màn bài học, luyện tập, ôn thẻ ghi thẳng vào đó), nên
 * ưu tiên nó hơn bản hook đọc lúc đầu phiên; nhờ vậy popup nói giống màn Học.
 */
export function freshestPlan<T extends SavedPlan | null>(saved: SavedPlan | null, plan: T, day: string) {
  return saved && saved.day === day ? saved : plan;
}
