import { describe, expect, it, vi } from 'vitest';
import { UploadCancelledError, putWithProgress, type TransferRequest } from './upload-transfer';

class FakeRequest implements TransferRequest {
  status = 0;
  upload: TransferRequest['upload'] = { onprogress: null };
  onload: TransferRequest['onload'] = null;
  onerror: TransferRequest['onerror'] = null;
  onabort: TransferRequest['onabort'] = null;
  headers: Record<string, string> = {};
  opened: [string, string] | null = null;
  body: unknown = null;
  abort = vi.fn(() => this.onabort?.());
  open(method: string, url: string) {
    this.opened = [method, url];
  }
  setRequestHeader(name: string, value: string) {
    this.headers[name] = value;
  }
  send(body: Blob) {
    this.body = body;
  }
}

const file = new Blob(['abc']);
const start = (signal = new AbortController().signal, onProgress = vi.fn()) => {
  const request = new FakeRequest();
  const done = putWithProgress(
    { url: 'https://s3/put', file, contentType: 'application/pdf', signal, onProgress },
    () => request,
  );
  return { request, done, onProgress };
};

describe('putWithProgress', () => {
  it('PUT đúng URL, Content-Type đã ký và nội dung tệp', () => {
    const { request } = start();
    expect(request.opened).toEqual(['PUT', 'https://s3/put']);
    expect(request.headers['Content-Type']).toBe('application/pdf');
    expect(request.body).toBe(file);
  });

  it('báo phần trăm theo byte đã gửi', () => {
    const { request, onProgress } = start();
    request.upload.onprogress?.({ lengthComputable: true, loaded: 1, total: 4 });
    expect(onProgress).toHaveBeenLastCalledWith(25);
  });

  it('bỏ qua sự kiện không biết tổng dung lượng', () => {
    const { request, onProgress } = start();
    request.upload.onprogress?.({ lengthComputable: false, loaded: 1, total: 0 });
    expect(onProgress).not.toHaveBeenCalled();
  });

  it('thành công khi storage trả 2xx', async () => {
    const { request, done } = start();
    request.status = 200;
    request.onload?.();
    await expect(done).resolves.toBeUndefined();
  });

  it('báo lỗi kèm status khi storage từ chối', async () => {
    const { request, done } = start();
    request.status = 403;
    request.onload?.();
    await expect(done).rejects.toThrow('403');
  });

  it('báo lỗi khi mất mạng', async () => {
    const { request, done } = start();
    request.onerror?.();
    await expect(done).rejects.toThrow(/mạng/);
  });

  it('hủy giữa chừng thì dừng request và ném UploadCancelledError', async () => {
    const controller = new AbortController();
    const { request, done } = start(controller.signal);
    controller.abort();
    await expect(done).rejects.toBeInstanceOf(UploadCancelledError);
    expect(request.abort).toHaveBeenCalled();
  });

  it('đã hủy từ trước thì không gửi gì', async () => {
    const controller = new AbortController();
    controller.abort();
    const { request, done } = start(controller.signal);
    await expect(done).rejects.toBeInstanceOf(UploadCancelledError);
    expect(request.body).toBeNull();
  });
});
