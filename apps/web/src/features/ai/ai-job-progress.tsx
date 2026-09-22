'use client';

import { useEffect } from 'react';
import { Mascot } from '@/components/shared/mascot';
import { Button, Card, ProgressBar } from '@/components/ui';
import { PartialNotice } from '@/components/ui/states';
import { useAiJob, useCancelAiJob } from '@/features/ai/ai-api';
import { partialFailuresOf } from '@/features/ai/ai-job-partial';
import { errorText } from '@/lib/api-client';

/**
 * Tiến độ AI Job — HANDBOOK §7.4: % + nhãn bước + mascot, fallback polling 2s (SSE để sau).
 * Worker publish progress theo từng node outline (`lesson-generate.processor.ts`), component này
 * chỉ đọc lại qua GET /ai/jobs/:id — không cần biết trước bao nhiêu bước.
 *
 * Đây là một trong bốn vị trí `[SPEC]` cho phép đặt mascot (§13.1), nên mỗi
 * trạng thái job dùng một state mascot riêng thay vì dùng chung một ảnh.
 */
function Panel({ children }: { children: React.ReactNode }) {
  return (
    <Card className="mt-6 flex flex-col items-center gap-3 py-12 text-center">{children}</Card>
  );
}

export function AiJobProgress({
  jobId,
  onDone,
}: {
  jobId: string;
  onDone: (result: { succeeded: boolean }) => void;
}) {
  const job = useAiJob(jobId);
  const cancel = useCancelAiJob(jobId);
  const status = job.data?.status;

  const partialFailures = partialFailuresOf(job.data?.error);

  useEffect(() => {
    // Job xong trọn vẹn thì tự chuyển tiếp sau một nhịp ăn mừng. Job xong MỘT PHẦN thì không:
    // người dùng cần đọc xem phần nào thiếu rồi tự bấm đi tiếp.
    if (status === 'SUCCEEDED' && partialFailures.length === 0) {
      const t = setTimeout(() => onDone({ succeeded: true }), 900);
      return () => clearTimeout(t);
    }
  }, [status, partialFailures.length, onDone]);

  if (job.isLoading) {
    return (
      <Panel>
        <Mascot state="thinking" size={88} />
        <p className="text-sm font-medium text-ink-500">Đang kết nối tới AI Job…</p>
      </Panel>
    );
  }

  if (job.isError || !job.data) {
    return (
      <Panel>
        <Mascot state="alerting" size={88} />
        <p className="text-sm font-medium text-ink-900">
          {errorText(job.error, 'Không theo dõi được job.')}
        </p>
        <Button variant="secondary" onClick={() => onDone({ succeeded: false })}>
          Đóng
        </Button>
      </Panel>
    );
  }

  const j = job.data;

  if (j.status === 'QUEUED' || j.status === 'RUNNING') {
    const queued = j.status === 'QUEUED';
    return (
      <Panel>
        <Mascot state={queued ? 'thinking' : 'working'} size={88} />
        <p className="text-sm font-bold text-ink-900">
          {queued ? 'Đang xếp hàng…' : (j.progressLabel ?? 'Đang xử lý…')}
        </p>
        <div className="w-full max-w-xs">
          <ProgressBar
            value={Math.max(4, j.progress)}
            label={`Tiến độ sinh bài học: ${j.progress}%`}
          />
          <p className="mt-1.5 text-xs font-bold tabular-nums text-ink-500">{j.progress}%</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => cancel.mutate()}
          disabled={cancel.isPending}
        >
          {cancel.isPending ? 'Đang huỷ…' : 'Huỷ job'}
        </Button>
      </Panel>
    );
  }

  if (j.status === 'SUCCEEDED') {
    // Trạng thái PARTIAL của HANDBOOK: worker đánh dấu job SUCCEEDED nhưng ghi
    // `error.code = 'PARTIAL_FAILURES'` khi một số node outline không sinh được bài học hợp lệ.
    // Trước đây màn hình này bỏ qua hoàn toàn `j.error` và luôn báo "Hoàn tất!", nên người dùng
    // yêu cầu 10 bài, nhận về 7, và không có gì cho biết 3 bài kia đã biến mất.
    if (partialFailures.length > 0) {
      return (
        <Panel>
          <Mascot state="alerting" size={88} />
          <p className="text-sm font-semibold text-ink-900">
            Đã sinh xong, nhưng {partialFailures.length} phần không hoàn thành
          </p>
          <div className="w-full max-w-md text-left">
            <PartialNotice>
              Những phần dưới đây không sinh được bài học hợp lệ. Các bài còn lại đã sẵn sàng — bạn
              có thể học ngay, rồi chạy sinh lại để bổ sung phần thiếu.
            </PartialNotice>
            <ul className="space-y-1.5">
              {partialFailures.map((f) => (
                <li
                  key={f.node}
                  className="rounded-lg border border-surface-300 bg-surface-100 px-3 py-2 text-xs"
                >
                  <span className="font-medium text-ink-900">{f.node}</span>
                  {f.errors.length > 0 && (
                    <span className="text-ink-500"> — {f.errors.join('; ')}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <Button onClick={() => onDone({ succeeded: true })}>Xem bài học đã sinh</Button>
        </Panel>
      );
    }

    return (
      <Panel>
        <Mascot state="celebrate" size={88} />
        <p className="text-sm font-semibold text-ink-900">Hoàn tất! Bài học đã sẵn sàng.</p>
      </Panel>
    );
  }

  // Huỷ là hành động chủ động của người dùng, không phải lỗi — nên không dùng
  // mascot cảnh báo cho trường hợp đó.
  const cancelled = j.status === 'CANCELLED';
  return (
    <Panel>
      <Mascot state={cancelled ? 'idle' : 'alerting'} size={88} />
      <p className="text-sm font-bold text-ink-900">
        {cancelled ? 'Đã huỷ job.' : 'Sinh bài học thất bại.'}
      </p>
      {j.error?.message && !cancelled && (
        <p className="max-w-sm text-xs text-ink-500">{j.error.message}</p>
      )}
      <Button onClick={() => onDone({ succeeded: false })}>Thử lại</Button>
    </Panel>
  );
}
