'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CircleArrowLink, ColorBlock, StatTile } from '@/components/shared/color-block';
import { Mascot } from '@/components/shared/mascot';
import type { ProgressCourse } from '@learn/api-contracts';
import {
  useLessons,
  useProgressCourses,
  useProgressHistory,
  useProgressOverview,
} from '@/features/learning/learning-api';
import {
  ButtonLink,
  Card,
  EmptyState,
  ErrorState,
  Icon,
  InlineError,
  ProgressBar,
  SectionTitle,
  Skeleton,
  cn,
} from '@/components/ui';
import { errorDetail, errorText } from '@/lib/api-client';
import { absoluteTime, relativeTime } from '@/lib/format';
import { usePageTitle } from '@/lib/use-page-title';

/** Số lần làm bài gần nhất ở "Hoạt động gần đây". */
const HISTORY_LIMIT = 5;

/**
 * Tổng quan — ADR 012.
 *
 * Câu hỏi duy nhất màn này phải trả lời nhanh: "học tiếp cái gì?". Nên:
 * - Thẻ "Học tiếp" dẫn THẲNG vào bài kế tiếp (đọc danh sách bài của khóa gần xong nhất),
 *   không dừng ở trang khóa học.
 * - Mỗi số liệu hiện đúng một lần. Bản v3 hiện chuỗi ngày / số bài / điểm ba lần (chip
 *   trên thanh đầu, bốn thẻ số, vòng tiến độ) — lặp lại không thêm thông tin.
 */
