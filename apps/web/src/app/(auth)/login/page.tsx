'use client';

import { Suspense, useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginSchema } from '@learn/contracts';
import { useAuth } from '@/lib/auth-context';
import { Button, Field, Input, PasswordInput } from '@/components/ui';
import { ApiClientError } from '@/lib/api-client';
import { fieldErrorsFrom, focusFirstError } from '@/lib/form-errors';

export default function LoginPage() {
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

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<Partial<Record<FieldName, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldError({});
    const parsed = loginSchema.safeParse({ email, password });
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
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'Không kết nối được máy chủ, vui lòng thử lại.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field label="Email" htmlFor="email" error={fieldError.email}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          invalid={Boolean(fieldError.email)}
          aria-describedby={fieldError.email ? 'email-error' : undefined}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>

      <Field label="Mật khẩu" htmlFor="password" error={fieldError.password}>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          required
          invalid={Boolean(fieldError.password)}
          aria-describedby={fieldError.password ? 'password-error' : undefined}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>

      {error && (
        <p
          role="alert"
          className="rounded-card bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700"
        >
          {error}
        </p>
      )}

      <Button type="submit" fullWidth size="lg" disabled={submitting}>
        {submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
      </Button>

      <div className="flex items-center justify-between gap-3 pt-1 text-xs font-bold">
        <Link
          href="/register"
          className="rounded-md text-sky-700 underline underline-offset-2 hover:no-underline focus-ring"
        >
          Chưa có tài khoản? Đăng ký
        </Link>
        <Link
          href="/forgot-password"
          className="rounded-md text-ink-700 underline underline-offset-2 hover:no-underline focus-ring"
        >
          Quên mật khẩu
        </Link>
      </div>
    </form>
  );
}
