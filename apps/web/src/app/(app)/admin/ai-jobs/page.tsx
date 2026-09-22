'use client';

import Link from 'next/link';
import { useAdminAiJobs } from '@/lib/admin-api';
import { StatusChip, jobTypeLabel, statusLabel } from '@/components/admin/status-chip';
import {
  Icon,
  PageHeader,
  Select,
  Table,
  TableCard,
  Tbody,
  Td,
  Th,
  TableEmpty,
  TableSkeleton,
  Thead,
  cn,
} from '@/components/ui';
import { ErrorState } from '@/components/ui/states';
import { Reveal } from '@/lib/motion';
import { errorDetail, errorText } from '@/lib/api-client';
import { useQueryParam } from '@/lib/url-state';

const STATUS_OPTIONS = ['', 'QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED'] as const;

/** Trên ngưỡng này thì tỉ lệ thất bại được tô đỏ để đập vào mắt. */
const FAILURE_ALERT_PERCENT = 20;

export default function AdminAiJobsPage() {
  const [status, setStatus] = useQueryParam('status');
  const jobs = useAdminAiJobs(status || undefined);

  const total = jobs.data?.jobs.length ?? 0;
  const failed = jobs.data?.jobs.filter((j) => j.status === 'FAILED').length ?? 0;
  const failureRate = total > 0 ? Math.round((failed / total) * 100) : 0;
  const alerting = failureRate > FAILURE_ALERT_PERCENT;

  return (
    <section>
      <PageHeader
        title="AI Job"
        action={
          <>
            <label htmlFor="job-status" className="sr-only">
              Lọc theo trạng thái job
            </label>
            <Select
              id="job-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-56"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s ? statusLabel(s) : 'Tất cả trạng thái'}
                </option>
              ))}
            </Select>
          </>
        }
      />

      {jobs.data && total > 0 && (
        <p className="mb-4 flex items-center gap-1.5 text-sm text-ink-500">
          <span className="font-bold tabular-nums text-ink-700">{total}</span> job trong danh sách ·
          tỉ lệ thất bại
          <span
            className={cn(
              'inline-flex items-center gap-1 font-bold tabular-nums',
              alerting ? 'text-danger-700' : 'text-ink-700',
            )}
          >
            {alerting && <Icon name="alert" size={14} />}
            {failureRate}%
          </span>
        </p>
      )}

      {jobs.isLoading && <TableSkeleton columns={7} />}

      {jobs.isError && (
        <ErrorState
          title="Không tải được danh sách job"
          description={errorText(jobs.error, 'Vui lòng thử lại.')}
          detail={errorDetail(jobs.error)}
          onRetry={() => void jobs.refetch()}
        />
      )}

      {jobs.data &&
        jobs.data.jobs.length === 0 &&
        (status ? (
          <TableEmpty
            title={`Không có job nào ở trạng thái ${statusLabel(status)}`}
            description="Bỏ bộ lọc để xem toàn bộ job gần đây."
            onClearFilter={() => setStatus('')}
          />
        ) : (
          <TableEmpty
            icon="sparkles"
            title="Chưa có job AI nào"
            description="Job sẽ xuất hiện ở đây khi có người bấm sinh bài học từ tài liệu."
          />
        ))}

      {jobs.data && jobs.data.jobs.length > 0 && (
        <Reveal>
          <TableCard>
            <Table>
              <Thead>
                <Th>Khóa học</Th>
                <Th>Người yêu cầu</Th>
                <Th>Loại</Th>
                <Th>Trạng thái</Th>
                <Th align="right">Tiến độ</Th>
                <Th>Lúc xếp hàng</Th>
                <Th align="right" />
              </Thead>
              <Tbody>
                {jobs.data.jobs.map((j) => (
                  <tr key={j.id}>
                    <Td className="font-medium text-ink-900">{j.courseTitle}</Td>
                    <Td>{j.requesterEmail}</Td>
                    <Td>{jobTypeLabel(j.type)}</Td>
                    <Td>
                      <StatusChip status={j.status} />
                      {j.status === 'FAILED' && j.error && (
                        <p
                          className="mt-1 max-w-xs truncate text-xs font-medium text-danger-700"
                          title={j.error.message}
                        >
                          {j.error.message}
                        </p>
                      )}
                    </Td>
                    <Td align="right" className="tabular-nums">
                      {j.progress}%
                    </Td>
                    <Td className="whitespace-nowrap text-ink-500">
                      {new Date(j.queuedAt).toLocaleString('vi-VN')}
                    </Td>
                    <Td align="right">
                      <Link
                        href={`/admin/ai-jobs/${j.id}`}
                        className="inline-flex items-center gap-0.5 rounded-md text-sm font-bold text-sky-700 underline underline-offset-2 hover:no-underline focus-ring"
                      >
                        Chi tiết
                        <Icon name="chevron-right" size={15} strokeWidth={3} />
                      </Link>
                    </Td>
                  </tr>
                ))}
              </Tbody>
            </Table>
          </TableCard>
        </Reveal>
      )}
    </section>
  );
}
