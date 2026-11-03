'use client';

import { useId, useState } from 'react';
import type { LessonSource } from '@learn/api-contracts';
import { Button, Icon, InlineError, LoadingState, cn } from '@/components/ui';
import { errorText } from '@/lib/api-client';
import { useLessonSources } from './learning-api';

export const SOURCES_ANCHOR = 'nguon-tai-lieu';

/**
 * Cảnh báo bài học bám nguồn kém (NFR-AI-02, FR-LESSON-07): dưới 50% thuật ngữ mẫu khớp tài
 * liệu gốc. Không được im lặng, và phải chỉ cách tự kiểm: dẫn thẳng tới khối Nguồn bên dưới.
 */
export function LowConfidenceNotice({ className }: { className?: string }) {
  return (
    <div
      role="note"
      className={cn(
        'flex items-start gap-3 rounded-card border border-warn-line bg-warn-soft px-4 py-3.5 text-sm leading-relaxed text-fg',
        className,
      )}
    >
      <Icon name="alert" size={18} className="mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="font-semibold">Bài này có thể lệch khỏi tài liệu của bạn</p>
        <p className="mt-0.5 text-fg-muted">
          Khi kiểm tra tự động, nhiều thuật ngữ trong bài không tìm thấy trong tài liệu gốc. Hãy đối
          chiếu với{' '}
          <a
            href={`#${SOURCES_ANCHOR}`}
            className="font-medium text-fg underline underline-offset-2"
          >
            đoạn tài liệu nguồn
          </a>{' '}
          trước khi dựa vào nội dung, hoặc sửa lại bài.
        </p>
      </div>
    </div>
  );
}

function pageLabel(s: LessonSource): string | null {
  if (s.pageFrom === null) return null;
  if (s.pageTo === null || s.pageTo === s.pageFrom) return `trang ${s.pageFrom}`;
  return `trang ${s.pageFrom} đến ${s.pageTo}`;
}

/**
 * Đoạn tài liệu gốc mà bài học dựa vào (FR-LESSON-12). Thu gọn mặc định và chỉ tải khi mở:
 * phần lớn người học không cần, và nội dung có thể dài.
 */
export function LessonSources({
  courseId,
  lessonId,
  defaultOpen = false,
}: {
  courseId: string;
  lessonId: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const sources = useLessonSources(courseId, lessonId, open);
  const list = sources.data?.sources ?? [];

  return (
    <section
      id={SOURCES_ANCHOR}
      aria-labelledby={`${panelId}-title`}
      className="mt-12 scroll-mt-24"
    >
      <div className="flex items-center justify-between gap-4 border-t border-line pt-6">
        <div className="min-w-0">
          <h2 id={`${panelId}-title`} className="text-base font-semibold text-fg">
            Nguồn trong tài liệu
          </h2>
          <p className="mt-0.5 text-sm text-fg-subtle">
            Những đoạn tài liệu gốc mà bài học này được soạn từ đó.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Thu gọn' : 'Xem nguồn'}
          <Icon name={open ? 'chevron-up' : 'chevron-down'} size={15} />
        </Button>
      </div>

      <div id={panelId} hidden={!open} className="mt-5">
        {open && sources.isLoading && (
          <LoadingState rows={2} variant="list" label="Đang tải đoạn tài liệu nguồn" />
        )}
        {open && sources.isError && (
          <InlineError>
            {errorText(sources.error, 'Không tải được tài liệu nguồn, vui lòng thử lại.')}
          </InlineError>
        )}
        {open && sources.data && list.length === 0 && (
          // Có thể xảy ra thật: tài liệu nguồn đã bị xoá khỏi khoá học sau khi sinh bài.
          <p className="rounded-control border border-dashed border-line px-4 py-3 text-sm text-fg-subtle">
            Không còn đoạn nguồn nào. Tài liệu gốc có thể đã bị xoá khỏi khóa học.
          </p>
        )}
        {list.length > 0 && (
          <ol className="space-y-4">
            {list.map((s) => {
              const page = pageLabel(s);
              return (
                <li key={s.chunkId} className="rounded-card border border-line bg-panel p-4">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fg-subtle">
                    <Icon name="file" size={14} className="shrink-0" />
                    <span className="font-medium text-fg">{s.filename}</span>
                    {page && <span>· {page}</span>}
                  </p>
                  {s.headingPath && (
                    <p className="mt-1 text-xs font-medium text-fg-muted">{s.headingPath}</p>
                  )}
                  <blockquote className="mt-3 whitespace-pre-line border-l-2 border-line-strong pl-3 text-sm leading-relaxed text-fg-muted">
                    {/* Dấu `#` là của bộ trích xuất (heading PDF/DOCX quy về Markdown), không
                        phải chữ trong tài liệu; tiêu đề mục đã hiện ở dòng trên. */}
                    {s.excerpt.replace(/^#{1,6}\s+/gm, '')}
                  </blockquote>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
