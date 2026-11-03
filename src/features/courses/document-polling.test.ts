import { describe, it, expect } from 'vitest';
import { DOCUMENTS_POLL_MS, documentsRefetchInterval } from './document-polling';

/**
 * `confirm` chỉ đưa tài liệu sang UPLOADED rồi giao việc trích xuất cho worker. Danh sách phải
 * tự tải lại tới khi worker xong — nếu không, nút "Sinh bài học" (chỉ mở khi có EXTRACTED) xám
 * mãi cho tới khi người dùng bấm F5.
 */
describe('documentsRefetchInterval', () => {
  it.each(['UPLOADED', 'EXTRACTING'] as const)('hỏi lại khi còn tài liệu %s', (status) => {
    expect(documentsRefetchInterval({ documents: [{ status: 'EXTRACTED' }, { status }] })).toBe(
      DOCUMENTS_POLL_MS,
    );
  });

  it('dừng khi mọi tài liệu đã xong (EXTRACTED/FAILED)', () => {
    expect(
      documentsRefetchInterval({ documents: [{ status: 'EXTRACTED' }, { status: 'FAILED' }] }),
    ).toBe(false);
  });

  // PENDING = đã xin URL nhưng chưa confirm (tải dở, đóng tab). Không có gì đang chạy để chờ;
  // hỏi lại theo nó thì một lần tải dở làm trang hỏi API mãi mãi.
  it('không hỏi lại vì tài liệu PENDING', () => {
    expect(documentsRefetchInterval({ documents: [{ status: 'PENDING' }] })).toBe(false);
  });

  it('không hỏi lại khi chưa có dữ liệu', () => {
    expect(documentsRefetchInterval(undefined)).toBe(false);
  });
});
