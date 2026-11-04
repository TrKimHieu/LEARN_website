'use client';

import { use, useRef, useState } from 'react';
import { DOCUMENT_ACCEPT, type DocumentList } from '@learn/api-contracts';
import { useCourse, useCourseDocuments } from '@/features/courses/courses-api';
import { useUploadDocument, type UploadProgress } from '@/features/documents/documents-api';
import { UploadCancelledError } from '@/features/documents/upload-transfer';
import { useLessons, useReorderLessons } from '@/features/learning/learning-api';
import { useActiveAiJob, useFinishAiJob, useGenerateLessons } from '@/features/ai/ai-api';
import { AiJobProgress } from '@/features/ai/ai-job-progress';
import { LessonList } from '@/features/learning/lesson-list';
import { QuotaNotice } from '@/components/shared/quota-notice';
import { CourseCover } from '@/components/shared/course-cover';
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
  ProgressBar,
  SectionTitle,
  Skeleton,
  cn,
} from '@/components/ui';
import { errorDetail, errorText, isQuotaExceededError } from '@/lib/api-client';
import { relativeTime } from '@/lib/format';
import { humanizeCode } from '@/lib/humanize';

const DOC_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ tải lên',
  UPLOADED: 'Đã tải lên',
  EXTRACTING: 'Đang trích xuất',
  EXTRACTED: 'Đã trích xuất',
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

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const course = useCourse(courseId);
  const documents = useCourseDocuments(courseId);
  const upload = useUploadDocument(courseId);
  const lessons = useLessons(courseId);
  const generateLessons = useGenerateLessons(courseId);
  const activeJob = useActiveAiJob(courseId);
  const finishAiJob = useFinishAiJob(courseId);
  const reorderLessons = useReorderLessons(courseId);

  const [uploadError, setUploadError] = useState<unknown>(null);
  const [startedJobId, setStartedJobId] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<unknown>(null);
  const [reorderError, setReorderError] = useState<unknown>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');

  const activeJobId = startedJobId ?? activeJob.data?.id ?? null;
  const hasExtractedDoc = Boolean(documents.data?.documents.some((d) => d.status === 'EXTRACTED'));
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

  async function handleGenerate() {
    setGenerateError(null);
    try {
      const job = await generateLessons.mutateAsync({ difficulty });
      setStartedJobId(job.id);
    } catch (err) {
      setGenerateError(err);
    }
  }

  function handleJobDone() {
    setStartedJobId(null);
    void finishAiJob();
  }

  async function handleFile(file: File) {
    setUploadError(null);
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
      <header className="mt-6 grid gap-8 md:grid-cols-[minmax(0,1fr)_14rem] md:items-end">
        <div className="min-w-0">
          <h1 className="font-display text-[2.375rem] font-semibold leading-[1.08] text-fg sm:text-[3.125rem]">
            {course.data.title}
          </h1>
          {course.data.description && (
            <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-fg-subtle">
              {course.data.description}
            </p>
          )}
          {resumeLesson && (
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
              <ButtonLink href={`/courses/${courseId}/lessons/${resumeLesson.id}`}>
                {resumeLabel}
                <Icon name="arrow-right" size={16} />
              </ButtonLink>
              <p className="min-w-0 max-w-sm truncate text-sm text-fg-subtle">
                {allDone ? 'Mở lại ' : 'Tiếp theo: '}
                <span className="font-medium text-fg">{resumeLesson.title}</span>
              </p>
            </div>
          )}
        </div>
        <CourseCover
          id={courseId}
          title={course.data.title}
          className="hidden aspect-[4/3] rounded-card border border-line md:block"
        />
      </header>

      <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-y border-line py-4 text-sm">
        <div>
          <dt className="text-fg-subtle">Tiến độ</dt>
          <dd className="mt-1 flex items-center gap-3">
            <span className="font-semibold tabular-nums text-fg">
              {completedCount}/{lessonList.length} bài
            </span>
            {lessonList.length > 0 && (
              <ProgressBar
                size="xs"
                value={completedCount}
                max={lessonList.length}
                label={`Đã hoàn thành ${completedCount} trên ${lessonList.length} bài`}
                className="w-28"
              />
            )}
          </dd>
        </div>
        <div>
          <dt className="text-fg-subtle">Tài liệu nguồn</dt>
          <dd className="mt-1 font-semibold tabular-nums text-fg">{docCount}</dd>
        </div>
        <div>
          <dt className="text-fg-subtle">Ngôn ngữ</dt>
          <dd className="mt-1 font-semibold text-fg">
            {course.data.language === 'en' ? 'Tiếng Anh' : 'Tiếng Việt'}
          </dd>
        </div>
      </dl>

      <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14">
        {/* ----------------------------------------------------- lộ trình */}
        <section aria-labelledby="path-title" className="min-w-0">
          <SectionTitle
            id="path-title"
            description="Bấm vào một bài để học. Mũi tên bên phải đổi thứ tự."
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
                  onClick={() => void handleGenerate()}
                  loading={generateLessons.isPending}
                  disabled={activeJobId !== null || activeJob.isLoading || !hasExtractedDoc}
                  aria-describedby={hasExtractedDoc ? undefined : 'generate-blocked'}
                >
                  {!generateLessons.isPending && <Icon name="sparkles" size={16} />}
                  {generateLessons.isPending ? 'Đang tạo job…' : 'Sinh bài học bằng AI'}
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
              Cần ít nhất một tài liệu đã trích xuất xong thì mới sinh được bài học.
            </p>
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

          {activeJobId && <AiJobProgress jobId={activeJobId} onDone={handleJobDone} />}

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
        <section aria-labelledby="docs-title" className="min-w-0">
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
                  <DocumentRow key={doc.id} doc={doc} />
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

function DocumentRow({ doc }: { doc: DocumentList }) {
  return (
    <li className="py-3">
      <div className="flex items-start gap-3">
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
            {formatSize(doc.sizeBytes)}
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
            Hủy
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
