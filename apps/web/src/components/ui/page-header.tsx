import Link from 'next/link';
import { Icon } from './icon';
import { cn } from './cn';

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

/** Tiêu đề trang + chỗ đặt hành động chính. Giữ mọi màn cùng một nhịp. */
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
          {eyebrow && <p className="mb-1 text-sm text-fg-subtle">{eyebrow}</p>}
          <h1 className="text-[2.25rem] font-semibold leading-[1.1] tracking-[-0.025em] text-fg sm:text-[2.75rem]">
            {title}
          </h1>
          {description && (
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-fg-subtle">{description}</p>
          )}
        </div>
        {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
      </div>
    </div>
  );
}
