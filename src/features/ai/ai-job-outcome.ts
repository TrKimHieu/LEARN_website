import { partialFailuresOf } from './ai-job-partial';

const DUPLICATE_MARK = 'trùng bài đã có';

/** Lý do lỗi do worker ghi là tiếng kỹ thuật (tên trường, luật Zod), không đưa thẳng cho người học. */
export function failureReasonText(errors: readonly string[]): string {
  const text = errors.join(' ');
  if (text.includes('timeout') || text.includes('Hết thời gian')) return 'Hết thời gian xử lý.';
  if (text.includes('chi phí')) return 'Vượt giới hạn chi phí của lượt sinh.';
  if (text.includes(DUPLICATE_MARK)) return 'Trùng với bài đã có.';
  return 'AI chưa viết đạt yêu cầu.';
}

/** Sinh lại trên cùng tài liệu: mọi bài trùng tiêu đề thì thử lại cũng vô ích. */
export function isOnlyDuplicateFailure(
  error: { code: string; detail: unknown } | null | undefined,
): boolean {
  if (error?.code !== 'ALL_LESSONS_FAILED') return false;
  const failures = (error.detail as { failures?: unknown } | null)?.failures;
  if (!Array.isArray(failures) || failures.length === 0) return false;
  return failures.every(
    (f: { errors?: unknown }) =>
      Array.isArray(f.errors) &&
      f.errors.some((e) => typeof e === 'string' && e.includes(DUPLICATE_MARK)),
  );
}

/** Danh sách job xếp mới nhất trước: chỉ lần sinh đã kết thúc gần nhất mới còn ý nghĩa. */
export function latestPartialJob<
  T extends {
    type: string;
    status: string;
    error: { code: string; detail: unknown } | null;
  },
>(jobs: readonly T[]): T | null {
  const latest = jobs.find(
    (j) => j.type === 'GENERATE_LESSONS' && j.status !== 'QUEUED' && j.status !== 'RUNNING',
  );
  return latest && partialFailuresOf(latest.error).length > 0 ? latest : null;
}
