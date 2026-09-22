'use client';

import { useId, useState } from 'react';
import { cn } from './cn';
import { Icon } from './icon';

/**
 * Điều khiển form. Viền 1px và bo `rounded-lg` theo cùng ngôn ngữ với Button/Card;
 * lỗi luôn đi kèm `aria-describedby` để trình đọc màn hình đọc được, và
 * `aria-invalid` để trạng thái lỗi không chỉ nằm ở màu viền.
 *
 * Ô nhập ở trạng thái nghỉ phải *im lặng*: viền `surface-300` mảnh, nền trắng, không bóng.
 * Chỉ khi focus mới có tín hiệu rõ — viền sky cộng vòng outline.
 */

const CONTROL =
  'w-full rounded-lg border bg-white px-3 py-2 text-sm text-ink-900 outline-none ' +
  'transition-all duration-200 placeholder:text-ink-300 ' +
  'hover:border-surface-400 ' +
  'focus:border-sky-500 focus-ring-tight ' +
  'disabled:cursor-not-allowed disabled:bg-surface-100 disabled:text-ink-500';

function controlClass(invalid: boolean, className?: string) {
  return cn(CONTROL, invalid ? 'border-danger-500' : 'border-surface-300', className);
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink-900">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${htmlFor}-hint`} className="mt-1.5 text-xs text-ink-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${htmlFor}-error`} className="mt-1.5 text-xs font-medium text-danger-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({
  invalid = false,
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={controlClass(invalid, className)}
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
      className={controlClass(invalid, className)}
      {...rest}
    />
  );
}

export function Select({
  invalid = false,
  className,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={controlClass(invalid, className)}
      {...rest}
    />
  );
}

/**
 * Ô mật khẩu có nút hiện/ẩn.
 *
 * Che mật khẩu bằng dấu chấm làm người dùng gõ sai nhiều hơn và hay bỏ dở form
 * hơn, trong khi lợi ích chống nhìn trộm gần như không có ở thiết bị cá nhân —
 * NN/g khuyến nghị luôn kèm tuỳ chọn bỏ che ("Stop Password Masking"). Trên màn
 * đăng ký, nơi người dùng đang *đặt* một mật khẩu mới và không thể dán lại từ
 * đâu cả, đây là thứ ảnh hưởng trực tiếp tới tỉ lệ tạo tài khoản thành công.
 *
 * Chi tiết a11y:
 * - Nút nằm NGOÀI `<label>` nên bấm nó không nhảy focus vào ô nhập.
 * - Nhãn nút đổi theo trạng thái ("Hiện mật khẩu" / "Ẩn mật khẩu"), icon chỉ là
 *   trang trí.
 * - `aria-pressed` cho trình đọc màn hình biết đây là công tắc hai trạng thái.
 * - Vùng bấm 32×32 — trên ngưỡng 24×24 của WCAG 2.2 (2.5.8 Target Size).
 * - Ô nhập chừa `pr-11` để chữ không chui xuống dưới nút.
 */
export function PasswordInput({
  invalid = false,
  className,
  ...rest
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & { invalid?: boolean }) {
  const [visible, setVisible] = useState(false);
  const hintId = useId();

  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        aria-invalid={invalid || undefined}
        aria-describedby={hintId}
        className={controlClass(invalid, cn('pr-11', className))}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-pressed={visible}
        aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-ink-500 hover:bg-surface-200 hover:text-ink-900 focus-ring-tight"
      >
        <Icon name={visible ? 'eye-off' : 'eye'} size={18} />
      </button>
      <span id={hintId} className="sr-only">
        {visible ? 'Mật khẩu đang hiển thị dạng chữ.' : 'Mật khẩu đang được che.'}
      </span>
    </div>
  );
}
