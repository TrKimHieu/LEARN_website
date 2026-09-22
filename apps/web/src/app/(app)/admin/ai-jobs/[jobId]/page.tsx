'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useAdminAiJobDetail, useAiJobAuditLog, useRetryAiJob } from '@/lib/admin-api';
import { StatusChip, jobTypeLabel } from '@/components/admin/status-chip';
import {
  Button,
  Card,
  CardTitle,
  Icon,
  Skeleton,
  Table,
  TableCard,
  Tbody,
  Td,
  Th,
  Thead,
} from '@/components/ui';
import { ErrorState } from '@/components/ui/states';
import { ApiClientError } from '@/lib/api-client';

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
      setRetryError(
        err instanceof ApiClientError ? err.message : 'Không chạy lại được job, vui lòng thử lại.',
      );
    }
  }

  if (job.isLoading) return <Skeleton className="h-48" />;

  if (job.isError || !job.data) {
    return (
      <ErrorState
        title="Không tải được job"
        description={job.error instanceof ApiClientError ? job.error.message : 'Vui lòng thử lại.'}
        onRetry={() => void job.refetch()}
      />
    );
  }

  const j = job.data;

  return (
    <section>
      <Link
        href="/admin/ai-jobs"
        className="inline-flex items-center gap-1 rounded-md text-sm font-bold text-ink-500 hover:text-ink-900"
      >
        <Icon name="chevron-right" size={15} className="rotate-180" />
        AI Job
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-ink-900">{j.courseTitle}</h1>
          <p className="mt-1 text-sm text-ink-500">
            {jobTypeLabel(j.type)} · yêu cầu bởi {j.requesterEmail}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusChip status={j.status} />
          {j.status === 'FAILED' && (
            <Button size="sm" onClick={() => void handleRetry()} disabled={retry.isPending}>
              {retry.isPending ? 'Đang chạy lại…' : 'Chạy lại job'}
            </Button>
          )}
        </div>
      </div>

      {retryError && (
        <p
          role="alert"
          className="mt-4 rounded-card bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700"
        >
          {retryError}
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Fact
          label="Tiến độ"
          value={`${j.progress}%${j.progressLabel ? ` · ${j.progressLabel}` : ''}`}
        />
        <Fact label="Lượt thử" value={String(j.attempt)} />
        <Fact label="Xếp hàng lúc" value={new Date(j.queuedAt).toLocaleString('vi-VN')} />
        <Fact
          label="Hoàn tất lúc"
          value={j.finishedAt ? new Date(j.finishedAt).toLocaleString('vi-VN') : '—'}
        />
      </div>

      {j.error && (
        <Card className="mt-4 border-danger-100 bg-danger-50">
          <p className="flex items-center gap-1.5 text-sm font-bold text-danger-700">
            <Icon name="alert" size={16} />
            {j.error.code}: {j.error.message}
          </p>
          {j.error.detail != null && (
            <pre className="mt-3 overflow-x-auto rounded-xl bg-white p-3 text-xs text-danger-700">
              {JSON.stringify(j.error.detail, null, 2)}
            </pre>
          )}
        </Card>
      )}

      <h2 className="mb-3 mt-8 text-lg font-bold text-ink-900">Tham số đầu vào</h2>
      <Card>
        <pre className="overflow-x-auto text-xs text-ink-700">
          {JSON.stringify(j.inputParams, null, 2)}
        </pre>
      </Card>

      <h2 className="mb-3 mt-8 text-lg font-bold text-ink-900">
        Lượt gọi LLM ({j.runs.length})
      </h2>
      {j.runs.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-500">Chưa có lượt gọi nào.</p>
        </Card>
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
                  <Td className="font-medium text-ink-900">{r.step}</Td>
                  <Td className="font-mono text-xs">{r.model}</Td>
                  <Td align="right" className="tabular-nums">
                    {r.inputTokens}/{r.outputTokens}
                  </Td>
                  <Td align="right" className="tabular-nums">
                    {r.latencyMs}ms
                  </Td>
                  <Td className="whitespace-nowrap text-ink-500">
                    {new Date(r.createdAt).toLocaleTimeString('vi-VN')}
                  </Td>
                </tr>
              ))}
            </Tbody>
          </Table>
        </TableCard>
      )}

      <h2 className="mb-3 mt-8 text-lg font-bold text-ink-900">Lịch sử thao tác admin</h2>
      {auditLog.isLoading && <Skeleton className="h-24" />}
      {auditLog.data && auditLog.data.entries.length === 0 && (
        <Card>
          <p className="text-sm text-ink-500">Chưa có thao tác admin nào trên job này.</p>
        </Card>
      )}
      {auditLog.data && auditLog.data.entries.length > 0 && (
        <Card padded={false}>
          <ul className="divide-y-2 divide-surface-200">
            {auditLog.data.entries.map((e) => (
              <li key={e.id} className="px-5 py-3 text-sm">
                <span className="font-bold text-ink-900">{e.action}</span>
                <span className="text-ink-500">
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
    <Card>
      <CardTitle className="text-xs font-medium text-ink-500">{label}</CardTitle>
      <p className="mt-1.5 text-sm font-medium text-ink-900">{value}</p>
    </Card>
  );
}
