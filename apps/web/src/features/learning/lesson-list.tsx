'use client';

import Link from 'next/link';
import type { LessonSummary } from '@learn/contracts';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/components/ui/cn';

/**
 * Lộ trình bài học dạng stepper dọc — ADR 012, thay đồ thị hình sin (`lesson-path.tsx`).
 *
 * Vì sao đổi: đồ thị sin tốn 118px chiều cao cho mỗi bài (khóa 10 bài ≈ 1.2k px), tiêu đề
 * bị kẹp 2 dòng trong phần nửa bề ngang còn lại, và nút sắp xếp chỉ hiện khi rê chuột —
 * trên cảm ứng coi như không có. Ở đây mỗi bài là một hàng ~64px, tiêu đề đủ chỗ, nút
 * lên/xuống luôn hiện.
 *
 * Giữ lại điều đúng của bản cũ: đường nối giữa các bài **mang thông tin** — nét liền sky
 * khi bài phía trên đã xong, nét đứt khi chưa — và trạng thái luôn có icon + chữ, không
 * chỉ màu (UI-GUIDE §2).
 */
type NodeState = 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED';

const STATE_LABEL: Record<NodeState, string> = {
  COMPLETED: 'Đã hoàn thành',
  IN_PROGRESS: 'Đang học',
  NOT_STARTED: 'Chưa bắt đầu',
};

function Marker({ state, index }: { state: NodeState; index: number }) {
  if (state === 'COMPLETED') {
    return (
      // Icon CheckCircle (Fill) tự nó là hình tròn — không bọc thêm ô nền (ADR 014).
      <Icon name="circle-check" size={32} filled className="text-accent" />
    );
  }
  return (
    <span
      className={cn(
        'grid size-8 place-items-center rounded-full border-2 text-[0.8125rem] font-semibold tabular-nums',
        state === 'IN_PROGRESS'
          ? 'border-fg bg-panel text-accent'
          : 'border-line-strong bg-panel text-fg-subtle',
      )}
    >
      {index + 1}
    </span>
  );
}

export function LessonList({
  lessons,
  courseId,
  onMove,
  reordering,
}: {
  lessons: LessonSummary[];
  courseId: string;
  onMove: (index: number, direction: -1 | 1) => void;
  reordering: boolean;
}) {
  return (
    <ol className="relative">
      {lessons.map((lesson, i) => {
        const state = lesson.progressStatus as NodeState;
        const last = i === lessons.length - 1;
        const travelled = state === 'COMPLETED';
        return (
          <li key={lesson.id} className="group relative flex gap-4">
            {/* cột mốc + đường nối tới bài sau */}
            <div className="relative flex w-8 shrink-0 flex-col items-center pt-4">
              <Marker state={state} index={i} />
              {!last && (
                <span
                  aria-hidden
                  className={cn(
                    'mt-1 w-0 flex-1 border-l-2',
                    travelled ? 'border-fg' : 'border-dashed border-line-strong',
                  )}
                />
              )}
            </div>

            <div
              className={cn(
                'relative mb-1 flex min-w-0 flex-1 items-center gap-2 rounded-control px-3 py-3 transition-colors duration-150',
                'hover:bg-muted has-[a:focus-visible]:bg-muted',
                state === 'IN_PROGRESS' && 'bg-accent-soft hover:bg-accent-soft',
              )}
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={`/courses/${courseId}/lessons/${lesson.id}`}
                  className="rounded-sm text-[0.9375rem] font-medium leading-snug text-fg outline-none after:absolute after:inset-0 after:rounded-control focus-visible:underline"
                >
                  {lesson.title}
                </Link>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[0.8125rem] text-fg-subtle">
                  <span className={cn(state === 'IN_PROGRESS' && 'font-medium text-accent')}>
                    {STATE_LABEL[state]}
                  </span>
                  {lesson.bestScore !== null && (
                    <>
                      <span aria-hidden>·</span>
                      <span className="tabular-nums">{lesson.bestScore} điểm</span>
                    </>
                  )}
                  {lesson.exerciseCount > 1 && (
                    <span className="tabular-nums">({lesson.exerciseCount} bài tập)</span>
                  )}
                  {lesson.confidence === 'LOW' && (
                    // NFR-AI-02: bài lệch nguồn phải lộ ra ngay ở danh sách, không chỉ khi mở bài.
                    <span className="inline-flex items-center gap-1 font-medium text-fg">
                      <Icon name="alert" size={13} />
                      Cần kiểm tra
                    </span>
                  )}
                </p>
              </div>

              {/* Sắp xếp lại — C-02. `relative z-10` để nằm trên vùng bấm của link. */}
              <div className="relative z-10 flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => onMove(i, -1)}
                  disabled={i === 0 || reordering}
                  aria-label={`Chuyển "${lesson.title}" lên trên`}
                  className="grid size-8 cursor-pointer place-items-center rounded-md text-fg-subtle hover:bg-panel hover:text-fg disabled:pointer-events-none disabled:opacity-30 focus-ring-tight"
                >
                  <Icon name="chevron-up" size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => onMove(i, 1)}
                  disabled={last || reordering}
                  aria-label={`Chuyển "${lesson.title}" xuống dưới`}
                  className="grid size-8 cursor-pointer place-items-center rounded-md text-fg-subtle hover:bg-panel hover:text-fg disabled:pointer-events-none disabled:opacity-30 focus-ring-tight"
                >
                  <Icon name="chevron-down" size={16} />
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
