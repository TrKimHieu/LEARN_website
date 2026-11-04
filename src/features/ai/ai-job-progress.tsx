'use client';

import { useEffect } from 'react';
import { Mascot } from '@/components/shared/mascot';
import { Button, Card, Icon, PartialNotice, ProgressBar } from '@/components/ui';
import { useAiJob, useCancelAiJob } from '@/features/ai/ai-api';
import { failureReasonText, isOnlyDuplicateFailure } from '@/features/ai/ai-job-outcome';
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
    <Card
      role="status"
      aria-live="polite"
      className="relative flex flex-col items-center gap-3 overflow-hidden px-6 py-12 text-center"
    >
      <div className="relative flex w-full flex-col items-center gap-3">{children}</div>
    </Card>
  );
}

export function AiJobProgress({
  jobId,
  onDone,
  onRetry,
}: {
  jobId: string;
  onDone: () => void;
  onRetry: () => void;
}) {
  const job = useAiJob(jobId);
  const cancel = useCancelAiJob(jobId);
  const status = job.data?.status;

  const partialFailures = partialFailuresOf(job.data?.error);

  useEffect(() => {
    // Job xong trọn vẹn thì tự chuyển tiếp sau một nhịp ăn mừng. Job xong MỘT PHẦN thì không:
    // người dùng cần đọc xem phần nào thiếu rồi tự bấm đi tiếp.
    if (status === 'SUCCEEDED' && partialFailures.length === 0) {
      const t = setTimeout(onDone, 900);
      return () => clearTimeout(t);
    }
  }, [status, partialFailures.length, onDone]);

  if (job.isLoading) {
    return (
      <Panel>
        <Mascot state="thinking" size={88} />
        <p className="text-sm font-medium text-fg-subtle">Đang kiểm tra tiến trình…</p>
      </Panel>
    );
  }

  if (job.isError || !job.data) {
    return (
      <Panel>
        <Mascot state="alerting" size={88} />
        <p className="text-sm font-medium text-fg">
          {errorText(job.error, 'Không theo dõi được tiến trình.')}
        </p>
        <Button variant="secondary" onClick={onDone}>
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
        <Mascot state={queued ? 'thinking' : 'working'} size={96} />
        <p className="text-sm text-fg-subtle">Sinh bài học · {queued ? 'đang chờ' : 'đang chạy'}</p>
        <p className="text-base font-semibold text-fg">
          {queued ? 'Đang xếp hàng…' : (j.progressLabel ?? 'Đang xử lý…')}
        </p>
        <div className="w-full max-w-sm">
          <ProgressBar
            value={Math.max(4, j.progress)}
            label={`Tiến độ sinh bài học: ${j.progress}%`}
          />
          <p className="mt-1.5 text-xs font-semibold tabular-nums text-fg-subtle">{j.progress}%</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => cancel.mutate()}
          disabled={cancel.isPending}
        >
          {cancel.isPending ? 'Đang dừng…' : 'Dừng sinh bài'}
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
          <p className="text-sm font-semibold text-fg">
            Đã sinh xong, nhưng {partialFailures.length} phần không hoàn thành
          </p>
          <div className="w-full max-w-md text-left">
            <PartialNotice className="mb-3">
              Những phần dưới đây không sinh được bài học hợp lệ. Các bài còn lại đã sẵn sàng, bạn
              có thể học ngay, rồi chạy sinh lại để bổ sung phần thiếu.
            </PartialNotice>
            <ul className="space-y-1.5">
              {partialFailures.map((f) => (
                <li
                  key={f.node}
                  className="rounded-control border border-line bg-panel-2 px-3 py-2 text-xs"
                >
                  <span className="font-medium text-fg">{f.node}</span>
                  <span className="text-fg-subtle">: {failureReasonText(f.errors)}</span>
                </li>
              ))}
            </ul>
          </div>
          <Button onClick={onDone}>Xem bài học đã sinh</Button>
        </Panel>
      );
    }

    return (
      <Panel>
        <Mascot state="celebrate" size={96} />
        <p className="flex items-center gap-1.5 text-base font-semibold text-ok">
          <Icon name="circle-check" size={18} />
          Hoàn tất! Bài học đã sẵn sàng.
        </p>
      </Panel>
    );
  }

  // Huỷ là hành động chủ động của người dùng, không phải lỗi — nên không dùng
  // mascot cảnh báo cho trường hợp đó.
  const cancelled = j.status === 'CANCELLED';
  const duplicateOnly = isOnlyDuplicateFailure(j.error);
  const failureText = duplicateOnly
    ? 'Các bài vừa sinh đều trùng với bài đã có, nên không có bài mới. Hãy tải thêm tài liệu khác.'
    : 'AI chưa tạo được bài học đạt yêu cầu từ tài liệu này.';
  return (
    <Panel>
      <Mascot state={cancelled ? 'idle' : 'alerting'} size={88} />
      <p className="text-sm font-semibold text-fg">
        {cancelled ? 'Đã dừng sinh bài.' : 'Sinh bài học thất bại.'}
      </p>
      {!cancelled && <p className="max-w-sm text-xs text-fg-subtle">{failureText}</p>}
      <div className="flex flex-wrap justify-center gap-2">
        {!cancelled && !duplicateOnly && (
          <Button onClick={onRetry}>
            <Icon name="retry" size={16} />
            Thử lại (dùng 1 lượt AI)
          </Button>
        )}
        <Button variant="secondary" onClick={onDone}>
          Đóng
        </Button>
      </div>
    </Panel>
  );
}
