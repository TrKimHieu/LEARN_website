'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { z } from 'zod';
import { Button, Field, Input } from '@/components/ui';
import { PartialNotice } from '@/components/ui/states';

const emailOnly = z.string().email();

export function ForgotPasswordView() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!emailOnly.safeParse(email).success) {
      setError('Email không hợp lệ.');
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-ink-700">
          Nếu email <b>{email}</b> có trong hệ thống, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.
        </p>
        {/* Nhãn "Đang phát triển" theo AGENTS.md — không trình bày tính năng
            chưa làm như đã làm. */}
        <PartialNotice>
          Tính năng gửi email <b>đang phát triển</b> — luồng đặt lại mật khẩu sẽ được nối ở một bước
          sau.
        </PartialNotice>
        <p className="pt-1">
          <Link
            href="/login"
            className="rounded-md text-xs font-bold text-sky-700 underline underline-offset-2 hover:no-underline focus-ring"
          >
            Quay lại đăng nhập
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field label="Email" htmlFor="email" error={error ?? undefined}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          invalid={Boolean(error)}
          aria-describedby={error ? 'email-error' : undefined}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>

      <Button type="submit" fullWidth size="lg">
        Gửi hướng dẫn
      </Button>

      <p className="pt-1 text-center text-xs font-bold text-ink-500">
        Nhớ ra mật khẩu rồi?{' '}
        <Link
          href="/login"
          className="rounded-md text-sky-700 underline underline-offset-2 hover:no-underline focus-ring"
        >
          Đăng nhập
        </Link>
      </p>
    </form>
  );
}
