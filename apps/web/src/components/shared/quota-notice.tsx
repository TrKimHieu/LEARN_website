import Link from 'next/link';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/components/ui/cn';

const METRIC_LABEL: Record<string, string> = {
  COURSES_CREATED: 'khóa học',
  DOCUMENTS_UPLOADED: 'tài liệu trong tháng',
  PAGES_PROCESSED: 'trang xử lý',
  AI_JOBS_RUN: 'lượt sinh AI trong tháng',
};

/** Băng cảnh báo 402 QUOTA_EXCEEDED — hiện đúng used/limit và đường nâng cấp gói. */
export function QuotaNotice({
  metric,
  limit,
  used,
  className,
}: {
  metric: string;
  limit: number;
  used: number;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-card border border-warn-line bg-warn-soft px-4 py-3.5 text-sm leading-relaxed text-warn',
        className,
      )}
    >
      <Icon name="alert" size={18} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p>
          Bạn đã dùng <b className="tabular-nums">{used}</b>/<b className="tabular-nums">{limit}</b>{' '}
          {METRIC_LABEL[metric] ?? metric}, đã chạm hạn mức của gói hiện tại.
        </p>
        <Link
          href="/settings"
          className="mt-1 inline-flex items-center gap-1 rounded-md font-semibold underline underline-offset-2 hover:no-underline focus-ring"
        >
          Nâng cấp gói để tiếp tục
          <Icon name="arrow-right" size={15} />
        </Link>
      </div>
    </div>
  );
}
