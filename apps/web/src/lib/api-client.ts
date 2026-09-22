import { env } from './env';

/** Token truy cập chỉ sống trong memory — không lưu localStorage `[SPEC]` HANDBOOK §10.3 */
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export class ApiClientError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly requestId?: string;
  readonly meta?: Record<string, unknown>;

  constructor(
    status: number,
    code: string | undefined,
    message: string,
    requestId?: string,
    meta?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.meta = meta;
  }
}

/** True nếu lỗi là 402 QUOTA_EXCEEDED, kèm type-narrow `meta` sang {metric, limit, used}. */
export function isQuotaExceededError(
  err: unknown,
): err is ApiClientError & { meta: { metric: string; limit: number; used: number } } {
  return err instanceof ApiClientError && err.code === 'QUOTA_EXCEEDED';
}

/**
 * Câu chữ hiển thị cho một lỗi bất kỳ.
 *
 * Trước đây hàm này được định nghĩa lại **y hệt nhau ở 4 file màn hình**, còn 7 file khác
 * tự viết tay đúng cái ternary đó tại chỗ. Đặt ở đây vì `api-client` vốn đã sở hữu phân
 * loại lỗi (`ApiClientError`, `isQuotaExceededError`) và mọi call site đều đã import từ
 * file này, nên gom về không tốn thêm dòng import nào.
 */
export function errorText(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

/**
 * `requestId` để người dùng copy khi báo lỗi — hợp với prop `detail` của `<ErrorState>`.
 *
 * Prop đó được dựng riêng cho việc này nhưng chưa màn nào dùng; `courses/page.tsx` thay
 * vào đó nhét mã vào giữa câu mô tả (" (mã yêu cầu: …)"). Tách ra để mọi màn nói cùng
 * một kiểu: `description={errorText(...)} detail={errorDetail(...)}`.
 */
export function errorDetail(err: unknown): string | undefined {
  return err instanceof ApiClientError ? err.requestId : undefined;
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  retried?: boolean;
}

let refreshing: Promise<boolean> | null = null;

/** Envelope lỗi chuẩn HANDBOOK §7.3: {type, title, status, code, detail, requestId, meta}. */
interface ErrorEnvelope {
  detail?: string;
  code?: string;
  requestId?: string;
  meta?: Record<string, unknown>;
}

async function readError(res: Response): Promise<ErrorEnvelope> {
  try {
    return (await res.json()) as ErrorEnvelope;
  } catch {
    return {};
  }
}

/** Gọi API có kèm Bearer token + tự động refresh một lần khi nhận 401. */
export async function apiFetch<T = unknown>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, retried = false } = options;
  const headers: Record<string, string> = {};

  const token = getAccessToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${env.apiUrl}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && !retried) {
    const ok = await refreshAccessToken();
    if (ok) {
      return apiFetch<T>(path, { ...options, retried: true });
    }
  }

  if (!res.ok) {
    const envelope = await readError(res);
    throw new ApiClientError(
      res.status,
      envelope.code,
      envelope.detail ?? `Yêu cầu thất bại (${res.status}).`,
      envelope.requestId,
      envelope.meta,
    );
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** `/auth/refresh` đọc cookie httpOnly, xoay refresh token và trả access token mới. */
export async function refreshAccessToken(): Promise<boolean> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const data = await apiFetch<{ accessToken: string }>('/api/v1/auth/refresh', {
        method: 'POST',
        retried: true,
      });
      setAccessToken(data.accessToken);
      return true;
    } catch {
      setAccessToken(null);
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}
