'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useLesson,
  useLessons,
  usePatchLesson,
  useDeleteLesson,
  useStartLesson,
} from '@/lib/learning-api';
import { renderMarkdown } from '@/components/markdown';
import { Badge, Button, ButtonLink, Card, Icon, cn } from '@/components/ui';
import { ErrorState, InlineError, LoadingState } from '@/components/ui/states';
import type { BadgeTone } from '@/components/ui';
import { errorText } from '@/lib/api-client';
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

const FIELD =
  'w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-ink-900 ' +
  'outline-none focus:border-sky-500 focus-ring-tight';

export default function LessonReadPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = use(params);
  const router = useRouter();
  const lesson = useLesson(courseId, lessonId);
  // Danh sách bài của khóa — dùng để biết đang ở bài thứ mấy và đi tiếp đi lùi.
  // Cùng query key với màn chi tiết khóa học nên thường đã nằm sẵn trong cache,
  // không phát sinh request mới khi người học vào từ lộ trình.
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

  /**
   * Vị trí trong khóa + hai bài kề.
   *
   * Trước đây màn này là ngõ cụt: học xong không có đường sang bài kế, phải quay
   * lại lộ trình rồi tự tìm. Người học cũng không biết mình đang ở bài thứ mấy
   * trên tổng bao nhiêu (NN/g — "visibility of system status").
   */
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

  if (lesson.isLoading) return <LoadingState rows={2} label="Đang tải bài học" />;

  if (lesson.isError || !lesson.data) {
    return (
      <ErrorState
        title="Không tải được bài học"
        description={errorText(lesson.error, 'Vui lòng thử lại.')}
        onRetry={() => void lesson.refetch()}
      />
    );
  }

  const data = lesson.data;
  const status = data.progress.status;

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_200px]">
      <section className="min-w-0">
        <Link
          href={`/courses/${courseId}`}
          className="inline-flex items-center gap-1 rounded-md text-sm font-bold text-ink-500 hover:text-ink-900"
        >
          <Icon name="chevron-right" size={15} className="rotate-180" />
          Khóa học
        </Link>

        {/* ------------------------------------------------ banner bài học */}
        <div className="mt-3 rounded-card border-b-[6px] border-navy-900 bg-navy-800 px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-sky-500">
                {position ? `Bài ${position.index + 1}/${position.total}` : 'Bài học'}
              </p>
              <h1 className="mt-1 text-2xl font-bold text-white">{data.title}</h1>
              {data.summary && !editing && (
                <p className="mt-1.5 max-w-2xl text-sm text-ink-300">{data.summary}</p>
              )}
            </div>
            <Badge
              tone={STATUS_TONE[status] ?? 'neutral'}
              icon={status === 'COMPLETED' ? 'check' : undefined}
            >
              {STATUS_LABEL[status] ?? humanizeCode(status)}
            </Badge>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-300">
            {data.estimatedMinutes && <span>Khoảng {data.estimatedMinutes} phút</span>}
            {data.progress.bestScore !== null && (
              <span>Điểm cao nhất {data.progress.bestScore}</span>
            )}
            {data.editedByUserAt && (
              <span title={absoluteTime(data.editedByUserAt)}>
                Đã chỉnh sửa {relativeTime(data.editedByUserAt)}
              </span>
            )}
          </div>
        </div>

        {/* --------------------------------------------------- hành động */}
        {!editing && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {!confirmingDelete ? (
              <>
                <Button variant="secondary" size="sm" onClick={startEditing}>
                  <Icon name="edit" size={16} />
                  Sửa bài học
                </Button>
                {/* Xoá là hành động không hoàn tác được, nên nó KHÔNG đứng sát nút
                    Sửa nữa: `ml-auto` đẩy nó sang mép phải, và nó mang màu danger
                    thay vì `ghost`. Đặt hai thứ khác hẳn hậu quả cạnh nhau, cùng
                    trọng lượng thị giác, là cách chắc chắn nhất để người dùng bấm
                    nhầm — xem NN/g, "Dangerous UX: Consequential Options Close to
                    Benign Options". Bước xác nhận bên dưới vẫn giữ nguyên. */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-danger-700 hover:bg-danger-50"
                  onClick={() => setConfirmingDelete(true)}
                >
                  <Icon name="trash" size={16} />
                  Xoá bài học
                </Button>
              </>
            ) : (
              <>
                <span className="text-sm font-medium text-ink-700">Xoá bài học này?</span>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => void confirmDelete()}
                  disabled={deleteLesson.isPending}
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
              </>
            )}
          </div>
        )}

        {Boolean(deleteError) && (
          <InlineError className="mt-3">
            {errorText(deleteError, 'Không xoá được, vui lòng thử lại.')}
          </InlineError>
        )}

        {/* ------------------------------------------------- nội dung */}
        {editing ? (
          <Card className="mt-5 space-y-4">
            <div>
              <label htmlFor="edit-title" className="mb-1.5 block text-xs font-bold text-ink-700">
                Tiêu đề
              </label>
              <input
                id="edit-title"
                type="text"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                aria-describedby="edit-title-rule"
                aria-invalid={titleTooShort ? true : undefined}
                className={FIELD}
              />
              {/* Điều kiện đúng hiện ngay cạnh ô, không chờ tới lúc bấm Lưu mới
                  báo — và nút "Lưu thay đổi" trỏ vào chính dòng này bằng
                  `aria-describedby`, để nút xám không còn câm. */}
              <p
                id="edit-title-rule"
                className={cn(
                  'mt-1.5 text-xs',
                  titleTooShort ? 'font-medium text-danger-700' : 'text-ink-500',
                )}
              >
                Tiêu đề cần ít nhất {TITLE_MIN} ký tự.
              </p>
            </div>
            <div>
              <label htmlFor="edit-summary" className="mb-1.5 block text-xs font-bold text-ink-700">
                Tóm tắt
              </label>
              <input
                id="edit-summary"
                type="text"
                value={draftSummary}
                onChange={(e) => setDraftSummary(e.target.value)}
                className={FIELD}
              />
            </div>
            <div>
              <label htmlFor="edit-content" className="mb-1.5 block text-xs font-bold text-ink-700">
                Nội dung (Markdown)
              </label>
              <textarea
                id="edit-content"
                rows={16}
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                className={`${FIELD} font-mono text-xs`}
              />
            </div>
            {Boolean(saveError) && (
              <InlineError>{errorText(saveError, 'Không lưu được, vui lòng thử lại.')}</InlineError>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setEditing(false)}
                disabled={patchLesson.isPending}
              >
                Huỷ
              </Button>
              <Button
                onClick={() => void saveEdit()}
                disabled={patchLesson.isPending || titleTooShort}
                aria-describedby={titleTooShort ? 'edit-title-rule' : undefined}
              >
                {patchLesson.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="mt-5 p-6">
            <div
              className="lesson-content text-sm leading-relaxed text-ink-900"
              dangerouslySetInnerHTML={{ __html: rendered?.html ?? '' }}
            />
          </Card>
        )}

        {/* --------------------------------- thanh hành động dính đáy */}
        {!editing && (
          <div className="sticky bottom-0 z-10 -mx-4 mt-6 border-t-2 border-surface-300 bg-surface-100/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
            <div className="flex items-center gap-2">
              {/* Điều hướng trong khóa. Nhãn mang tên bài thật chứ không phải
                  "Trước/Sau" trống nghĩa, để biết mình sắp đi đâu trước khi bấm. */}
              {position?.prev ? (
                <ButtonLink
                  href={`/courses/${courseId}/lessons/${position.prev.id}`}
                  variant="secondary"
                  size="sm"
                  className="max-w-[40%]"
                >
                  <Icon name="arrow-left" size={16} strokeWidth={2.5} />
                  <span className="truncate">{position.prev.title}</span>
                </ButtonLink>
              ) : (
                // Bài đầu tiên không có bài trước — dùng chỗ trống đó cho lời
                // nhắc thay vì để thanh lệch hẳn sang một bên.
                <p className="hidden text-sm font-medium text-ink-500 sm:block">
                  Sẵn sàng kiểm tra lại những gì vừa đọc?
                </p>
              )}

              <div className="ml-auto flex items-center gap-2">
                {position?.next && (
                  <ButtonLink
                    href={`/courses/${courseId}/lessons/${position.next.id}`}
                    variant="secondary"
                    size="sm"
                    className="hidden max-w-[220px] sm:inline-flex"
                  >
                    <span className="truncate">{position.next.title}</span>
                    <Icon name="arrow-right" size={16} strokeWidth={2.5} />
                  </ButtonLink>
                )}
                <ButtonLink href={`/courses/${courseId}/lessons/${lessonId}/practice`}>
                  Làm bài tập
                  <Icon name="chevron-right" size={18} strokeWidth={3} />
                </ButtonLink>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ------------------------------------------------------- mục lục */}
      {rendered && rendered.toc.length > 1 && (
        <nav className="hidden xl:block" aria-label="Mục lục">
          <div className="sticky top-24">
            <p className="mb-2 text-xs font-medium text-ink-500">Mục lục</p>
            <ul className="space-y-1 border-l-2 border-surface-300 text-sm">
              {rendered.toc.map((entry) => (
                <li key={entry.id} style={{ paddingLeft: `${(entry.depth - 1) * 0.75}rem` }}>
                  <a
                    href={`#${entry.id}`}
                    className="-ml-0.5 block border-l-2 border-transparent py-1 pl-2.5 text-ink-500 hover:border-sky-500 hover:text-sky-700"
                  >
                    {entry.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      )}
    </div>
  );
}
