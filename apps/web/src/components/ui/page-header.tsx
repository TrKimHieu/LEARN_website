import Link from 'next/link';
import { Icon } from './icon';

/**
 * Tiêu đề trang + chỗ đặt hành động chính. Giữ mọi màn cùng một nhịp.
 *
 * `backLink` tuỳ chọn: markup này lặp lại y hệt (link + `chevron-right` xoay 180°) ở
 * `courses/[courseId]` và `lessons/[lessonId]`, nhưng hai trang đó có banner tiêu đề
 * riêng nên không đổi sang `PageHeader`. Prop này phục vụ trang nào *có thể* dùng
 * `PageHeader` mà vẫn cần đường về — ví dụ `admin/ai-jobs/[jobId]`.
 */
export function PageHeader({
  title,
  description,
  action,
  backLink,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  backLink?: { href: string; label: string };
}) {
  return (
    <div className="mb-6">
      {backLink && (
        <Link
          href={backLink.href}
          className="mb-2 inline-flex items-center gap-1 rounded-md text-sm font-bold text-ink-500 hover:text-ink-900"
        >
          <Icon name="chevron-right" size={15} className="rotate-180" />
          {backLink.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-ink-900">{title}</h1>
          {description && <p className="mt-1 text-sm text-ink-500">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
