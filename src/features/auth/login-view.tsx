'use client';

import { Suspense, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginSchema } from '@learn/api-contracts';
import { useAuth } from '@/features/auth/auth-context';
import { Button, Field, Icon, InlineError, Input, PasswordInput } from '@/components/ui';
import { errorText } from '@/lib/api-client';
import { AuthHeading } from './auth-heading';
import { fieldErrorsFrom, focusFirstError } from '@/lib/form-errors';

export function LoginView() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

/** Thứ tự đúng bằng thứ tự ô trên form — `focusFirstError` dựa vào nó. */
const FIELDS = ['email', 'password'] as const;
type FieldName = (typeof FIELDS)[number];

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');

  const { status } = useAuth();

  useEffect(() => {
    if (status === 'authed') router.replace(next || '/dashboard');
  }, [status, next, router]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<Partial<Record<FieldName, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldError({});
    const parsed = loginSchema.safeParse({ email: email.trim(), password });
    if (!parsed.success) {
      // Lỗi về đúng ô của nó, rồi con trỏ đi theo — người dùng không phải dò
      // xem câu báo lỗi đang nói về ô nào.
      const errors = fieldErrorsFrom(parsed.error, FIELDS);
      setFieldError(errors);
      focusFirstError(FIELDS, errors);
      return;
    }
    setSubmitting(true);
    try {
      await login(parsed.data);
      router.replace(next || '/dashboard');
      router.refresh();
    } catch (err) {
      setError(errorText(err, 'Không kết nối được máy chủ, vui lòng thử lại.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <AuthHeading
        title="Chào mừng trở lại"
        description="Đăng nhập để tiếp tục các khóa học và bài tập của bạn."
      />
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <Field label="Email" htmlFor="email" error={fieldError.email}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="ban@vidu.com"
            required
            invalid={Boolean(fieldError.email)}
            aria-describedby={fieldError.email ? 'email-error' : undefined}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <label htmlFor="password" className="text-sm font-semibold text-fg">
              Mật khẩu
            </label>
            <Link
              href="/forgot-password"
              className="rounded-md text-xs font-semibold text-accent underline underline-offset-2 hover:no-underline focus-ring"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            required
            invalid={Boolean(fieldError.password)}
            aria-describedby={fieldError.password ? 'password-error' : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {fieldError.password && (
            <p
              id="password-error"
              className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-bad"
            >
              <Icon name="alert" size={13} />
              {fieldError.password}
            </p>
          )}
        </div>

        {error && <InlineError>{error}</InlineError>}

        <Button type="submit" fullWidth size="lg" loading={submitting}>
          {submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
          {!submitting && <Icon name="arrow-right" size={18} />}
        </Button>

        <p className="pt-2 text-center text-sm text-fg-subtle">
          Chưa có tài khoản?{' '}
          <Link
            href="/register"
            className="rounded-md font-semibold text-accent underline underline-offset-2 hover:no-underline focus-ring"
          >
            Đăng ký miễn phí
          </Link>
        </p>
      </form>
    </>
  );
}
