'use client';

import { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DOCUMENT_ACCEPT, type DocumentList } from '@learn/api-contracts';
import { useCourse, useCourseDocuments, useDeleteCourse } from '@/features/courses/courses-api';
import {
  useDeleteDocument,
  useUploadDocument,
  type UploadProgress,
} from '@/features/documents/documents-api';
import { UploadCancelledError } from '@/features/documents/upload-transfer';
import { useLessons, useReorderLessons } from '@/features/learning/learning-api';
import { useCourseJobs, useFinishAiJob, useGenerateLessons } from '@/features/ai/ai-api';
import { failureReasonText } from '@/features/ai/ai-job-outcome';
import { partialFailuresOf } from '@/features/ai/ai-job-partial';
import { AiJobProgress } from '@/features/ai/ai-job-progress';
import { LessonList } from '@/features/learning/lesson-list';
import { QuotaNotice } from '@/components/shared/quota-notice';
import { ColorBlock } from '@/components/shared/color-block';
import { Mascot } from '@/components/shared/mascot';
import {
  BackLink,
  Badge,
  Button,
  ButtonLink,
  EmptyState,
  ErrorState,
  Icon,
  InlineError,
  LoadingState,
  PartialNotice,
  ProgressBar,
  SectionTitle,
  Skeleton,
  cn,
} from '@/components/ui';
import { errorDetail, errorText, isNotFoundError, isQuotaExceededError } from '@/lib/api-client';
import { relativeTime } from '@/lib/format';
import { formatFileSize } from '@/lib/format-size';
import { usePageTitle } from '@/lib/use-page-title';
import { humanizeCode } from '@/lib/humanize';

const DOC_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ tải lên',
  UPLOADED: 'Đã tải lên',
  EXTRACTING: 'Đang đọc',
  EXTRACTED: 'Sẵn sàng',
  FAILED: 'Lỗi',
};

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'EASY', label: 'Bài tập dễ' },
  { value: 'MEDIUM', label: 'Bài tập vừa' },
  { value: 'HARD', label: 'Bài tập khó' },
];

function docTone(status: string) {
  if (status === 'FAILED') return 'danger' as const;
  if (status === 'EXTRACTED') return 'success' as const;
  if (status === 'EXTRACTING') return 'info' as const;
  return 'neutral' as const;
}

