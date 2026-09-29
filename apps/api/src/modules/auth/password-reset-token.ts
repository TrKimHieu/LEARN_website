import { createHash, randomBytes } from 'crypto';

/**
 * Token đặt lại mật khẩu — FR-AUTH-07. Hàm thuần, test được không cần DB.
 *
 * Cùng mô hình với refresh token (NFR-SEC-03): 256-bit ngẫu nhiên, DB chỉ giữ SHA-256. Lộ bảng
 * `PasswordResetToken` không cho ai đặt lại được mật khẩu của người khác.
 */
export function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function createResetToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashResetToken(token) };
}

export function isResetTokenUsable(
  record: { usedAt: Date | null; expiresAt: Date } | null,
  now: Date = new Date(),
): boolean {
  return record !== null && record.usedAt === null && record.expiresAt.getTime() > now.getTime();
}

/**
 * Đường dẫn trong thư. Token đặt ở **fragment** (`#token=`) chứ không ở query: fragment không
 * bao giờ được trình duyệt gửi lên máy chủ, nên không lọt vào access log của web server, proxy
 * hay header `Referer` khi trang đặt lại mật khẩu tải tài nguyên bên ngoài.
 */
export function resetLink(appUrl: string, token: string): string {
  return `${appUrl.replace(/\/+$/, '')}/reset-password#token=${token}`;
}