export default function DashboardPage() {
  usePageTitle('Tổng quan');
  const router = useRouter();
  const overview = useProgressOverview();
  const courses = useProgressCourses();
  const history = useProgressHistory(HISTORY_LIMIT);

  const all = courses.data?.courses ?? [];
  // Khóa đang dở, gần xong nhất trước — đẩy người học về đích; rồi tới khóa chưa bắt đầu.
  const ordered = [...all].sort((a, b) => rank(a) - rank(b) || b.percent - a.percent);
  const next = ordered.find((c) => c.percent < 100);

  if (overview.isLoading) {
    return (
      <div aria-busy="true" aria-live="polite">
        <span className="sr-only">Đang tải tổng quan</span>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <Skeleton className="h-44 rounded-card" />
          <Skeleton className="h-44 rounded-card" />
        </div>
      </div>
    );
  }

  if (overview.isError || !overview.data) {
    return (
      <>
        <h1 className="sr-only">Tổng quan</h1>
        <ErrorState
          title="Không tải được tổng quan"
          description={errorText(overview.error, 'Vui lòng thử lại.')}
          detail={errorDetail(overview.error)}
          onRetry={() => void overview.refetch()}
        />
      </>
    );
  }

  const data = overview.data;

  if (data.courseCount === 0) {
    return (
      <>
        <h1 className="sr-only">Tổng quan</h1>
        <EmptyState
          title="Chưa có khóa học nào"
          description="Tạo khóa học đầu tiên và tải tài liệu lên. AI sẽ sinh bài học và bài tập từ chính nội dung đó."
          action={{ label: 'Tạo khóa học đầu tiên', onClick: () => router.push('/courses/new') }}
        />
      </>
    );
  }

  return (
    <>
      <h1 className="sr-only">Tổng quan</h1>

      <div>
        {courses.isLoading && <Skeleton className="h-44 rounded-panel" />}
        {courses.isError && (
          <InlineError>{errorText(courses.error, 'Không tải được khóa học đang dở.')}</InlineError>
        )}
        {next && <ResumeCard course={next} />}
      </div>

      <section aria-labelledby="stats-title" className="mt-4">
        <h2 id="stats-title" className="sr-only">
          Số liệu học tập
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatTile icon="flame" label="Chuỗi ngày học" value={String(data.activeStreak)} />
          <StatTile
            icon="book-check"
            label="Bài đã xong"
            value={`${data.completedLessons}/${data.totalLessons}`}
          />
          <StatTile
            icon="star"
            label="Điểm trung bình"
            value={data.averageScore !== null ? String(Math.round(data.averageScore)) : 'Chưa có'}
          />
          <StatTile icon="layers" label="Khóa học" value={String(data.courseCount)} />
        </div>
      </section>

      <div className="mt-10 grid grid-cols-1 gap-x-10 gap-y-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Hai cột cao bằng nhau: thẻ nào ít dữ liệu thì tự giãn, không để lại khoảng trống. */}
        <div className="flex min-w-0 flex-col">
          {/* ------------------------------------------------- khóa học */}
          <section aria-labelledby="courses-title" className="flex flex-1 flex-col">
            <SectionTitle
              id="courses-title"
              action={
                <ButtonLink href="/courses" variant="link" size="sm">
                  Tất cả khóa học
                </ButtonLink>
              }
            >
              Khóa học của bạn
            </SectionTitle>
            {courses.data && (
              <Card padded={false} className="flex flex-1 flex-col">
                {ordered.length === 0 ? (
                  <p className="p-5 text-sm text-fg-subtle">Các khóa chưa có bài học nào.</p>
                ) : (
                  <ul className="divide-y divide-line">
                    {ordered.slice(0, 5).map((c) => (
                      <li key={c.courseId}>
                        <CourseRow course={c} />
                      </li>
                    ))}
                  </ul>
                )}
                {ordered.length < 4 && (
                  <Link
                    href="/courses/new"
                    className="m-4 hidden min-h-24 flex-1 items-center justify-center gap-2 rounded-control border border-dashed border-line-strong text-sm font-medium text-fg-muted transition-colors duration-150 hover:border-brand hover:text-fg focus-ring lg:flex"
                  >
                    <Icon name="plus" size={16} />
                    Tạo khóa học
                  </Link>
                )}
              </Card>
            )}
          </section>
        </div>

        {/* ------------------------------------------------- cột phụ */}
        <aside className="flex min-w-0 flex-col" aria-label="Hoạt động gần đây">
          <section aria-labelledby="activity-title" className="flex flex-1 flex-col">
            <SectionTitle
              id="activity-title"
              action={
                <ButtonLink href="/progress" variant="link" size="sm">
                  Xem hết
                </ButtonLink>
              }
            >
              Hoạt động gần đây
            </SectionTitle>
            {history.isLoading && <Skeleton className="h-48 rounded-card" />}
            {history.isError && (
              <InlineError>{errorText(history.error, 'Không tải được hoạt động.')}</InlineError>
            )}
            {history.data && history.data.items.length === 0 && (
              <Card className="flex-1">
                <p className="text-sm leading-relaxed text-fg-subtle">
                  Chưa có lần làm bài nào. Kết quả bài tập sẽ hiện ở đây.
                </p>
              </Card>
            )}
            {history.data && history.data.items.length > 0 && (
              <Card className="flex-1">
                <ol className="space-y-4">
                  {history.data.items.map((item) => {
                    const passed = item.passed;
                    return (
                      <li
                        key={item.id}
                        className="relative -mx-2 flex gap-3 rounded-control px-2 py-1 transition-colors duration-150 hover:bg-muted has-[a:focus-visible]:bg-muted"
                      >
                        <Icon
                          name={passed ? 'circle-check' : 'retry'}
                          size={18}
                          filled={passed}
                          className={cn('mt-0.5 shrink-0', passed ? 'text-ok' : 'text-warn')}
                        />
                        <div className="min-w-0 flex-1">
                          {/* FR-PROGRESS-05: cả dòng bấm được, tới đúng bài học đã làm. */}
                          <Link
                            href={`/courses/${item.courseId}/lessons/${item.lessonId}`}
                            className="text-sm leading-snug text-fg outline-none after:absolute after:inset-0 after:rounded-control focus-visible:underline"
                          >
                            {item.lessonTitle}
                          </Link>
                          <p className="mt-0.5 text-xs text-fg-subtle">
                            <span className="tabular-nums">
                              {item.score}/{item.maxScore} điểm
                            </span>
                            <span className="sr-only">{passed ? ', đạt' : ', chưa đạt'}</span> ·{' '}
                            <time dateTime={item.createdAt} title={absoluteTime(item.createdAt)}>
                              {relativeTime(item.createdAt)}
                            </time>
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </Card>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}

function rank(c: ProgressCourse) {
  if (c.percent > 0 && c.percent < 100) return 0;
  if (c.percent === 0) return 1;
  return 2;
}

/**
 * Thẻ duy nhất có nút `primary` trên màn. Bài kế tiếp = bài đang học dở, nếu không có thì
 * bài chưa bắt đầu đầu tiên. Khi danh sách bài chưa tải xong, nút vẫn dẫn tới trang khóa
 * học — không bao giờ là nút chết.
 */
function ResumeCard({ course }: { course: ProgressCourse }) {
  const lessons = useLessons(course.courseId);
  const list = lessons.data?.lessons ?? [];
  const lesson =
    list.find((l) => l.progressStatus === 'IN_PROGRESS') ??
    list.find((l) => l.progressStatus === 'NOT_STARTED');
  const index = lesson ? list.indexOf(lesson) : -1;
  const href = lesson
    ? `/courses/${course.courseId}/lessons/${lesson.id}`
    : `/courses/${course.courseId}`;

  return (
    <section aria-labelledby="resume-title">
      <ColorBlock
        tone="brand"
        softOnDesktop
        className="flex items-center gap-4 p-6 md:px-8 md:py-6"
      >
        <div className="min-w-0 flex-1">
          {lessons.isLoading ? (
            <Skeleton className="h-9 w-3/4" />
          ) : (
            <h2
              id="resume-title"
              className="line-clamp-2 font-display text-[1.75rem] font-bold leading-tight md:text-2xl"
            >
              {lesson ? lesson.title : course.courseTitle}
            </h2>
          )}
          <p className="mt-2 line-clamp-2 text-sm md:truncate md:text-fg-muted">
            {course.courseTitle}
            {lesson && index >= 0 ? ` · Bài ${index + 1} / ${list.length}` : ''}
          </p>
          {/* Điện thoại: nút tròn dễ chạm. Website: nút có chữ, nói rõ bấm là làm gì. */}
          <CircleArrowLink
            href={href}
            label={lesson ? `Mở bài ${lesson.title}` : `Mở khóa ${course.courseTitle}`}
            tone="light"
            stretched
            className="mt-6 md:hidden"
          />
          <ButtonLink href={href} className="mt-4 hidden md:inline-flex">
            {lesson?.progressStatus === 'IN_PROGRESS' ? 'Học tiếp' : 'Bắt đầu bài'}
            <Icon name="arrow-right" size={16} />
          </ButtonLink>
        </div>
        <Mascot state="happy" size={104} surface="color-on-phone" priority="companion" />
      </ColorBlock>
    </section>
  );
}

function CourseRow({ course }: { course: ProgressCourse }) {
  return (
    <Link
      href={`/courses/${course.courseId}`}
      className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-panel-2 focus-ring sm:px-5"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-fg">{course.courseTitle}</p>
        <div className="mt-1.5 flex items-center gap-3">
          <ProgressBar
            size="xs"
            value={course.completed}
            max={course.total}
            tone={course.percent === 100 ? 'success' : 'sky'}
            label={`${course.courseTitle}: ${course.completed} trên ${course.total} bài`}
            className="max-w-48"
          />
          <span className="shrink-0 text-xs tabular-nums text-fg-subtle">
            {course.percent === 100 ? 'Hoàn tất' : `${course.percent}%`}
          </span>
        </div>
      </div>
      <Icon
        name="chevron-right"
        size={16}
        className="shrink-0 text-fg-subtle transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  );
}
