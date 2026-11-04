const ACTIVE_STATUSES = new Set(['QUEUED', 'RUNNING']);

export const isActiveJobStatus = (status: string | undefined): boolean =>
  ACTIVE_STATUSES.has(status ?? '');

/** Job sinh bài còn chạy của khóa học, để theo dõi tiếp sau F5 hoặc khi quay lại trang. */
export function findActiveGenerateJob<T extends { type: string; status: string }>(
  jobs: readonly T[],
): T | null {
  return jobs.find((j) => j.type === 'GENERATE_LESSONS' && isActiveJobStatus(j.status)) ?? null;
}
