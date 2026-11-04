'use client';

import { use, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useLesson,
  useLessons,
  usePatchLesson,
  useDeleteLesson,
  useStartLesson,
} from '@/features/learning/learning-api';
import { LessonSources, LowConfidenceNotice } from '@/features/learning/lesson-sources';
import { renderMarkdown, type TocEntry } from '@/components/shared/markdown';
import { isEndReached } from '@/features/learning/reading-progress';
import {
  BackLink,
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Icon,
  InlineError,
  Input,
  Skeleton,
  Textarea,
  cn,
  type BadgeTone,
} from '@/components/ui';
import { errorDetail, errorText, isNotFoundError } from '@/lib/api-client';
import { usePageTitle } from '@/lib/use-page-title';
import { absoluteTime, relativeTime } from '@/lib/format';
import { humanizeCode } from '@/lib/humanize';

const STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: 'Chưa bắt đầu',
  IN_PROGRESS: 'Đang học',
  COMPLETED: 'Đã hoàn thành',
};

const STATUS_TONE: Record<string, BadgeTone> = {
  NOT_STARTED: 'neutral',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
};

/** Ràng buộc của `patchLessonSchema` trong `packages/contracts`. */
const TITLE_MIN = 5;

export default function LessonReadPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = use(params);
  const router = useRouter();
  const lesson = useLesson(courseId, lessonId);
  usePageTitle(lesson.data?.title ?? 'Bài học');
  // Cùng query key với màn khóa học nên thường đã có sẵn trong cache.
  const lessons = useLessons(courseId);
  const startLesson = useStartLesson(courseId, lessonId);
  const patchLesson = usePatchLesson(courseId, lessonId);
  const deleteLesson = useDeleteLesson(courseId);
  const startMutate = startLesson.mutate;

  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftSummary, setDraftSummary] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [saveError, setSaveError] = useState<unknown>(null);
  const [deleteError, setDeleteError] = useState<unknown>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  /** Đọc tới cuối bài mới mở bài tập; người đã làm bài rồi thì không phải đọc lại. */
  const endMarker = useRef<HTMLDivElement>(null);
  const [reachedEnd, setReachedEnd] = useState(false);

  useEffect(() => {
    const check = () => {
      const marker = endMarker.current;
      if (marker && isEndReached(marker.getBoundingClientRect().top, window.innerHeight)) {
        setReachedEnd(true);
      }
    };
    check();
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, [lesson.data, editing]);

  const titleTooShort = draftTitle.trim().length < TITLE_MIN;

  useEffect(() => {
    if (lesson.data && lesson.data.progress.status === 'NOT_STARTED') {
      startMutate();
    }
  }, [lesson.data?.id, lesson.data?.progress.status, startMutate]);

  const rendered = useMemo(
    () => (lesson.data ? renderMarkdown(lesson.data.contentMd) : null),
    [lesson.data],
  );

  /** Vị trí trong khóa + hai bài kề — màn này không được là ngõ cụt (NN/g H1, H3). */
  const position = useMemo(() => {
    const list = lessons.data?.lessons ?? [];
    const index = list.findIndex((l) => l.id === lessonId);
    if (index < 0) return null;
    return {
      index,
      total: list.length,
      prev: index > 0 ? list[index - 1] : undefined,
      next: index < list.length - 1 ? list[index + 1] : undefined,
    };
  }, [lessons.data, lessonId]);

  function startEditing() {
    if (!lesson.data) return;
    setDraftTitle(lesson.data.title);
    setDraftSummary(lesson.data.summary ?? '');
    setDraftContent(lesson.data.contentMd);
    setSaveError(null);
    setEditing(true);
  }

  async function saveEdit() {
    setSaveError(null);
    try {
      await patchLesson.mutateAsync({
        title: draftTitle,
        summary: draftSummary || null,
        contentMd: draftContent,
      });
      setEditing(false);
    } catch (err) {
      setSaveError(err);
    }
  }

  async function confirmDelete() {
    setDeleteError(null);
    try {
      await deleteLesson.mutateAsync(lessonId);
      router.push(`/courses/${courseId}`);
    } catch (err) {
      setDeleteError(err);
      setConfirmingDelete(false);
    }
  }

  if (lesson.isLoading) {
    return (
      <div className="mx-auto max-w-3xl" aria-busy="true" aria-live="polite">
        <span className="sr-only">Đang tải bài học</span>
        <Skeleton className="mb-6 h-5 w-24" />
        <Skeleton className="mb-3 h-4 w-28" />
        <Skeleton className="mb-3 h-10 w-3/4" />
        <Skeleton className="mb-8 h-5 w-1/2" />
        <Skeleton className="h-96 rounded-card" />
      </div>
    );
  }

  if (isNotFoundError(lesson.error)) {
    return (
      <>
        <h1 className="sr-only">Bài học</h1>
        <BackLink href={`/courses/${courseId}`} label="Về khóa học" />
        <EmptyState
          className="mt-6"
          title="Không tìm thấy bài học"
          description="Bài học này không tồn tại hoặc đã bị xoá."
        />
      </>
    );
  }

  if (lesson.isError || !lesson.data) {
    return (
      <>
        <h1 className="sr-only">Bài học</h1>
        <ErrorState
          title="Không tải được bài học"
          description={errorText(lesson.error, 'Vui lòng thử lại.')}
          detail={errorDetail(lesson.error)}
          onRetry={() => void lesson.refetch()}
        />
      </>
    );
  }

  const data = lesson.data;
  const status = data.progress.status;
  const showToc = Boolean(rendered && rendered.toc.length > 1 && !editing);

  return (
    <div
      className={cn(
        'mx-auto grid gap-10',
        showToc ? 'max-w-6xl xl:grid-cols-[minmax(0,1fr)_15rem]' : 'max-w-3xl',
      )}
    >
      <article className="min-w-0">
        <BackLink href={`/courses/${courseId}`} label="Về khóa học" />

        {/* ------------------------------------------------ đầu bài */}
        <header className="mt-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-fg-subtle">
              {position ? `Bài ${position.index + 1} / ${position.total}` : 'Bài học'}
            </span>
            <Badge
              tone={STATUS_TONE[status] ?? 'neutral'}
              icon={status === 'COMPLETED' ? 'check' : undefined}
            >
              {STATUS_LABEL[status] ?? humanizeCode(status)}
            </Badge>
          </div>
          <h1 className="mt-2 font-display text-[1.75rem] font-semibold leading-[1.15] text-fg sm:text-[2rem]">
            {data.title}
          </h1>
          {data.summary && !editing && (
            <p className="mt-3 text-xl leading-relaxed text-fg-subtle">{data.summary}</p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-line py-3 text-sm text-fg-subtle">
            {data.estimatedMinutes && (
              <span className="inline-flex items-center gap-1.5">
                <Icon name="clock" size={15} />
                Khoảng {data.estimatedMinutes} phút
              </span>
            )}
            {data.progress.bestScore !== null && (
              <span className="inline-flex items-center gap-1.5">
                <Icon name="star" size={15} />
                Điểm cao nhất {data.progress.bestScore}
              </span>
            )}
            {data.editedByUserAt && (
              <span
                className="inline-flex items-center gap-1.5"
                title={absoluteTime(data.editedByUserAt)}
              >
                <Icon name="edit" size={15} />
                Đã chỉnh sửa {relativeTime(data.editedByUserAt)}
              </span>
            )}

            {!editing && (
              <div className="ml-auto flex items-center gap-1">
                {!confirmingDelete ? (
                  <>
                    <Button variant="ghost" size="sm" onClick={startEditing}>
                      <Icon name="edit" size={15} />
                      Sửa
                    </Button>
                    {/* Hành động phá huỷ tách khỏi hành động lành tính và khác màu —
                        NN/g "Consequential Options Close to Benign Options". */}
                    <span aria-hidden className="mx-1 h-5 w-px bg-line" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-bad hover:bg-bad-soft hover:text-bad"
                      onClick={() => setConfirmingDelete(true)}
                    >
                      <Icon name="trash" size={15} />
                      Xoá
                    </Button>
                  </>
                ) : (
                  <div
                    className="flex flex-wrap items-center gap-2"
                    role="group"
                    aria-label="Xác nhận xoá"
                  >
                    <span className="text-sm font-semibold text-fg">Xoá bài học này?</span>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => void confirmDelete()}
                      loading={deleteLesson.isPending}
                    >
                      {deleteLesson.isPending ? 'Đang xoá…' : 'Xác nhận xoá'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmingDelete(false)}
                      disabled={deleteLesson.isPending}
                    >
                      Huỷ
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {data.confidence === 'LOW' && !editing && <LowConfidenceNotice className="mt-6" />}

        {Boolean(deleteError) && (
          <InlineError className="mt-4">
            {errorText(deleteError, 'Không xoá được, vui lòng thử lại.')}
          </InlineError>
        )}

        {/* ------------------------------------------------- nội dung */}
        {editing ? (
          <Card className="mt-6 space-y-5">
            <div>
              <Field label="Tiêu đề" htmlFor="edit-title">
                <Input
                  id="edit-title"
                  type="text"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  aria-describedby="edit-title-rule"
                  invalid={titleTooShort}
                />
              </Field>
              {/* Quy tắc luôn hiển thị; nút Lưu trỏ vào đây bằng `aria-describedby`. */}
              <p
                id="edit-title-rule"
                className={cn(
                  'mt-1.5 text-xs',
                  titleTooShort ? 'font-semibold text-bad' : 'text-fg-subtle',
                )}
              >
                Tiêu đề cần ít nhất {TITLE_MIN} ký tự.
              </p>
            </div>
            <Field label="Tóm tắt" htmlFor="edit-summary">
              <Input
                id="edit-summary"
                type="text"
                value={draftSummary}
                onChange={(e) => setDraftSummary(e.target.value)}
              />
            </Field>
            <Field label="Nội dung (Markdown)" htmlFor="edit-content">
              <Textarea
                id="edit-content"
                rows={18}
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                className="font-mono text-[0.8125rem]"
              />
            </Field>
            {Boolean(saveError) && (
              <InlineError>{errorText(saveError, 'Không lưu được, vui lòng thử lại.')}</InlineError>
            )}
            <div className="flex justify-end gap-2 border-t border-line pt-5">
              <Button
                variant="ghost"
                onClick={() => setEditing(false)}
                disabled={patchLesson.isPending}
              >
                Huỷ
              </Button>
              <Button
                onClick={() => void saveEdit()}
                loading={patchLesson.isPending}
                disabled={titleTooShort}
                aria-describedby={titleTooShort ? 'edit-title-rule' : undefined}
              >
                {patchLesson.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
              </Button>
            </div>
          </Card>
        ) : (
          <div
            className="lesson-content mt-8 max-w-[72ch]"
            dangerouslySetInnerHTML={{ __html: rendered?.html ?? '' }}
          />
        )}

        {!editing && data.sourceChunkIds.length > 0 && (
          // Bài LOW mở sẵn: cảnh báo phía trên dẫn xuống đây, người học không phải bấm thêm.
          <LessonSources
            key={lessonId}
            courseId={courseId}
            lessonId={lessonId}
            defaultOpen={data.confidence === 'LOW'}
          />
        )}

        <div ref={endMarker} aria-hidden="true" />

        {/* --------------------------------- thanh hành động dính đáy */}
        {!editing && (
          <div className="sticky bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] z-10 mt-12 lg:bottom-4">
            <div className="flex items-center gap-2 rounded-card border border-line bg-panel p-2 shadow-overlay">
              {position?.prev ? (
                <ButtonLink
                  href={`/courses/${courseId}/lessons/${position.prev.id}`}
                  variant="ghost"
                  size="sm"
                  className="min-w-0 max-w-[40%]"
                  aria-label={`Bài trước: ${position.prev.title}`}
                >
                  <Icon name="arrow-left" size={16} />
                  <span className="hidden truncate sm:inline">{position.prev.title}</span>
                </ButtonLink>
              ) : (
                <span />
              )}

              <div className="ml-auto flex min-w-0 items-center gap-2">
                {position?.next && (
                  <ButtonLink
                    href={`/courses/${courseId}/lessons/${position.next.id}`}
                    variant="secondary"
                    size="sm"
                    className="hidden min-w-0 max-w-[16rem] md:inline-flex"
                    aria-label={`Bài sau: ${position.next.title}`}
                  >
                    <span className="truncate">{position.next.title}</span>
                    <Icon name="arrow-right" size={16} />
                  </ButtonLink>
                )}
                {reachedEnd || data.progress.bestScore !== null ? (
                  <ButtonLink href={`/courses/${courseId}/lessons/${lessonId}/practice`}>
                    <Icon name="target" size={17} />
                    Làm bài tập
                  </ButtonLink>
                ) : (
                  <p className="whitespace-nowrap px-3 text-sm font-medium text-fg-subtle" role="status">
                    Đọc hết bài để làm bài tập
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </article>

      {/* ------------------------------------------------------- mục lục */}
      {showToc && rendered && <TableOfContents toc={rendered.toc} />}
    </div>
  );
}

/**
 * Mục lục dính, đánh dấu mục đang đọc. Đánh dấu chỉ là gợi ý thêm — nếu
 * `IntersectionObserver` không bắn (tab nền, xem UI-GUIDE §4) thì mục lục vẫn là một
 * danh sách link dùng được bình thường.
 */
function TableOfContents({ toc }: { toc: TocEntry[] }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const targets = toc
      .map((t) => document.getElementById(t.id))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-80px 0px -70% 0px' },
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [toc]);

  return (
    <nav className="hidden xl:block" aria-label="Mục lục">
      <div className="sticky top-24">
        <p className="mb-3 text-xs font-medium text-fg-subtle">Trong bài này</p>
        <ul className="space-y-0.5 border-l border-line text-sm">
          {toc.map((entry) => (
            <li key={entry.id}>
              <a
                href={`#${entry.id}`}
                aria-current={active === entry.id ? 'location' : undefined}
                className={cn(
                  '-ml-px block border-l-2 py-1.5 pr-2 leading-snug transition-colors duration-200 focus-ring-tight',
                  active === entry.id
                    ? 'border-fg font-semibold text-fg'
                    : 'border-transparent text-fg-subtle hover:border-line-strong hover:text-fg',
                )}
                style={{ paddingLeft: `${0.75 + (entry.depth - 1) * 0.75}rem` }}
              >
                {entry.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
