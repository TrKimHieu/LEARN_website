'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ProgressCourse } from '@learn/api-contracts';
import {
  useLessons,
  useProgressCourses,
  useProgressHistory,
  useProgressOverview,
} from '@/features/learning/learning-api';
import { CourseCover } from '@/components/shared/course-cover';
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
  StatCard,
  StatStrip,
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
        <Skeleton className="h-10 w-56" />
        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
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
        <Header>
          Bắt đầu bằng một khóa học: đặt tên, tải tài liệu lên, rồi để AI dựng lộ trình bài học.
        </Header>
        <EmptyState
          className="mt-10"
          title="Chưa có khóa học nào"
          description="Tạo khóa học đầu tiên và tải tài liệu lên. AI sẽ sinh bài học và bài tập từ chính nội dung đó."
          action={{ label: 'Tạo khóa học đầu tiên', onClick: () => router.push('/courses/new') }}
        />
      </>
    );
  }

  return (
    <>
      <Header>
        {data.totalLessons > 0 ? (
          <>
            Bạn đã xong <b className="font-medium text-fg">{data.completedLessons}</b> trên{' '}
            {data.totalLessons} bài
            {data.activeStreak > 0 && (
              <>
                , học liên tiếp <b className="font-medium text-fg">{data.activeStreak} ngày</b>
              </>
            )}
            .
          </>
        ) : (
          'Các khóa của bạn chưa có bài học nào. Tải tài liệu lên để AI dựng lộ trình.'
        )}
      </Header>

      <section aria-labelledby="stats-title" className="mt-10">
        <h2 id="stats-title" className="sr-only">
          Số liệu học tập
        </h2>
        <StatStrip>
          <StatCard
            icon="flame"
            tone="peach"
            label="Chuỗi ngày học"
            value={String(data.activeStreak)}
            sub="ngày liên tiếp"
          />
          <StatCard
            icon="book-check"
            tone="mint"
            label="Bài đã xong"
            value={`${data.completedLessons}/${data.totalLessons}`}
          />
          <StatCard
            icon="star"
            tone="lemon"
            label="Điểm trung bình"
            value={data.averageScore !== null ? data.averageScore.toFixed(1) : 'Chưa có'}
            sub={data.averageScore === null ? 'chưa nộp bài nào' : undefined}
          />
          <StatCard icon="layers" tone="sky" label="Khóa học" value={String(data.courseCount)} />
        </StatStrip>
      </section>

      <div className="mt-14 grid grid-cols-1 gap-x-14 gap-y-14 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="min-w-0 space-y-14">
          {/* ------------------------------------------------- học tiếp */}
          {courses.isLoading && <Skeleton className="h-44 rounded-card" />}
          {courses.isError && (
            <InlineError>
              {errorText(courses.error, 'Không tải được khóa học đang dở.')}
            </InlineError>
          )}
          {next && <ResumeCard course={next} />}

          {/* ------------------------------------------------- khóa học */}
          <section aria-labelledby="courses-title">
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
            {courses.data && ordered.length === 0 && (
              <p className="text-sm text-fg-subtle">Các khóa chưa có bài học nào.</p>
            )}
            {ordered.length > 0 && (
              <Card padded={false}>
                <ul className="divide-y divide-line">
                  {ordered.slice(0, 5).map((c) => (
                    <li key={c.courseId}>
                      <CourseRow course={c} />
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </section>
        </div>

        {/* ------------------------------------------------- cột phụ */}
        <aside className="min-w-0" aria-label="Hoạt động gần đây">
          <section aria-labelledby="activity-title">
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
              <p className="text-sm leading-relaxed text-fg-subtle">
                Chưa có lần làm bài nào. Kết quả bài tập sẽ hiện ở đây.
              </p>
            )}
            {history.data && history.data.items.length > 0 && (
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

function Header({ children }: { children: React.ReactNode }) {
  return (
    <header>
      <h1 className="font-display text-[2.375rem] font-semibold leading-[1.08] text-fg sm:text-[3.125rem]">
        Tổng quan
      </h1>
      <p className="mt-2 max-w-xl text-[0.9375rem] leading-relaxed text-fg-subtle">{children}</p>
    </header>
  );
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
      <h2 id="resume-title" className="mb-3 text-base font-semibold text-fg">
        Học tiếp
      </h2>
      <div className="flex flex-col overflow-hidden rounded-card border border-line bg-panel sm:flex-row">
        <CourseCover
          id={course.courseId}
          title={course.courseTitle}
          className="h-24 shrink-0 sm:h-auto sm:w-44"
        />
        <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
          <p className="truncate text-[0.8125rem] text-fg-subtle">{course.courseTitle}</p>
          {lessons.isLoading ? (
            <Skeleton className="mt-2 h-7 w-3/4" />
          ) : (
            <p className="mt-1 text-2xl font-semibold leading-snug text-fg">
              {lesson ? lesson.title : course.courseTitle}
            </p>
          )}
          {lesson && index >= 0 && (
            <p className="mt-1 text-[0.8125rem] text-fg-subtle">
              Bài {index + 1} / {list.length}
              {lesson.progressStatus === 'IN_PROGRESS' ? ' · đang học dở' : ''}
            </p>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-4">
            <ButtonLink href={href}>
              {lesson?.progressStatus === 'IN_PROGRESS' ? 'Học tiếp' : 'Bắt đầu bài'}
              <Icon name="arrow-right" size={16} />
            </ButtonLink>
            <div className="flex min-w-40 flex-1 items-center gap-3">
              <ProgressBar
                size="sm"
                value={course.completed}
                max={course.total}
                label={`${course.courseTitle}: ${course.completed} trên ${course.total} bài`}
              />
              <span className="shrink-0 text-xs tabular-nums text-fg-subtle">
                {course.completed}/{course.total} bài
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CourseRow({ course }: { course: ProgressCourse }) {
  return (
    <Link
      href={`/courses/${course.courseId}`}
      className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-panel-2 focus-ring sm:px-5"
    >
      <CourseCover
        id={course.courseId}
        title={course.courseTitle}
        showInitial={false}
        className="size-10 shrink-0 rounded-md"
      />
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
