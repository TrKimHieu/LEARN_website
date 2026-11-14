/** Tất cả thẻ nháp được chọn sẵn: chấp nhận hết chỉ cần một lần bấm, bỏ chọn những thẻ không muốn. */
export function selectAll(ids: readonly string[]): Set<string> {
  return new Set(ids);
}

export function toggle(selected: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(selected);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

/** Bỏ khỏi vùng chọn những id không còn (đã xóa hoặc đã chấp nhận). */
export function withoutIds(selected: ReadonlySet<string>, gone: readonly string[]): Set<string> {
  const drop = new Set(gone);
  return new Set([...selected].filter((id) => !drop.has(id)));
}

export function acceptLabel(count: number): string {
  return count > 0 ? `Thêm ${count} thẻ` : 'Thêm thẻ';
}

export type GenerationState = 'idle' | 'running' | 'done' | 'failed' | 'cancelled';

/** Trạng thái job sinh thẻ thành thứ màn hình cần hiện. */
export function generationState(job: { status: string } | undefined | null): GenerationState {
  switch (job?.status) {
    case 'QUEUED':
    case 'RUNNING':
      return 'running';
    case 'SUCCEEDED':
      return 'done';
    case 'FAILED':
      return 'failed';
    case 'CANCELLED':
      return 'cancelled';
    default:
      return 'idle';
  }
}

const GENERIC_ERROR = 'Không sinh được thẻ, vui lòng thử lại.';

const ERROR_TEXT: Record<string, string> = {
  NO_SOURCE_CONTENT: 'Nguồn đã chọn chưa có nội dung để sinh thẻ.',
  FLASHCARD_OUTPUT_INVALID: 'AI chưa sinh được thẻ hợp lệ từ nguồn này. Hãy thử lại hoặc chọn nguồn khác.',
  JOB_TIMEOUT: 'Sinh thẻ mất quá lâu, vui lòng thử lại.',
};

/** Thông báo cho người học từ lỗi của job; mã máy không bao giờ lộ ra màn hình. */
export function generationErrorText(error: { code?: string } | null | undefined): string {
  return (error?.code && ERROR_TEXT[error.code]) || GENERIC_ERROR;
}
