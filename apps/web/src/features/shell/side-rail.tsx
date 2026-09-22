'use client';

import Link from 'next/link';
import { useSubscription } from '@/features/settings/subscription-api';
import { Card, CardTitle } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Skeleton } from '@/components/ui/skeleton';
import { Icon } from '@/components/ui/icon';

const METRIC_LABEL: Record<string, string> = {
  COURSES_CREATED: 'Khóa học đã tạo',
  DOCUMENTS_UPLOADED: 'Tài liệu tháng này',
  PAGES_PROCESSED: 'Trang đã xử lý',
  AI_JOBS_RUN: 'Lượt sinh AI tháng này',
};

/**
 * Cột phải: gói hiện tại và hạn mức đã dùng. Toàn bộ số liệu lấy từ
 * `GET /api/v1/subscription` — không có ô quảng cáo, không có nội dung giả.
 */
export function SideRail() {
  const { data, isPending, isError } = useSubscription();

  if (isPending) {
    return (
      <Card>
        <Skeleton className="mb-4 h-5 w-24" />
        <Skeleton className="mb-2 h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </Card>
    );
  }

  if (isError || !data) return null;

  const metered = Object.entries(data.usage).filter(([, v]) => v.limit !== null);

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-2">
        <CardTitle>Gói {data.planCode}</CardTitle>
        <Link
          href="/settings"
          className="rounded-md text-xs font-bold text-sky-700 underline underline-offset-2 hover:no-underline focus-ring"
        >
          Quản lý
        </Link>
      </div>

      {metered.length === 0 ? (
        <p className="text-sm text-ink-500">Gói hiện tại không giới hạn hạn mức.</p>
      ) : (
        <ul className="space-y-3">
          {metered.map(([metric, v]) => {
            const limit = v.limit as number;
            const atLimit = v.used >= limit;
            return (
              <li key={metric}>
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className="text-xs font-medium text-ink-700">
                    {METRIC_LABEL[metric] ?? metric}
                  </span>
                  <span
                    className={`text-xs font-bold tabular-nums ${
                      atLimit ? 'text-danger-700' : 'text-ink-500'
                    }`}
                  >
                    {v.used}/{limit}
                  </span>
                </div>
                <ProgressBar
                  size="sm"
                  value={v.used}
                  max={limit}
                  label={`${METRIC_LABEL[metric] ?? metric}: ${v.used} trên ${limit}`}
                />
                {atLimit && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-medium text-danger-700">
                    <Icon name="alert" size={12} />
                    Đã chạm hạn mức
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