export default function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const course = useCourse(courseId);
  const documents = useCourseDocuments(courseId);
  const upload = useUploadDocument(courseId);
  const lessons = useLessons(courseId);
  const generateLessons = useGenerateLessons(courseId);
  const courseJobs = useCourseJobs(courseId);
  const finishAiJob = useFinishAiJob(courseId);
  const deleteCourse = useDeleteCourse(courseId);
  const router = useRouter();
  usePageTitle(course.data?.title ?? 'Khóa học');
  const reorderLessons = useReorderLessons(courseId);

  const [uploadError, setUploadError] = useState<unknown>(null);
  const [startedJobId, setStartedJobId] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<unknown>(null);
  const [reorderError, setReorderError] = useState<unknown>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');

  const [confirmingGenerate, setConfirmingGenerate] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<unknown>(null);
  /** Lưu phần bỏ chọn thay vì phần được chọn, để tài liệu mới tải lên tự được tính. */
  const [excludedDocIds, setExcludedDocIds] = useState<ReadonlySet<string>>(new Set());

  const activeJobId = startedJobId ?? courseJobs.data?.active?.id ?? null;
  const lastPartial = courseJobs.data?.lastPartial ?? null;
  const extractedDocs = documents.data?.documents.filter((d) => d.status === 'EXTRACTED') ?? [];
  const selectedDocIds = extractedDocs.filter((d) => !excludedDocIds.has(d.id)).map((d) => d.id);
  const hasExtractedDoc = extractedDocs.length > 0;
  const hasSelectedDoc = selectedDocIds.length > 0;
  const lessonList = lessons.data?.lessons ?? [];
  const completedCount = lessonList.filter((l) => l.progressStatus === 'COMPLETED').length;

  async function moveLesson(index: number, direction: -1 | 1) {
    const current = lessons.data?.lessons;
    if (!current) return;
    const target = index + direction;
    if (target < 0 || target >= current.length) return;
    const reordered = [...current];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(target, 0, moved!);
    setReorderError(null);
    try {
      await reorderLessons.mutateAsync(reordered.map((l) => l.id));
    } catch (err) {
      setReorderError(err);
    }
  }

  function toggleDoc(documentId: string) {
    setExcludedDocIds((prev) => {
      const next = new Set(prev);
      if (!next.delete(documentId)) next.add(documentId);
      return next;
    });
  }

  async function handleDeleteCourse() {
    setDeleteError(null);
    try {
      await deleteCourse.mutateAsync();
      router.replace('/courses');
    } catch (err) {
      setDeleteError(err);
    }
  }

  /** Đã có bài thì sinh thêm tốn một lượt và có thể chỉ ra bài trùng, nên phải hỏi trước. */
  function requestGenerate() {
    setUploadError(null);
    setGenerateError(null);
    if (lessonList.length > 0) setConfirmingGenerate(true);
    else void handleGenerate();
  }

  async function handleGenerate() {
    setConfirmingGenerate(false);
    setGenerateError(null);
    try {
      const job = await generateLessons.mutateAsync({
        difficulty,
        ...(excludedDocIds.size > 0 ? { documentIds: selectedDocIds } : {}),
      });
      setStartedJobId(job.id);
    } catch (err) {
      setGenerateError(err);
    }
  }

  function handleJobDone() {
    setStartedJobId(null);
    void finishAiJob();
  }

  function handleRetry() {
    setStartedJobId(null);
    void finishAiJob();
    void handleGenerate();
  }

  async function handleFile(file: File) {
    setUploadError(null);
    setGenerateError(null);
    try {
      await upload.mutateAsync(file);
    } catch (err) {
      if (!(err instanceof UploadCancelledError)) setUploadError(err);
    }
  }

  if (course.isLoading) {
    return (
      <div aria-busy="true" aria-live="polite">
        <span className="sr-only">Đang tải khóa học</span>
        <Skeleton className="mb-6 h-5 w-24" />
        <Skeleton className="h-60 w-full rounded-panel" />
        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <Skeleton className="h-96 rounded-card" />
          <Skeleton className="h-64 rounded-card" />
        </div>
      </div>
    );
  }

  if (isNotFoundError(course.error)) {
    return (
      <>
        <h1 className="sr-only">Khóa học</h1>
        <BackLink href="/courses" label="Khóa học" />
        <EmptyState
          className="mt-6"
          title="Không tìm thấy khóa học"
          description="Khóa học này không tồn tại, đã bị xoá hoặc không thuộc tài khoản của bạn."
        />
      </>
    );
  }

  if (course.isError || !course.data) {
    return (
      <>
        <h1 className="sr-only">Khóa học</h1>
        <ErrorState
          title="Không tải được khóa học"
          description={errorText(course.error, 'Vui lòng thử lại sau ít phút.')}
          detail={errorDetail(course.error)}
          onRetry={() => void course.refetch()}
        />
      </>
    );
  }

  /**
   * Bài mà nút chính sẽ mở: đang học dở → chưa bắt đầu đầu tiên → bài đầu tiên (xem lại).
   * Nhãn bám trạng thái thật của bài sắp mở.
   */
  const resumeLesson =
    lessonList.find((l) => l.progressStatus === 'IN_PROGRESS') ??
    lessonList.find((l) => l.progressStatus === 'NOT_STARTED') ??
    lessonList[0];
  const allDone = completedCount === lessonList.length && lessonList.length > 0;
  const resumeLabel = allDone
    ? 'Xem lại'
    : resumeLesson?.progressStatus === 'NOT_STARTED' && completedCount === 0
      ? 'Bắt đầu học'
      : 'Tiếp tục học';
  const docCount = documents.data?.documents.length ?? 0;

  return (
    <>
      <BackLink href="/courses" label="Khóa học" />

      {/* ------------------------------------------------ đầu trang */}
      <ColorBlock tone="amber" softOnDesktop className="mt-4 flex items-center gap-4 p-6">
        <header className="min-w-0 flex-1">
          <h1 className="pr-20 font-display text-[1.75rem] font-bold leading-tight md:pr-0 md:text-[2rem]">
            {course.data.title}
          </h1>
          {course.data.description && (
            <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed md:text-fg-subtle">
              {course.data.description}
            </p>
          )}
          {/* Điện thoại: các viên trong khối màu. Website: nút chính và một dòng số liệu. */}
          <div className="mt-5 flex flex-wrap items-center gap-2 md:hidden">
            {resumeLesson && (
              <Link
                href={`/courses/${courseId}/lessons/${resumeLesson.id}`}
                className="inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-pill bg-block-ink px-5 text-sm font-semibold text-white focus-ring"
              >
                {resumeLabel}
                <Icon name="arrow-right" size={16} />
              </Link>
            )}
            <span className="inline-flex h-11 items-center rounded-pill bg-white/45 px-5 text-sm font-semibold tabular-nums">
              {completedCount}/{lessonList.length} bài
            </span>
            <span className="inline-flex h-11 items-center rounded-pill bg-white/45 px-5 text-sm font-semibold tabular-nums">
              {docCount} tài liệu
            </span>
          </div>
          <div className="mt-3 hidden flex-wrap items-center gap-x-5 gap-y-2 md:flex">
            {resumeLesson && (
              <ButtonLink href={`/courses/${courseId}/lessons/${resumeLesson.id}`}>
                {resumeLabel}
                <Icon name="arrow-right" size={16} />
              </ButtonLink>
            )}
            <p className="text-sm text-fg-subtle">
              <span className="tabular-nums">
                {completedCount}/{lessonList.length}
              </span>{' '}
              bài · <span className="tabular-nums">{docCount}</span> tài liệu
              {resumeLesson && (
                <>
                  {' · '}
                  {allDone ? 'Mở lại: ' : 'Tiếp theo: '}
                  <span className="font-medium text-fg">{resumeLesson.title}</span>
                </>
              )}
            </p>
          </div>
          {resumeLesson && (
            <p className="mt-3 truncate text-sm md:hidden">
              {allDone ? 'Mở lại: ' : 'Tiếp theo: '}
              <span className="font-semibold">{resumeLesson.title}</span>
            </p>
          )}
        </header>
        <Mascot
          state={allDone ? 'proud' : 'idle'}
          size={72}
          surface="color-on-phone"
          priority="companion"
          className="absolute right-4 top-4 md:static"
        />
      </ColorBlock>

      {lastPartial && !activeJobId && (
        <PartialJobNotice
          key={lastPartial.id}
          jobId={lastPartial.id}
          failures={partialFailuresOf(lastPartial.error)}
        />
      )}

      <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14">
        {/* ----------------------------------------------------- lộ trình */}
        <section aria-labelledby="path-title" className="min-w-0">
          <SectionTitle
            id="path-title"
            action={
              <div className="flex items-center gap-2">
                {/* Độ khó bài tập AI sẽ soạn (đi vào prompt `lesson@3`). */}
                <label htmlFor="generate-difficulty" className="sr-only">
                  Độ khó bài tập
                </label>
                <select
                  id="generate-difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                  disabled={activeJobId !== null || generateLessons.isPending}
                  className="h-9 cursor-pointer rounded-control border border-line-input bg-panel px-2.5 text-sm text-fg hover:border-fg disabled:cursor-not-allowed disabled:opacity-60 focus-ring-tight"
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
                {/* Việc của người soạn nội dung — `secondary`, không tranh với nút chính. */}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={requestGenerate}
                  loading={generateLessons.isPending}
                  disabled={activeJobId !== null || courseJobs.isLoading || !hasSelectedDoc}
                  aria-describedby={hasExtractedDoc ? undefined : 'generate-blocked'}
                >
                  {!generateLessons.isPending && <Icon name="sparkles" size={16} />}
                  {generateLessons.isPending ? 'Đang bắt đầu…' : 'Sinh bài học bằng AI'}
                </Button>
              </div>
            }
          >
            Lộ trình bài học
          </SectionTitle>

          {/* Lý do nút xám phải nhìn thấy được — phần tử disabled không hiện tooltip. */}
          {!hasExtractedDoc && !documents.isLoading && (
            <p
              id="generate-blocked"
              className="mb-4 flex items-start gap-2 rounded-control bg-muted px-3.5 py-2.5 text-sm text-fg-muted"
            >
              <Icon name="info" size={16} className="mt-0.5 shrink-0 text-accent" />
              Cần ít nhất một tài liệu sẵn sàng thì mới sinh được bài học.
            </p>
          )}
          {hasExtractedDoc && !hasSelectedDoc && (
            <p className="mb-4 flex items-start gap-2 rounded-control bg-muted px-3.5 py-2.5 text-sm text-fg-muted">
              <Icon name="info" size={16} className="mt-0.5 shrink-0 text-accent" />
              Hãy chọn ít nhất một tài liệu để sinh bài học.
            </p>
          )}

          {confirmingGenerate && (
            <div
              role="alert"
              className="mb-4 rounded-control border border-line bg-panel-2 px-3.5 py-3 text-sm text-fg"
            >
              <p className="font-medium">Khóa học đã có {lessonList.length} bài. Vẫn sinh thêm?</p>
              <p className="mt-1 text-fg-subtle">
                Lượt này dùng 1 lượt AI. Bài có tiêu đề trùng bài đã có sẽ bị bỏ qua, nên nếu không
                có tài liệu mới thì có thể không tạo thêm được bài nào.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => void handleGenerate()}>
                  Sinh thêm
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setConfirmingGenerate(false)}>
                  Huỷ
                </Button>
              </div>
            </div>
          )}

          {isQuotaExceededError(generateError) && (
            <QuotaNotice
              className="mb-4"
              metric={generateError.meta.metric}
              limit={generateError.meta.limit}
              used={generateError.meta.used}
            />
          )}
          {Boolean(generateError) && !isQuotaExceededError(generateError) && (
            <InlineError className="mb-4">
              {errorText(generateError, 'Không sinh được bài học, vui lòng thử lại.')}
            </InlineError>
          )}
          {Boolean(reorderError) && (
            <InlineError className="mb-4">
              {errorText(reorderError, 'Không sắp xếp lại được, vui lòng thử lại.')}
            </InlineError>
          )}

          {activeJobId && (
            <AiJobProgress jobId={activeJobId} onDone={handleJobDone} onRetry={handleRetry} />
          )}

          {!activeJobId && lessons.isLoading && (
            <LoadingState rows={3} variant="list" label="Đang tải bài học" />
          )}
          {!activeJobId && lessons.isError && (
            <ErrorState
              title="Không tải được bài học"
              description={errorText(lessons.error, 'Vui lòng thử lại.')}
              onRetry={() => void lessons.refetch()}
            />
          )}
          {!activeJobId && lessons.data && lessonList.length === 0 && (
            <EmptyState
              title="Chưa có bài học nào"
              description={
                hasExtractedDoc
                  ? 'Tài liệu đã sẵn sàng. Bấm "Sinh bài học bằng AI" để tạo lộ trình.'
                  : 'Tải tài liệu lên ở khung bên cạnh, rồi bấm "Sinh bài học bằng AI" để tạo lộ trình.'
              }
            />
          )}
          {!activeJobId && lessonList.length > 0 && (
            <LessonList
              lessons={lessonList}
              courseId={courseId}
              onMove={(i, d) => void moveLesson(i, d)}
              reordering={reorderLessons.isPending}
            />
          )}
        </section>

        {/* ----------------------------------------------------- tài liệu */}
        {/* Chưa có tài liệu thì đây là việc phải làm trước, nên đưa lên đầu trên màn hình hẹp. */}
        <section
          aria-labelledby="docs-title"
          className={cn('min-w-0', docCount === 0 && 'order-first lg:order-none')}
        >
          <SectionTitle id="docs-title">Tài liệu nguồn</SectionTitle>

          {upload.progress ? (
            <UploadStatus progress={upload.progress} onCancel={upload.cancel} />
          ) : (
            <Dropzone onFile={(f) => void handleFile(f)} />
          )}

          {isQuotaExceededError(uploadError) && (
            <QuotaNotice
              className="mt-3"
              metric={uploadError.meta.metric}
              limit={uploadError.meta.limit}
              used={uploadError.meta.used}
            />
          )}
          {Boolean(uploadError) && !isQuotaExceededError(uploadError) && (
            <InlineError className="mt-3">
              {errorText(uploadError, 'Tải tài liệu thất bại, vui lòng thử lại.')}
            </InlineError>
          )}

          <div className="mt-4">
            {documents.isLoading && (
              <LoadingState rows={2} variant="list" label="Đang tải tài liệu" />
            )}
            {documents.isError && (
              <ErrorState
                title="Không tải được tài liệu"
                description={errorText(documents.error, 'Vui lòng thử lại.')}
                onRetry={() => void documents.refetch()}
              />
            )}
            {documents.data && documents.data.documents.length === 0 && (
              <p className="rounded-control border border-dashed border-line px-4 py-3 text-center text-sm text-fg-subtle">
                Chưa có tài liệu nào trong khóa này.
              </p>
            )}
            {documents.data && documents.data.documents.length > 0 && (
              <ul className="divide-y divide-line">
                {documents.data.documents.map((doc) => (
                  <DocumentRow
                    key={doc.id}
                    doc={doc}
                    selectable={extractedDocs.length > 1}
                    selected={!excludedDocIds.has(doc.id)}
                    onToggle={() => toggleDoc(doc.id)}
                  />
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <section aria-label="Xoá khóa học" className="mt-14 border-t border-line pt-6">
        {confirmingDelete ? (
          <div role="alert" className="max-w-xl text-sm text-fg">
            <p className="font-medium">Xoá khóa học &quot;{course.data.title}&quot;?</p>
            <p className="mt-1 text-fg-subtle">
              Bài học, tài liệu và tiến độ của khóa này sẽ không còn hiển thị. Suất khóa học được
              trả lại, còn lượt AI và lượt tải đã dùng thì không.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="danger"
                loading={deleteCourse.isPending}
                onClick={() => void handleDeleteCourse()}
              >
                Xác nhận xoá
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setConfirmingDelete(false)}>
                Huỷ
              </Button>
            </div>
          </div>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            disabled={activeJobId !== null}
            onClick={() => setConfirmingDelete(true)}
          >
            <Icon name="trash" size={15} />
            Xoá khóa học
          </Button>
        )}
        {Boolean(deleteError) && (
          <InlineError className="mt-3">
            {errorText(deleteError, 'Không xoá được khóa học, vui lòng thử lại.')}
          </InlineError>
        )}
      </section>
    </>
  );
}

const dismissedPartialKey = (jobId: string) => `learn:dismissed-partial:${jobId}`;

/** Cảnh báo ở lại sau khi đóng màn tiến độ, tới khi người dùng bấm đã đọc hoặc sinh lần mới. */
function PartialJobNotice({
  jobId,
  failures,
}: {
  jobId: string;
  failures: ReadonlyArray<{ node: string; errors: string[] }>;
}) {
  const [dismissed, setDismissed] = useState(true);
  useEffect(() => {
    setDismissed(localStorage.getItem(dismissedPartialKey(jobId)) !== null);
  }, [jobId]);

  if (dismissed) return null;
  return (
    <div className="mt-6">
      <PartialNotice>
        Lần sinh gần nhất thiếu {failures.length} phần:{' '}
        {failures
          .map((f) => `${f.node} (${failureReasonText(f.errors).replace(/\.$/, '')})`)
          .join('; ')}
        .
      </PartialNotice>
      <Button
        size="sm"
        variant="ghost"
        className="mt-2"
        onClick={() => {
          localStorage.setItem(dismissedPartialKey(jobId), '1');
          setDismissed(true);
        }}
      >
        Đã hiểu
      </Button>
    </div>
  );
}

function DocumentRow({
  doc,
  selectable,
  selected,
  onToggle,
}: {
  doc: DocumentList;
  selectable: boolean;
  selected: boolean;
  onToggle: () => void;
}) {
  const remove = useDeleteDocument();
  const [confirming, setConfirming] = useState(false);
  const canSelect = selectable && doc.status === 'EXTRACTED';

  return (
    <li className="py-3">
      <div className="flex items-start gap-3">
        {canSelect && (
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggle}
            aria-label={`Dùng ${doc.filename} khi sinh bài học`}
            className="mt-1 size-4 shrink-0 cursor-pointer accent-[var(--accent)]"
          />
        )}
        <Icon
          name="file"
          size={20}
          className={cn('mt-0.5 shrink-0', doc.status === 'FAILED' ? 'text-bad' : 'text-fg-subtle')}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-fg" title={doc.filename}>
            {doc.filename}
          </p>
          <p className="mt-0.5 text-xs text-fg-subtle">
            {formatFileSize(doc.sizeBytes)}
            {doc.pageCount ? ` · ${doc.pageCount} trang` : ''}
            {doc.createdAt ? ` · ${relativeTime(doc.createdAt)}` : ''}
          </p>
        </div>
        <Badge
          tone={docTone(doc.status)}
          icon={
            doc.status === 'FAILED'
              ? 'alert'
              : doc.status === 'EXTRACTED'
                ? 'check'
                : doc.status === 'EXTRACTING'
                  ? 'spinner'
                  : undefined
          }
          className="shrink-0"
        >
          {DOC_STATUS_LABEL[doc.status] ?? humanizeCode(doc.status)}
        </Badge>
      </div>
      {doc.status === 'FAILED' && doc.errorMessage && (
        <p className="mt-2 flex items-start gap-2 rounded-md border border-bad-line px-2.5 py-2 text-xs text-bad">
          <Icon name="alert" size={14} className="mt-px shrink-0" />
          <span>{doc.errorMessage}</span>
        </p>
      )}
      {doc.status !== 'EXTRACTING' && doc.status !== 'UPLOADED' && (
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
          {confirming ? (
            <>
              <span className="text-fg-subtle">Xoá tài liệu này?</span>
              <Button
                size="sm"
                variant="danger"
                loading={remove.isPending}
                onClick={() => remove.mutate(doc.id)}
              >
                Xác nhận xoá
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                Huỷ
              </Button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="inline-flex min-h-11 items-center rounded-md text-fg-subtle underline underline-offset-2 hover:text-fg focus-ring md:min-h-0"
            >
              Xoá tài liệu
            </button>
          )}
        </div>
      )}
      {remove.isError && (
        <InlineError className="mt-2">
          {errorText(remove.error, 'Không xoá được tài liệu, vui lòng thử lại.')}
        </InlineError>
      )}
    </li>
  );
}

/**
 * Vùng tải lên: bấm để chọn tệp hoặc kéo-thả. `<input type="file">` vẫn là điều khiển
 * thật (chỉ ẩn bằng `sr-only`, không `hidden`), nên Tab tới được và trình đọc màn hình
 * đọc được nhãn; vòng focus hiện trên khung nhờ `has-[:focus-visible]`.
 */
function Dropzone({ onFile }: { onFile: (f: File) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(file);
      }}
      className={cn(
        'flex cursor-pointer flex-col items-center gap-1.5 rounded-card border border-dashed px-5 py-6 text-center transition-colors duration-150',
        'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-fg',
        dragging
          ? 'border-fg bg-accent-soft'
          : 'border-line-input bg-panel hover:border-fg hover:bg-panel-2',
      )}
    >
      <input
        ref={input}
        type="file"
        accept={DOCUMENT_ACCEPT}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = '';
        }}
      />
      <Icon name="upload" size={20} className="mb-1 text-fg-subtle" />
      <span className="text-sm font-medium text-fg">Kéo tệp vào đây hoặc bấm để chọn</span>
      <span className="text-xs leading-relaxed text-fg-subtle">
        PDF, Word (DOCX), PowerPoint (PPTX), TXT, Markdown.
        <br />
        PDF scan được đọc bằng OCR, tối đa 50 trang.
      </span>
    </label>
  );
}

/** Nằm ngoài `Dropzone`: nút trong `<label>` sẽ mở lại hộp chọn tệp khi bấm. */
function UploadStatus({ progress, onCancel }: { progress: UploadProgress; onCancel: () => void }) {
  const label =
    progress.phase === 'preparing'
      ? 'Đang chuẩn bị tệp…'
      : progress.phase === 'uploading'
        ? `Đang tải lên ${progress.percent}%`
        : 'Đang xác nhận tệp…';

  return (
    <div className="rounded-card border border-line-input bg-panel px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-fg" role="status">
          {label}
        </span>
        {progress.phase !== 'confirming' && (
          <Button variant="secondary" size="sm" onClick={onCancel}>
            Huỷ
          </Button>
        )}
      </div>
      <ProgressBar
        className="mt-3"
        size="sm"
        value={progress.percent ?? 0}
        label="Tiến độ tải tài liệu"
      />
    </div>
  );
}
