import { describe, expect, it } from 'vitest';
import { findActiveGenerateJob } from './ai-job-active';

const job = (id: string, type: string, status: string) => ({ id, type, status });

describe('findActiveGenerateJob', () => {
  it.each(['QUEUED', 'RUNNING'])('nhận job sinh bài đang %s', (status) => {
    expect(findActiveGenerateJob([job('j1', 'GENERATE_LESSONS', status)])?.id).toBe('j1');
  });

  it.each(['SUCCEEDED', 'FAILED', 'CANCELLED'])('bỏ qua job đã %s', (status) => {
    expect(findActiveGenerateJob([job('j1', 'GENERATE_LESSONS', status)])).toBeNull();
  });

  it('bỏ qua job trích xuất tài liệu đang chạy', () => {
    expect(findActiveGenerateJob([job('j1', 'EXTRACT_DOCUMENT', 'RUNNING')])).toBeNull();
  });

  it('chọn job đang chạy dù có job cũ đứng trước', () => {
    const jobs = [job('old', 'GENERATE_LESSONS', 'FAILED'), job('j2', 'GENERATE_LESSONS', 'RUNNING')];
    expect(findActiveGenerateJob(jobs)?.id).toBe('j2');
  });
});
