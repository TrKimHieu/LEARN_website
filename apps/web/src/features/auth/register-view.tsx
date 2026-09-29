'use client';

import { Suspense, useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { registerSchema } from '@learn/contracts';
import { useAuth } from '@/features/auth/auth-context';
import { Button, Field, Icon, InlineError, Input, PasswordInput } from '@/components/ui';
import { errorText } from '@/lib/api-client';
import { AuthHeading } from './auth-heading';
import { fieldErrorsFrom, focusFirstError } from '@/lib/form-errors';

export function RegisterView() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}

/** Thứ tự đúng bằng thứ tự ô trên form — `focusFirstError` dựa vào nó. */
const FIELDS = ['displayName', 'email', 'password'] as const;
type FieldName = (typeof FIELDS)[number];

function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<Partial<Record<FieldName, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldError({});
    const parsed = registerSchema.safeParse({ displayName, email, password });
    if (!parsed.success) {
      const errors = fieldErrorsFrom(parsed.error, FIELDS);
      setFieldError(errors);
      focusFirstError(FIELDS, errors);
      return;
    }
    setSubmitting(true);
    try {
      await register(parsed.data);
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
        title="Tạo tài khoản"
        description="Bắt đầu với gói Free: tạo khóa học đầu tiên từ tài liệu của bạn."
      />
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <Field label="Tên hiển thị" htmlFor="displayName" error={fieldError.displayName}>
          <Input
            id="displayName"
            type="text"
            autoComplete="name"
            required
            invalid={Boolean(fieldError.displayName)}
            aria-describedby={fieldError.displayName ? 'displayName-error' : undefined}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </Field>

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

        <Field
          label="Mật khẩu"
          htmlFor="password"
          hint="Tối thiểu 8 ký tự."
          error={fieldError.password}
        >
          <PasswordInput
            id="password"
            autoComplete="new-password"
            required
            minLength={8}
            invalid={Boolean(fieldError.password)}
            aria-describedby={fieldError.password ? 'password-error' : 'password-hint'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        {error && <InlineError>{error}</InlineError>}

        <Button type="submit" fullWidth size="lg" loading={submitting}>
          {submitting ? 'Đang tạo tài khoản…' : 'Tạo tài khoản'}
          {!submitting && <Icon name="arrow-right" size={18} />}
        </Button>

        <p className="pt-2 text-center text-sm text-fg-subtle">
          Đã có tài khoản?{' '}
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
