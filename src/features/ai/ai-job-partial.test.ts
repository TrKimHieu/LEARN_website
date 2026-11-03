import { describe, it, expect } from 'vitest';
import { partialFailuresOf } from './ai-job-partial';

/**
 * `error.detail` có kiểu `unknown` trong contract và do worker ghi, nên hàm này phải chịu được
 * mọi hình dạng — kể cả job cũ ghi theo định dạng khác. Hỏng hình dạng thì màn hình coi như
 * không có phần nào thất bại, chứ không được ném lỗi và làm trắng cả trang tiến độ.
 */
describe('partialFailuresOf', () => {
  it('đọc được danh sách phần thất bại worker ghi ra', () => {
    const out = partialFailuresOf({
      code: 'PARTIAL_FAILURES',
      detail: {
        partialFailures: [
          { node: 'Chương 3: Hồi quy', errors: ['Vượt trần chi phí job (AI_JOB_MAX_COST_USD).'] },
          { node: 'Chương 5: Đánh giá', errors: ['Hết thời gian job (timeout).'] },
        ],
      },
    });
    expect(out).toHaveLength(2);
    expect(out[0]?.node).toBe('Chương 3: Hồi quy');
    expect(out[1]?.errors).toEqual(['Hết thời gian job (timeout).']);
  });

  it.each([
    ['không có lỗi', null],
    ['undefined', undefined],
    ['mã lỗi khác', { code: 'ALL_LESSONS_FAILED', detail: { partialFailures: [{ node: 'x' }] } }],
    ['detail là null', { code: 'PARTIAL_FAILURES', detail: null }],
    ['detail là chuỗi', { code: 'PARTIAL_FAILURES', detail: 'hỏng' }],
    ['thiếu partialFailures', { code: 'PARTIAL_FAILURES', detail: {} }],
    [
      'partialFailures không phải mảng',
      { code: 'PARTIAL_FAILURES', detail: { partialFailures: 3 } },
    ],
  ])('trả mảng rỗng khi %s', (_label, error) => {
    expect(partialFailuresOf(error as never)).toEqual([]);
  });

  it('bỏ qua phần tử hỏng nhưng giữ phần tử hợp lệ', () => {
    const out = partialFailuresOf({
      code: 'PARTIAL_FAILURES',
      detail: {
        partialFailures: [
          null,
          'chuỗi lạc',
          { errors: ['thiếu node'] },
          { node: 'Chương hợp lệ', errors: ['lý do'] },
        ],
      },
    });
    expect(out).toEqual([{ node: 'Chương hợp lệ', errors: ['lý do'] }]);
  });

  it('node hợp lệ nhưng errors hỏng thì vẫn hiện, chỉ là không có lý do', () => {
    const out = partialFailuresOf({
      code: 'PARTIAL_FAILURES',
      detail: { partialFailures: [{ node: 'Chương 1', errors: 'không phải mảng' }] },
    });
    expect(out).toEqual([{ node: 'Chương 1', errors: [] }]);
  });

  it('lọc bỏ phần tử không phải chuỗi trong errors', () => {
    const out = partialFailuresOf({
      code: 'PARTIAL_FAILURES',
      detail: { partialFailures: [{ node: 'Chương 1', errors: ['ok', 42, null, 'ok2'] }] },
    });
    expect(out[0]?.errors).toEqual(['ok', 'ok2']);
  });
});
