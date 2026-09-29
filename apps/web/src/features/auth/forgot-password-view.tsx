'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { forgotPasswordSchema } from '@learn/contracts';
import { Button, Field, Icon, InlineError, Input } from '@/components/ui';
import { apiFetch, errorText } from '@/lib/api-client';
import { AuthHeading } from './auth-heading';

/**
 * Quên mật khẩu — FR-AUTH-07 bước 1. Máy chủ trả cùng một câu cho mọi email (không lộ email nào
 * đã đăng ký), nên màn xác nhận cũng nói "nếu email có trong hệ thống".
 */
export function ForgotPasswordView() {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFieldError(null);
    setError(null);
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setFieldError('Email không hợp lệ.');
      document.getElementById('email')?.focus();
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch('/api/v1/auth/forgot-password', { method: 'POST', body: parsed.data });
      setSubmitted(true);
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div>
        <Icon name="check" size={32} className="mb-5 text-fg" />
        <AuthHeading
          title="Kiểm tra hộp thư"
          description={`Nếu ${email} có tài khoản LEARN, một thư chứa đường dẫn đặt lại mật khẩu vừa được gửi tới đó. Đường dẫn dùng được một lần và hết hạn sau 30 phút.`}
        />
        <p className="text-sm leading-relaxed text-fg-subtle">
          Không thấy thư? Xem thư mục Spam, hoặc{' '}
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="cursor-pointer rounded-md font-semibold text-fg underline underline-offset-2 hover:no-underline focus-ring"
          >
            gửi lại
          </button>
          .
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-accent underline underline-offset-2 hover:no-underline focus-ring"
        >
          <Icon name="arrow-left" size={16} />
          Quay lại đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <>
      <AuthHeading
        title="Quên mật khẩu"
        description="Nhập email bạn đã dùng để đăng ký, chúng tôi sẽ gửi đường dẫn đặt lại mật khẩu."
      />
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <Field label="Email" htmlFor="email" error={fieldError ?? undefined}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="ban@vidu.com"
            required
            invalid={Boolean(fieldError)}
            aria-describedby={fieldError ? 'email-error' : undefined}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        {Boolean(error) && (
          <InlineError>{errorText(error, 'Không gửi được yêu cầu, vui lòng thử lại.')}</InlineError>
        )}

        <Button type="submit" fullWidth size="lg" loading={submitting}>
          {submitting ? 'Đang gửi…' : 'Gửi đường dẫn đặt lại'}
        </Button>

        <p className="pt-2 text-center text-sm text-fg-subtle">
          Nhớ ra mật khẩu rồi?{' '}
          <Link
            href="/login"
            className="rounded-md font-semibold text-accent underline underline-offset-2 hover:no-underline focus-ring"
          >
            Đăng nhập
          </Link>
        </p>
      </form>
    </>
  );
}
