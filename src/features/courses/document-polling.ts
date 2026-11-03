import type { DocumentStatus } from '@learn/api-contracts';

export const DOCUMENTS_POLL_MS = 2000;

/** Trạng thái mà worker còn đang xử lý — kết quả sẽ đổi mà không cần người dùng làm gì. */
const IN_PROGRESS: ReadonlySet<DocumentStatus> = new Set(['UPLOADED', 'EXTRACTING']);

/**
 * `refetchInterval` cho danh sách tài liệu: hỏi lại khi còn tài liệu worker đang trích xuất, dừng
 * khi tất cả đã EXTRACTED/FAILED. Không tính PENDING — đó là tải dở chưa confirm, không ai xử lý.
 */
export function documentsRefetchInterval(
  data: { documents: ReadonlyArray<{ status: DocumentStatus }> } | undefined,
): number | false {
  return data?.documents.some((d) => IN_PROGRESS.has(d.status)) ? DOCUMENTS_POLL_MS : false;
}
