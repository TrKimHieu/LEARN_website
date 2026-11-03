'use client';

import { use, useState } from 'react';
import { useAdminAiJobDetail, useAiJobAuditLog, useRetryAiJob } from '@/features/admin/admin-api';
import { StatusChip, jobTypeLabel } from '@/features/admin/status-chip';
import {
  Button,
  Card,
  Icon,
  PageHeader,
  Table,
  TableCard,
  Tbody,
  Td,
  Th,
  Thead,
  TableSkeleton,
  TableEmpty,
} from '@/components/ui';
import { ErrorState, InlineError, LoadingState } from '@/components/ui/states';
import { errorDetail, errorText } from '@/lib/api-client';

export default function AdminAiJobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const job = useAdminAiJobDetail(jobId);
  const auditLog = useAiJobAuditLog(jobId);
  const retry = useRetryAiJob(jobId);
  const [retryError, setRetryError] = useState<string | null>(null);

  async function handleRetry() {
    setRetryError(null);
    try {
      await retry.mutateAsync();
      await Promise.all([job.refetch(), auditLog.refetch()]);
    } catch (err) {
      setRetryError(errorText(err, 'Không chạy lại được job, vui lòng thử lại.'));
    }
  }

  // Khung chờ phải mang hình dạng thứ sắp hiện ra (UI-GUIDE §4c) — không phải một
  // tảng `<Skeleton className="h-48" />` đặc, đúng phản-mẫu mà TableSkeleton chỉ
  // đích danh trong docblock của chính nó.
  if (job.isLoading) {
    return (
      <section>
        <PageHeader title="Đang tải job…" backLink={{ href: '/admin/ai-jobs', label: 'AI Job' }} />
        <LoadingState
          variant="card"
          rows={4}
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        />
        <div className="mt-8">
          <TableSkeleton columns={5} rows={3} />
        </div>
      </section>
    );
  }

  if (job.isError || !job.data) {
    return (
      <ErrorState
        title="Không tải được job"
        description={errorText(job.error, 'Vui lòng thử lại.')}
        detail={errorDetail(job.error)}
        onRetry={() => void job.refetch()}
      />
    );
  }

  const j = job.data;

  return (
    <section>
      <PageHeader
        title={j.courseTitle}
        description={`${jobTypeLabel(j.type)} · yêu cầu bởi ${j.requesterEmail}`}
        backLink={{ href: '/admin/ai-jobs', label: 'AI Job' }}
        action={
          <div className="flex items-center gap-3">
            <StatusChip status={j.status} />
            {j.status === 'FAILED' && (
              <Button size="sm" onClick={() => void handleRetry()} disabled={retry.isPending}>
                {retry.isPending ? 'Đang chạy lại…' : 'Chạy lại job'}
              </Button>
            )}
          </div>
        }
      />

      {retryError && <InlineError className="mb-4">{retryError}</InlineError>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Fact
          label="Tiến độ"
          value={`${j.progress}%${j.progressLabel ? ` · ${j.progressLabel}` : ''}`}
        />
        <Fact label="Lượt thử" value={String(j.attempt)} />
        <Fact label="Xếp hàng lúc" value={new Date(j.queuedAt).toLocaleString('vi-VN')} />
        <Fact
          label="Hoàn tất lúc"
          value={j.finishedAt ? new Date(j.finishedAt).toLocaleString('vi-VN') : 'Chưa xong'}
        />
      </div>

      {j.error && (
        <Card className="mt-4 border-bad-line bg-bad-soft">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-bad">
            <Icon name="alert" size={16} />
            {j.error.code}: {j.error.message}
          </p>
          {j.error.detail != null && (
            <pre className="mt-3 overflow-x-auto rounded-control border border-bad-line bg-panel p-3 font-mono text-xs text-bad">
              {JSON.stringify(j.error.detail, null, 2)}
            </pre>
          )}
        </Card>
      )}

      <h2 className="mb-3 mt-10 text-base font-semibold text-fg">Tham số đầu vào</h2>
      <Card>
        <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-fg-muted">
          {JSON.stringify(j.inputParams, null, 2)}
        </pre>
      </Card>

      <h2 className="mb-3 mt-10 text-base font-semibold text-fg">Lượt gọi LLM ({j.runs.length})</h2>
      {j.runs.length === 0 ? (
        <TableEmpty title="Chưa có lượt gọi nào" icon="sparkles" />
      ) : (
        <TableCard>
          <Table>
            <Thead>
              <Th>Bước</Th>
              <Th>Model</Th>
              <Th align="right">Token vào/ra</Th>
              <Th align="right">Độ trễ</Th>
              <Th>Lúc</Th>
            </Thead>
            <Tbody>
              {j.runs.map((r) => (
                <tr key={r.id}>
                  <Td className="font-medium text-fg">{r.step}</Td>
                  <Td className="font-mono text-xs">{r.model}</Td>
                  <Td align="right" className="tabular-nums">
                    {r.inputTokens}/{r.outputTokens}
                  </Td>
                  <Td align="right" className="tabular-nums">
                    {r.latencyMs}ms
                  </Td>
                  <Td className="whitespace-nowrap text-fg-subtle">
                    {new Date(r.createdAt).toLocaleTimeString('vi-VN')}
                  </Td>
                </tr>
              ))}
            </Tbody>
          </Table>
        </TableCard>
      )}

      <h2 className="mb-3 mt-10 text-base font-semibold text-fg">Lịch sử thao tác admin</h2>
      {auditLog.isLoading && <LoadingState variant="list" rows={3} />}
      {auditLog.isError && (
        <ErrorState
          title="Không tải được lịch sử thao tác"
          description={errorText(auditLog.error, 'Vui lòng thử lại.')}
          detail={errorDetail(auditLog.error)}
          onRetry={() => void auditLog.refetch()}
        />
      )}
      {auditLog.data && auditLog.data.entries.length === 0 && (
        <TableEmpty title="Chưa có thao tác admin nào trên job này" icon="clock" />
      )}
      {auditLog.data && auditLog.data.entries.length > 0 && (
        <Card padded={false}>
          <ul className="divide-y divide-line">
            {auditLog.data.entries.map((e) => (
              <li key={e.id} className="px-5 py-3 text-sm">
                <span className="font-semibold text-fg">{e.action}</span>
                <span className="text-fg-subtle">
                  {' · '}
                  {e.actorEmail ?? 'hệ thống'}
                  {' · '}
                  {new Date(e.createdAt).toLocaleString('vi-VN')}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4 sm:p-5">
      <p className="text-xs font-semibold text-fg-subtle">{label}</p>
      <p className="mt-1.5 text-sm font-semibold text-fg">{value}</p>
    </Card>
  );
}
