'use client';

import { use, useRef, useState } from 'react';
import Link from 'next/link';
import { useCourse, useCourseDocuments } from '@/lib/courses-api';
import { useUploadDocument } from '@/lib/documents-api';
import { useLessons, useReorderLessons } from '@/lib/learning-api';
import { useGenerateLessons } from '@/lib/ai-api';
import { AiJobProgress } from '@/components/ai-job-progress';
import { QuotaNotice } from '@/components/quota-notice';
import { LessonPath } from '@/components/lesson-path';
import { Badge, Button, ButtonLink, Card, CardTitle, Icon, ProgressBar } from '@/components/ui';
import { EmptyState, ErrorState, InlineError, LoadingState } from '@/components/ui/states';
import { errorText, isQuotaExceededError } from '@/lib/api-client';

const DOC_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ tải lên',
  UPLOADED: 'Đã tải lên',
  EXTRACTING: 'Đang trích xuất',
  EXTRACTED: 'Đã trích xuất',
  FAILED: 'Lỗi',
};

function docTone(status: string) {
  if (status === 'FAILED') return 'danger' as const;
  if (status === 'EXTRACTED') return 'success' as const;
  return 'neutral' as const;
}

export default function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const course = useCourse(courseId);
  const documents = useCourseDocuments(courseId);
  const upload = useUploadDocument(courseId);
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<unknown>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<unknown>(null);
  const lessons = useLessons(courseId);
  const generateLessons = useGenerateLessons(courseId);
  const reorderLessons = useReorderLessons(courseId);
  const [reorderError, setReorderError] = useState<unknown>(null);
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
      const job = await generateLessons.mutateAsync();
      setActiveJobId(job.id);
    } catch (err) {
      setGenerateError(err);
    }
  }

  function handleJobDone(result: { succeeded: boolean }) {
    setActiveJobId(null);
    if (result.succeeded) void lessons.refetch();
  }

  async function handleFile(file: File) {
    setUploadError(null);
    try {
      await upload.mutateAsync(file);
    } catch (err) {
      setUploadError(err);
    } finally {
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  if (course.isLoading) return <LoadingState rows={2} label="Đang tải khóa học" />;

  if (course.isError || !course.data) {
    return (
      <ErrorState
        title="Không tải được khóa học"
        description={errorText(course.error, 'Vui lòng thử lại sau ít phút.')}
        onRetry={() => void course.refetch()}
      />
    );
  }

  /**
   * Bài mà nút chính sẽ mở.
   *
   * Màn này trước đây không có hành động chính nào cho *người học*: nút nổi bật
   * duy nhất là "Sinh bài học bằng AI" — việc của người soạn nội dung. Người vào
   * để học phải tự suy ra rằng mấy cái vòng tròn trên lộ trình bấm được. Ưu tiên:
   * bài đang học dở → bài chưa bắt đầu đầu tiên → bài đầu tiên (đã xong hết thì
   * là xem lại).
   */
  const resumeLesson =
    lessonList.find((l) => l.progressStatus === 'IN_PROGRESS') ??
    lessonList.find((l) => l.progressStatus === 'NOT_STARTED') ??
    lessonList[0];

  // Nhãn bám theo trạng thái thật của bài sắp mở, không chỉ theo số bài đã xong:
  // một bài đang học dở thì "Bắt đầu học" là nói sai.
  const resumeLabel =
    completedCount === lessonList.length && lessonList.length > 0
      ? 'Xem lại'
      : resumeLesson?.progressStatus === 'NOT_STARTED' && completedCount === 0
        ? 'Bắt đầu học'
        : 'Tiếp tục học';

  return (
    <section>
      <Link
        href="/courses"
        className="inline-flex items-center gap-1 rounded-md text-sm font-bold text-ink-500 hover:text-ink-900"
      >
        <Icon name="chevron-right" size={15} className="rotate-180" />
        Khóa học
      </Link>

      {/* ------------------------------------------------ banner khóa học */}
      <div className="mt-3 rounded-card border-b-[6px] border-navy-900 bg-navy-800 px-6 py-5">
        <p className="text-xs font-medium text-sky-500">Khóa học</p>
        <h1 className="mt-1 text-2xl font-bold text-white">{course.data.title}</h1>
        {course.data.description && (
          <p className="mt-1.5 max-w-2xl text-sm text-ink-300">{course.data.description}</p>
        )}
        {lessonList.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <ProgressBar
                value={completedCount}
                max={lessonList.length}
                label={`Đã hoàn thành ${completedCount} trên ${lessonList.length} bài`}
                className="max-w-xs"
              />
              <span className="shrink-0 text-sm font-bold text-white">
                {completedCount}/{lessonList.length} bài
              </span>
            </div>
            {resumeLesson && (
              <ButtonLink href={`/courses/${courseId}/lessons/${resumeLesson.id}`}>
                {resumeLabel}
                <Icon name="chevron-right" size={18} strokeWidth={3} />
              </ButtonLink>
            )}
          </div>
        )}
        {resumeLesson && (
          <p className="mt-2 truncate text-xs text-ink-300">
            {completedCount === lessonList.length ? 'Mở lại: ' : 'Tiếp theo: '}
            {resumeLesson.title}
          </p>
        )}
      </div>

      {/* ----------------------------------------------------- lộ trình */}
      <div className="mt-8 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-ink-900">Lộ trình bài học</h2>
        {/* Hành động của người soạn nội dung, không phải của người học — để
            `secondary` cho nó không tranh chấp với nút "Tiếp tục học" ở banner. */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void handleGenerate()}
          disabled={activeJobId !== null || generateLessons.isPending || !hasExtractedDoc}
          aria-describedby={hasExtractedDoc ? undefined : 'generate-blocked'}
        >
          {generateLessons.isPending ? 'Đang tạo job…' : 'Sinh bài học bằng AI'}
        </Button>
      </div>

      {/* Lý do nút xám phải nhìn thấy được. `title` cũ không dùng được: phần tử
          disabled không nhận sự kiện chuột nên tooltip không bao giờ hiện, và
          trên cảm ứng thì không có hover để mà hiện. */}
      {!hasExtractedDoc && (
        <p id="generate-blocked" className="mt-2 flex items-start gap-1.5 text-sm text-ink-700">
          <Icon name="info" size={16} className="mt-0.5 shrink-0 text-sky-700" />
          Cần ít nhất một tài liệu đã trích xuất xong thì mới sinh được bài học.
        </p>
      )}

      {isQuotaExceededError(generateError) && (
        <div className="mt-3">
          <QuotaNotice
            metric={generateError.meta.metric}
            limit={generateError.meta.limit}
            used={generateError.meta.used}
          />
        </div>
      )}
      {Boolean(generateError) && !isQuotaExceededError(generateError) && (
        <InlineError className="mt-3">
          {errorText(generateError, 'Không sinh được bài học, vui lòng thử lại.')}
        </InlineError>
      )}
      {Boolean(reorderError) && (
        <InlineError className="mt-3">
          {errorText(reorderError, 'Không sắp xếp lại được, vui lòng thử lại.')}
        </InlineError>
      )}

      {activeJobId && <AiJobProgress jobId={activeJobId} onDone={handleJobDone} />}

      {!activeJobId && lessons.isLoading && (
        <div className="mt-4">
          <LoadingState rows={3} label="Đang tải bài học" />
        </div>
      )}
      {!activeJobId && lessons.isError && (
        <div className="mt-4">
          <ErrorState
            title="Không tải được bài học"
            description={errorText(lessons.error, 'Vui lòng thử lại.')}
            onRetry={() => void lessons.refetch()}
          />
        </div>
      )}
      {!activeJobId && lessons.data && lessonList.length === 0 && (
        <div className="mt-4">
          <EmptyState
            title="Chưa có bài học nào"
            description={'Tải tài liệu lên rồi nhấn "Sinh bài học bằng AI" để tạo lộ trình.'}
          />
        </div>
      )}
      {!activeJobId && lessonList.length > 0 && (
        <Card className="mt-4 overflow-hidden" padded={false}>
          <LessonPath
            lessons={lessonList}
            courseId={courseId}
            onMove={(i, d) => void moveLesson(i, d)}
            reordering={reorderLessons.isPending}
          />
        </Card>
      )}

      {/* ----------------------------------------------------- tài liệu */}
      <div className="mt-10 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-ink-900">Tài liệu nguồn</h2>
        <div>
          <input
            ref={fileInput}
            type="file"
            accept=".pdf,.pptx,.docx,.txt,.md"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInput.current?.click()}
            disabled={upload.isPending}
          >
            {upload.isPending ? 'Đang tải lên…' : 'Tải tài liệu lên'}
          </Button>
        </div>
      </div>

      {isQuotaExceededError(uploadError) && (
        <div className="mt-3">
          <QuotaNotice
            metric={uploadError.meta.metric}
            limit={uploadError.meta.limit}
            used={uploadError.meta.used}
          />
        </div>
      )}
      {Boolean(uploadError) && !isQuotaExceededError(uploadError) && (
        <InlineError className="mt-3">
          {errorText(uploadError, 'Tải tài liệu thất bại, vui lòng thử lại.')}
        </InlineError>
      )}

      {documents.isLoading && (
        <div className="mt-4">
          <LoadingState rows={1} label="Đang tải tài liệu" />
        </div>
      )}
      {documents.isError && (
        <div className="mt-4">
          <ErrorState
            title="Không tải được danh sách tài liệu"
            description={errorText(documents.error, 'Vui lòng thử lại.')}
            onRetry={() => void documents.refetch()}
          />
        </div>
      )}
      {documents.data && documents.data.documents.length === 0 && (
        <div className="mt-4">
          <EmptyState
            title="Chưa có tài liệu nào"
            description="Tải lên PDF, slide hoặc tài liệu văn bản để AI sinh bài học từ đó."
          />
        </div>
      )}
      {documents.data && documents.data.documents.length > 0 && (
        <ul className="mt-4 space-y-2">
          {documents.data.documents.map((doc) => (
            <li key={doc.id}>
              <Card className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <CardTitle className="truncate text-sm">{doc.filename}</CardTitle>
                  <p className="mt-0.5 text-xs text-ink-500">
                    {(doc.sizeBytes / 1024 / 1024).toFixed(2)} MB
                    {doc.pageCount ? ` · ${doc.pageCount} trang` : ''}
                  </p>
                  {doc.status === 'FAILED' && doc.errorMessage && (
                    <p className="mt-1 text-xs font-medium text-danger-700">{doc.errorMessage}</p>
                  )}
                </div>
                <Badge
                  tone={docTone(doc.status)}
                  icon={
                    doc.status === 'FAILED'
                      ? 'alert'
                      : doc.status === 'EXTRACTED'
                        ? 'check'
                        : undefined
                  }
                >
                  {DOC_STATUS_LABEL[doc.status] ?? doc.status}
                </Badge>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
