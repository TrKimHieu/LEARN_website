'use client';

import { useId, useState } from 'react';
import { cn } from './cn';
import { Icon, type IconName } from './icon';

/**
 * Điều khiển form. Nhãn luôn hiển thị phía trên (không dùng placeholder làm nhãn), lỗi
 * nằm ngay dưới ô kèm icon, `aria-invalid` + `aria-describedby` để trình đọc màn hình
 * đọc được. Ô ở trạng thái nghỉ im lặng; focus mới có vòng sky.
 */
const CONTROL =
  'w-full rounded-control border bg-panel px-3.5 text-[0.9375rem] text-fg outline-none ' +
  'transition-[border-color,box-shadow] duration-200 placeholder:text-fg-subtle/80 ' +
  'hover:border-fg-subtle focus:border-fg focus:shadow-[0_0_0_3px_var(--line)] ' +
  'disabled:cursor-not-allowed disabled:bg-muted disabled:text-fg-subtle';

function controlClass(invalid: boolean, className?: string) {
  return cn(CONTROL, invalid ? 'border-fg focus:border-fg' : 'border-line-input', className);
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-fg">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${htmlFor}-hint`} className="mt-1.5 text-xs text-fg-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${htmlFor}-error`}
          className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-bad"
        >
          <Icon name="alert" size={13} />
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({
  invalid = false,
  className,
  icon,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean; icon?: IconName }) {
  if (icon) {
    return (
      <div className={cn('relative', className)}>
        <Icon
          name={icon}
          size={17}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle"
        />
        <input
          aria-invalid={invalid || undefined}
          className={controlClass(invalid, 'h-11 pl-10')}
          {...rest}
        />
      </div>
    );
  }
  return (
    <input
      aria-invalid={invalid || undefined}
      className={controlClass(invalid, cn('h-11', className))}
      {...rest}
    />
  );
}

export function Textarea({
  invalid = false,
  className,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={controlClass(invalid, cn('py-2.5 leading-relaxed', className))}
      {...rest}
    />
  );
}

export function Select({
  invalid = false,
  className,
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <div className={cn('relative', className)}>
      <select
        aria-invalid={invalid || undefined}
        className={controlClass(invalid, 'h-11 cursor-pointer appearance-none pr-10')}
        {...rest}
      >
        {children}
      </select>
      <Icon
        name="chevron-down"
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-fg-subtle"
      />
    </div>
  );
}

/**
 * Ô mật khẩu có nút hiện/ẩn (NN/g — "Stop Password Masking"). Nút nằm ngoài `<label>`,
 * nhãn đổi theo trạng thái, `aria-pressed` cho công tắc hai trạng thái, vùng bấm 32px.
 */
export function PasswordInput({
  invalid = false,
  className,
  ...rest
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & { invalid?: boolean }) {
  const [visible, setVisible] = useState(false);
  const hintId = useId();
  const describedBy = [rest['aria-describedby'], hintId].filter(Boolean).join(' ');

  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        aria-invalid={invalid || undefined}
        {...rest}
        aria-describedby={describedBy}
        className={controlClass(invalid, cn('h-11 pr-12', className))}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-pressed={visible}
        aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-md text-fg-subtle hover:bg-muted hover:text-fg focus-ring-tight"
      >
        <Icon name={visible ? 'eye-off' : 'eye'} size={18} />
      </button>
      <span id={hintId} className="sr-only">
        {visible ? 'Mật khẩu đang hiển thị dạng chữ.' : 'Mật khẩu đang được che.'}
      </span>
    </div>
  );
}
