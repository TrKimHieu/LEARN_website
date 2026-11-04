'use client';

import { useAdminMetrics } from '@/features/admin/admin-api';
import { CostChart } from '@/features/admin/cost-chart';
import {
  Card,
  ErrorState,
  PageHeader,
  SectionTitle,
  Skeleton,
  StatCard,
  StatStrip,
  TableEmpty,
} from '@/components/ui';
import { errorDetail, errorText } from '@/lib/api-client';
import { absoluteTime, relativeTime } from '@/lib/format';
import { usePageTitle } from '@/lib/use-page-title';

export default function AdminMetricsPage() {
  usePageTitle('Quản trị · Số liệu');
  const metrics = useAdminMetrics();

  if (metrics.isLoading) {
    return (
      <section aria-busy="true">
        <PageHeader title="Tổng quan hệ thống" />
        <Skeleton className="h-24 rounded-card" />
        <Skeleton className="mt-10 h-80 rounded-card" />
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

  const { totals, dailyCosts, generatedAt } = metrics.data;

  return (
    <section>
      <PageHeader
        title="Tổng quan hệ thống"
        description={`Số liệu tính lúc ${relativeTime(generatedAt)} (${absoluteTime(generatedAt)}).`}
      />

      <StatStrip className="sm:grid-flow-row sm:grid-cols-3 lg:grid-flow-col lg:grid-cols-none">
        <StatCard
          label="Người dùng"
          value={String(totals.users)}
          sub={`+${totals.usersToday} hôm nay`}
        />
        <StatCard label="Khóa học" value={String(totals.courses)} />
        <StatCard label="Tài liệu" value={String(totals.documents)} />
        <StatCard
          label="AI Job"
          value={String(totals.aiJobs)}
          sub={`+${totals.aiJobsToday} hôm nay`}
        />
        <StatCard label="Lượt nộp bài" value={String(totals.submissions)} />
        <StatCard label="Chi phí LLM (tổng)" value={`$${totals.totalCostUsd.toFixed(4)}`} />
      </StatStrip>

      <section aria-labelledby="cost-title" className="mt-12">
        <SectionTitle id="cost-title" description="Tổng chi phí gọi LLM mỗi ngày, tính bằng USD.">
          Chi phí LLM theo ngày
        </SectionTitle>
        {dailyCosts.length === 0 ? (
          <TableEmpty
            icon="chart"
            title="Chưa có dữ liệu chi phí"
            description="Biểu đồ xuất hiện sau job AI đầu tiên. Ở chế độ LLM_MODE=mock thì chi phí luôn bằng 0."
          />
        ) : (
          <Card>
            <CostChart data={dailyCosts} />
          </Card>
        )}
      </section>
    </section>
  );
}
