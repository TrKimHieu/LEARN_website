'use client';

import { useAdminMetrics } from '@/features/admin/admin-api';
import {
  Card,
  Icon,
  PageHeader,
  ProgressBar,
  Skeleton,
  TableEmpty,
  type IconName,
} from '@/components/ui';
import { ErrorState } from '@/components/ui/states';
import { Reveal, StaggerItem, StaggerList } from '@/lib/motion';
import { errorDetail, errorText } from '@/lib/api-client';

export default function AdminMetricsPage() {
  const metrics = useAdminMetrics();

  if (metrics.isLoading) {
    return (
      <section>
        <PageHeader title="Tổng quan hệ thống" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </section>
    );
  }

  if (metrics.isError || !metrics.data) {
    return (
      <section>
        <PageHeader title="Tổng quan hệ thống" />
        <ErrorState
          title="Không tải được số liệu"
          description={errorText(metrics.error, 'Vui lòng thử lại.')}
          detail={errorDetail(metrics.error)}
          onRetry={() => void metrics.refetch()}
        />
      </section>
    );
  }

  const { totals, dailyCosts } = metrics.data;
  // Mốc chia tỉ lệ cho biểu đồ ngày; chặn dưới để không chia cho 0 khi chưa có chi phí nào.
  const maxCost = Math.max(...dailyCosts.map((d) => d.totalCostUsd), 0.0001);

  return (
    <section>
      <PageHeader title="Tổng quan hệ thống" />

      <StaggerList className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StaggerItem>
          <Stat
            icon="shield"
            label="Người dùng"
            value={String(totals.users)}
            sub={`+${totals.usersToday} hôm nay`}
          />
        </StaggerItem>
        <StaggerItem>
          <Stat icon="layers" label="Khóa học" value={String(totals.courses)} />
        </StaggerItem>
        <StaggerItem>
          <Stat icon="book" label="Tài liệu" value={String(totals.documents)} />
        </StaggerItem>
        <StaggerItem>
          <Stat
            icon="target"
            label="AI Job"
            value={String(totals.aiJobs)}
            sub={`+${totals.aiJobsToday} hôm nay`}
          />
        </StaggerItem>
        <StaggerItem>
          <Stat icon="check" label="Lượt nộp bài" value={String(totals.submissions)} />
        </StaggerItem>
        <StaggerItem>
          <Stat
            icon="chart"
            label="Chi phí LLM (tổng)"
            value={`$${totals.totalCostUsd.toFixed(4)}`}
          />
        </StaggerItem>
      </StaggerList>

      <h2 className="mb-3 mt-10 text-lg font-bold text-ink-900">
        Chi phí LLM theo ngày (7 ngày gần nhất)
      </h2>

      {dailyCosts.length === 0 ? (
        <TableEmpty
          icon="chart"
          title="Chưa có dữ liệu chi phí"
          description="Biểu đồ xuất hiện sau job AI đầu tiên. Ở chế độ LLM_MODE=mock thì chi phí luôn bằng 0."
        />
      ) : (
        <Reveal delay={0.08}>
          <Card>
            <ul className="space-y-3">
              {dailyCosts.map((d) => (
                <li key={d.date} className="flex items-center gap-3 text-sm">
                  <span className="w-24 shrink-0 font-medium tabular-nums text-ink-500">
                    {d.date}
                  </span>
                  <ProgressBar
                    value={d.totalCostUsd}
                    max={maxCost}
                    label={`${d.date}: ${d.totalCostUsd.toFixed(4)} đô la, ${d.jobCount} job`}
                  />
                  <span className="w-32 shrink-0 text-right font-bold tabular-nums text-ink-700">
                    ${d.totalCostUsd.toFixed(4)}
                    <span className="font-medium text-ink-500"> · {d.jobCount} job</span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>
      )}
    </section>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
}: {
  icon: IconName;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card className="flex items-center gap-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-700">
        <Icon name={icon} size={22} strokeWidth={2.5} />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-bold tabular-nums text-ink-900">{value}</p>
        <p className="mt-0.5 text-xs font-medium text-ink-500">{label}</p>
        {/* ink-300 (#94a3b8) là bậc dành cho viền và chữ mờ TRÊN NỀN TỐI —
            trên nền trắng nó chỉ đạt 2.56:1, thua xa AA. Đây là chữ nội dung
            thật ("+3 hôm nay") nên phải dùng ink-500 (4.83:1). */}
        {sub && <p className="text-xs text-ink-500">{sub}</p>}
      </div>
    </Card>
  );
}
