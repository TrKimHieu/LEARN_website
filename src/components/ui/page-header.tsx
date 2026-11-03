import Link from 'next/link';
import { Icon } from './icon';
import { cn } from './cn';
import { Eyebrow } from '@/components/shared/decor';

/** Link "quay lại" — một mẫu cho mọi màn con. */
export function BackLink({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group inline-flex items-center gap-1 rounded-md text-sm font-medium text-fg-subtle transition-colors hover:text-fg focus-ring',
        className,
      )}
    >
      <Icon
        name="arrow-left"
        size={16}
        className="transition-transform duration-200 group-hover:-translate-x-0.5"
      />
      {label}
    </Link>
  );
}

/**
 * Tiêu đề trang + chỗ đặt hành động chính. Giữ mọi màn cùng một nhịp.
 *
 * ADR 018: tiêu đề là serif hiển thị (Playfair, navy) — nhịp "tiêu đề seminar" của ảnh tham chiếu;
 * `eyebrow` là nhãn gạch + chữ hoa giãn rộng màu coban, đứng trên tiêu đề.
 */
export function PageHeader({
  title,
  eyebrow,
  description,
  action,
  backLink,
  className,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  action?: React.ReactNode;
  backLink?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div className={cn('mb-10', className)}>
      {backLink && <BackLink {...backLink} className="mb-3" />}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <Eyebrow className="mb-4">{eyebrow}</Eyebrow>}
          <h1 className="font-display text-[2.375rem] font-semibold leading-[1.08] text-fg sm:text-[3.125rem]">
            {title}
          </h1>
          {description && (
            <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-fg-muted">
              {description}
            </p>
          )}
        </div>
        {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
      </div>
    </div>
  );
}
