'use client';

import { UserText } from '@/components/ui/user-text';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Button, Icon, cn } from '@/components/ui';
import { renderMarkdown } from '@/components/shared/markdown';
import { useLesson, useLessons } from '@/features/learning/learning-api';

const DESKTOP = '(min-width: 1024px)';

/**
 * Màn làm bài: tài liệu bên trái, bài tập bên phải, người học ẩn được tài liệu. Mỗi lần vào đều
 * mở lại kiểu chia đôi. Màn hẹp không đủ chỗ nên mặc định ẩn, bấm để mở phía trên bài tập.
 */
export function LessonSplit({
  courseId,
  courseTitle,
  lessonId,
  children,
}: {
  courseId: string;
  courseTitle?: string;
  lessonId: string;
  children: React.ReactNode;
}) {
  const lesson = useLesson(courseId, lessonId);
  const lessons = useLessons(courseId);
  const list = lessons.data?.lessons ?? [];
  const position = list.findIndex((l) => l.id === lessonId);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(window.matchMedia(DESKTOP).matches);
  }, []);

  const html = useMemo(
    () => (lesson.data ? renderMarkdown(lesson.data.contentMd).html : ''),
    [lesson.data],
  );

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <nav
          aria-label="Đường dẫn"
          className="flex min-w-0 flex-1 items-center gap-1.5 text-sm text-fg-subtle"
        >
          <Link
            href="/courses"
            className="hidden shrink-0 whitespace-nowrap rounded-sm hover:text-fg focus-ring sm:inline"
          >
            Khóa học
          </Link>
          <Icon name="chevron-right" size={14} className="hidden shrink-0 sm:block" />
          <Link
            href={`/courses/${courseId}`}
            className="min-w-0 max-w-[45%] truncate rounded-sm hover:text-fg focus-ring"
          >
            <UserText>{courseTitle ?? 'Khóa học'}</UserText>
          </Link>
          <Icon name="chevron-right" size={14} className="shrink-0" />
          <Link
            href={`/courses/${courseId}/lessons/${lessonId}`}
            aria-current="page"
            className="min-w-0 truncate rounded-sm font-medium text-fg hover:underline focus-ring"
          >
            <UserText>{lesson.data?.title ?? 'Bài học'}</UserText>
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {position >= 0 && (
            <span className="rounded-lg bg-block-ink px-2.5 py-0.5 text-xs font-medium text-white">
              Bài {position + 1} / {list.length}
            </span>
          )}
          {!open && (
            <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
              <Icon name="file" size={15} />
              Xem tài liệu
            </Button>
          )}
        </div>
      </div>

      <div className={cn('lg:grid lg:gap-8', open ? 'lg:grid-cols-[2fr_3fr]' : 'lg:grid-cols-1')}>
        {open && (
          <aside
            aria-label="Tài liệu bài học"
            className="mb-6 flex max-h-[45dvh] flex-col overflow-hidden rounded-card border border-line bg-panel lg:sticky lg:top-20 lg:mb-0 lg:h-[calc(100dvh-6.5rem)] lg:max-h-none"
          >
            <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
              <p className="truncate text-sm font-semibold text-fg">
                {lesson.data?.title ?? 'Tài liệu bài học'}
              </p>
              <Button variant="soft" size="sm" onClick={() => setOpen(false)}>
                <Icon name="x" size={15} />
                Ẩn tài liệu
              </Button>
            </div>
            <div
              className="lesson-content min-h-0 flex-1 overflow-y-auto px-5 py-4 outline-none focus-ring"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </aside>
        )}
        <div className="min-w-0">{children}</div>
      </div>
    </>
  );
}
