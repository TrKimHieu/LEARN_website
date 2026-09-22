import Link from 'next/link';
import { Icon } from '@/components/ui/icon';

const METRIC_LABEL: Record<string, string> = {
  COURSES_CREATED: 'khóa học',
  DOCUMENTS_UPLOADED: 'tài liệu trong tháng',
  PAGES_PROCESSED: 'trang xử lý',
  AI_JOBS_RUN: 'lượt sinh AI trong tháng',
};

/** Băng cảnh báo 402 QUOTA_EXCEEDED — hiện đúng used/limit và gợi ý nâng cấp gói. */
export function QuotaNotice({
  metric,
  limit,
  used,
}: {
  metric: string;
  limit: number;
  used: number;
}) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-lg border border-warning-100 bg-warning-50 px-4 py-3 text-sm leading-relaxed text-warning-700"
    >
      <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
      <div>
        <p>
          Bạn đã dùng <b>{used}</b>/<b>{limit}</b> {METRIC_LABEL[metric] ?? metric} — đã chạm hạn
          mức gói hiện tại.
        </p>
        <Link
          href="/settings"
          className="mt-1 inline-block rounded-md font-bold underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warning-700"
        >
          Nâng cấp gói để tiếp tục →
        </Link>
      </div>
    </div>
  );
}
