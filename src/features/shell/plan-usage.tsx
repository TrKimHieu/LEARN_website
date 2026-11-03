'use client';

import Link from 'next/link';
import { useSubscription } from '@/features/settings/subscription-api';
import { ProgressBar } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Icon } from '@/components/ui/icon';

const METRIC_LABEL: Record<string, string> = {
  COURSES_CREATED: 'Khóa học',
  DOCUMENTS_UPLOADED: 'Tài liệu / tháng',
  PAGES_PROCESSED: 'Trang đã xử lý',
  AI_JOBS_RUN: 'Lượt sinh AI / tháng',
};

/**
 * Gói + hạn mức, gọn, trong menu tài khoản (ADR 012). Số liệu lấy từ
 * `GET /api/v1/subscription`. Chỉ hiện hạn mức có giới hạn; chạm hạn mức thì ghi rõ
 * bằng chữ + icon, không chỉ đổi màu.
 */
export function PlanUsage({ onNavigate }: { onNavigate?: () => void }) {
  const { data, isPending, isError } = useSubscription();

  if (isPending) {
    return (
      <div className="space-y-2" aria-hidden>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-1.5 w-full" />
        <Skeleton className="h-1.5 w-2/3" />
      </div>
    );
  }

  if (isError || !data) return null;

  const metered = Object.entries(data.usage).filter(([, v]) => v.limit !== null);

  return (
    <section aria-label="Gói và hạn mức">
      <div className="mb-2.5 flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-fg">
          Gói <span className="font-semibold">{data.planCode}</span>
        </p>
        <Link
          href="/settings"
          onClick={onNavigate}
          className="rounded-md text-xs font-medium text-accent underline underline-offset-2 hover:no-underline focus-ring"
        >
          Quản lý gói
        </Link>
      </div>

      {metered.length === 0 ? (
        <p className="text-xs text-fg-subtle">Gói hiện tại không giới hạn hạn mức.</p>
      ) : (
        <ul className="space-y-2">
          {metered.map(([metric, v]) => {
            const limit = v.limit as number;
            const atLimit = v.used >= limit;
            const name = METRIC_LABEL[metric] ?? metric;
            return (
              <li key={metric}>
                <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
                  <span className="text-fg-subtle">{name}</span>
                  <span
                    className={
                      atLimit
                        ? 'inline-flex items-center gap-1 font-medium tabular-nums text-bad'
                        : 'tabular-nums text-fg-muted'
                    }
                  >
                    {atLimit && <Icon name="alert" size={11} />}
                    {v.used}/{limit}
                    {atLimit && <span className="sr-only">, đã chạm hạn mức</span>}
                  </span>
                </div>
                <ProgressBar
                  size="xs"
                  value={v.used}
                  max={limit}
                  label={`${name}: ${v.used} trên ${limit}`}
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
