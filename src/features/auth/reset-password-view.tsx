'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { resetPasswordSchema } from '@learn/api-contracts';
import {
  Button,
  ButtonLink,
  Field,
  Icon,
  InlineError,
  PasswordInput,
  Skeleton,
} from '@/components/ui';
import { apiFetch, errorText } from '@/lib/api-client';
import { AuthHeading } from './auth-heading';

/**
 * Đặt mật khẩu mới — FR-AUTH-07 bước 2.
 *
 * Token nằm ở fragment `#token=…` (máy chủ không bao giờ thấy trong log). Đọc xong thì xoá khỏi
 * thanh địa chỉ để token không nằm lại trong lịch sử trình duyệt hay bị chụp màn hình.
 */
export function ResetPasswordView() {
  // `undefined` = chưa đọc URL (lần render đầu), `null` = URL không có token.
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldError, setFieldError] = useState<{ password?: string; confirm?: string }>({});
  const [error, setError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  // Mở thư trên điện thoại: cho phép tiếp tục trong app mobile (scheme `learn://`, bản APK/cài đặt).
  const [onPhone, setOnPhone] = useState(false);

  useEffect(() => {
    const match = /(?:^|&)token=([^&]+)/.exec(window.location.hash.slice(1));
    setToken(match?.[1] ? decodeURIComponent(match[1]) : null);
    if (match) window.history.replaceState(null, '', window.location.pathname);
    setOnPhone(/Android|iPhone|iPad/i.test(navigator.userAgent));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const errors: { password?: string; confirm?: string } = {};
    if (password.length < 8) errors.password = 'Mật khẩu cần ít nhất 8 ký tự.';
    else if (password.length > 72) errors.password = 'Mật khẩu tối đa 72 ký tự.';
    if (!errors.password && confirm !== password) errors.confirm = 'Hai mật khẩu chưa khớp.';
    setFieldError(errors);
    if (errors.password || errors.confirm) {
      document.getElementById(errors.password ? 'password' : 'confirm')?.focus();
      return;
    }
    const parsed = resetPasswordSchema.safeParse({ token, newPassword: password });
    if (!parsed.success) {
      setToken(null);
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch('/api/v1/auth/reset-password', { method: 'POST', body: parsed.data });
      setDone(true);
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  if (token === undefined) {
    return (
      <div aria-busy="true">
        <span className="sr-only">Đang mở trang đặt lại mật khẩu</span>
        <Skeleton className="mb-3 h-9 w-3/4" />
        <Skeleton className="mb-8 h-4 w-full" />
        <Skeleton className="h-40 w-full rounded-card" />
      </div>
    );
  }

  if (done) {
    return (
      <div>
        <Icon name="check" size={32} className="mb-5 text-fg" />
        <AuthHeading
          title="Đã đặt mật khẩu mới"
          description="Mọi phiên đăng nhập cũ đã được đăng xuất để bảo vệ tài khoản. Đăng nhập lại bằng mật khẩu mới."
        />
        <ButtonLink href="/login" size="lg">
          Đăng nhập
          <Icon name="arrow-right" size={16} />
        </ButtonLink>
      </div>
    );
  }

  if (token === null) {
    return (
      <div>
        <Icon name="alert" size={32} className="mb-5 text-fg" />
        <AuthHeading
          title="Đường dẫn không đầy đủ"
          description="Đường dẫn đặt lại mật khẩu bị thiếu mã. Hãy mở đúng đường dẫn trong thư, hoặc xin một thư mới."
        />
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-accent underline underline-offset-2 hover:no-underline focus-ring"
        >
          Xin đường dẫn mới
        </Link>
      </div>
    );
  }

  return (
    <>
      <AuthHeading
        title="Đặt mật khẩu mới"
        description="Chọn mật khẩu từ 8 ký tự. Sau khi đổi, mọi thiết bị đang đăng nhập sẽ bị đăng xuất."
      />
      {onPhone && (
        <p className="mb-5 text-sm text-fg-subtle">
          Đã cài ứng dụng LEARN?{' '}
          <a
            href={`learn://reset-password?token=${encodeURIComponent(token)}`}
            className="rounded-md font-semibold text-accent underline underline-offset-2 hover:no-underline focus-ring"
          >
            Mở trong ứng dụng
          </a>
        </p>
      )}
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <Field label="Mật khẩu mới" htmlFor="password" error={fieldError.password}>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            required
            invalid={Boolean(fieldError.password)}
            aria-describedby={fieldError.password ? 'password-error' : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Field label="Nhập lại mật khẩu mới" htmlFor="confirm" error={fieldError.confirm}>
          <PasswordInput
            id="confirm"
            autoComplete="new-password"
            required
            invalid={Boolean(fieldError.confirm)}
            aria-describedby={fieldError.confirm ? 'confirm-error' : undefined}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Field>

        {Boolean(error) && (
          <InlineError>
            {errorText(error, 'Không đặt lại được mật khẩu, vui lòng thử lại.')}{' '}
            <Link href="/forgot-password" className="font-semibold underline underline-offset-2">
              Xin đường dẫn mới
            </Link>
          </InlineError>
        )}

        <Button type="submit" fullWidth size="lg" loading={submitting}>
          {submitting ? 'Đang lưu…' : 'Đặt mật khẩu mới'}
        </Button>
      </form>
    </>
  );
}
