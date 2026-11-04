/** Người dùng bấm hủy, không phải lỗi: giao diện không hiện thông báo lỗi. */
export class UploadCancelledError extends Error {
  constructor() {
    super('Đã hủy tải lên.');
    this.name = 'UploadCancelledError';
  }
}

/** Phần XMLHttpRequest cần dùng, tách ra để test không cần trình duyệt. */
export interface TransferRequest {
  status: number;
  upload: {
    onprogress:
      | ((event: { lengthComputable: boolean; loaded: number; total: number }) => void)
      | null;
  };
  onload: (() => void) | null;
  onerror: (() => void) | null;
  onabort: (() => void) | null;
  open(method: string, url: string): void;
  setRequestHeader(name: string, value: string): void;
  send(body: Blob): void;
  abort(): void;
}

/** Dùng XMLHttpRequest vì `fetch` chưa báo được tiến độ gửi lên trên mọi trình duyệt. */
export function putWithProgress(
  options: {
    url: string;
    file: Blob;
    contentType: string;
    signal: AbortSignal;
    onProgress: (percent: number) => void;
  },
  createRequest: () => TransferRequest = () => new XMLHttpRequest() as unknown as TransferRequest,
): Promise<void> {
  const { url, file, contentType, signal, onProgress } = options;
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new UploadCancelledError());
      return;
    }

    const request = createRequest();
    const abort = () => request.abort();
    signal.addEventListener('abort', abort, { once: true });
    const settle = (finish: () => void) => {
      signal.removeEventListener('abort', abort);
      finish();
    };

    request.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    request.onload = () =>
      settle(() => {
        if (request.status >= 200 && request.status < 300) resolve();
        else reject(new Error(`Tải file lên storage thất bại (${request.status}).`));
      });
    request.onerror = () =>
      settle(() => reject(new Error('Mất kết nối mạng khi tải file lên storage.')));
    request.onabort = () => settle(() => reject(new UploadCancelledError()));

    request.open('PUT', url);
    // Presigned URL được ký kèm Content-Type; gửi đúng giá trị đó, không để trình duyệt tự đặt.
    request.setRequestHeader('Content-Type', contentType);
    request.send(file);
  });
}
