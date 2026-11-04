import { describe, expect, it } from 'vitest';
import { failureReasonText, isOnlyDuplicateFailure, latestPartialJob } from './ai-job-outcome';

describe('failureReasonText', () => {
  it.each([
    [['Hết thời gian job (timeout).'], 'Hết thời gian xử lý.'],
    [['Vượt trần chi phí job (AI_JOB_MAX_COST_USD).'], 'Vượt giới hạn chi phí của lượt sinh.'],
    [['Tiêu đề lesson trùng bài đã có: "A"'], 'Trùng với bài đã có.'],
    [
      ['contentMd: Too small: expected string to have >=200 characters'],
      'AI chưa viết đạt yêu cầu.',
    ],
    [[], 'AI chưa viết đạt yêu cầu.'],
  ])('không lộ lỗi kỹ thuật: %j', (errors, expected) => {
    expect(failureReasonText(errors)).toBe(expected);
  });
});

describe('isOnlyDuplicateFailure', () => {
  const failed = (errors: string[][]) => ({
    code: 'ALL_LESSONS_FAILED',
    detail: {
      failures: errors.map((e, i) => ({ node: `Bài ${i}`, errors: e })),
    },
  });

  it('mọi bài đều trùng', () => {
    expect(isOnlyDuplicateFailure(failed([['Tiêu đề lesson trùng bài đã có: "A"']]))).toBe(true);
  });

  it('có bài lỗi vì lý do khác', () => {
    expect(
      isOnlyDuplicateFailure(failed([['Tiêu đề lesson trùng bài đã có: "A"'], ['Hết thời gian']])),
    ).toBe(false);
  });

  it.each([null, { code: 'X', detail: null }, { code: 'ALL_LESSONS_FAILED', detail: {} }])(
    'dữ liệu khác hình dạng: %j',
    (error) => {
      expect(isOnlyDuplicateFailure(error)).toBe(false);
    },
  );
});

describe('latestPartialJob', () => {
  const job = (id: string, status: string, error: unknown = null, type = 'GENERATE_LESSONS') => ({
    id,
    type,
    status,
    error: error as { code: string; detail: unknown } | null,
  });
  const partial = {
    code: 'PARTIAL_FAILURES',
    detail: { partialFailures: [{ node: 'A', errors: [] }] },
  };

  it('lấy lần sinh mới nhất khi nó thiếu bài', () => {
    expect(latestPartialJob([job('new', 'SUCCEEDED', partial)])?.id).toBe('new');
  });

  it('lần sinh mới nhất đã đủ bài thì không còn cảnh báo cũ', () => {
    expect(
      latestPartialJob([job('new', 'SUCCEEDED'), job('old', 'SUCCEEDED', partial)]),
    ).toBeNull();
  });

  it('bỏ qua job khác loại và job đang chạy', () => {
    const jobs = [
      job('x', 'RUNNING'),
      job('y', 'SUCCEEDED', null, 'EXTRACT_DOCUMENT'),
      job('z', 'SUCCEEDED', partial),
    ];
    expect(latestPartialJob(jobs)?.id).toBe('z');
  });
});
