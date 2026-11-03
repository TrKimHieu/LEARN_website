'use client';

import Link from 'next/link';
import { useProgressCourses, useProgressHistoryPages } from '@/features/learning/learning-api';
import { CourseCover } from '@/components/shared/course-cover';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Icon,
  PageHeader,
  ProgressRing,
  SectionTitle,
  Skeleton,
} from '@/components/ui';
import { StaggerItem, StaggerList } from '@/lib/motion';
import { errorDetail, errorText } from '@/lib/api-client';
import { absoluteTime, relativeTime } from '@/lib/format';

const PAGE_SIZE = 10;

export default function ProgressPage() {
  const courses = useProgressCourses();
  const history = useProgressHistoryPages(PAGE_SIZE);
  const items = history.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <>
      <PageHeader
        title="Tiến trình"
        description="Tiến độ theo từng khóa học và lịch sử các lần làm bài tập."
      />

      {/* --------------------------------------------- theo khóa học */}
      <section aria-labelledby="by-course">
        <SectionTitle id="by-course">Theo khóa học</SectionTitle>

        {courses.isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-28 rounded-card" />
            ))}
          </div>
        )}

        {courses.isError && (
          <ErrorState
            title="Không tải được tiến trình"
            description={errorText(courses.error, 'Vui lòng thử lại.')}
            detail={errorDetail(courses.error)}
            onRetry={() => void courses.refetch()}
          />
        )}

        {courses.data && courses.data.courses.length === 0 && (
          <EmptyState
            title="Chưa có khóa học nào để theo dõi"
            description="Tiến trình sẽ xuất hiện ở đây khi bạn bắt đầu học một khóa."
          />
        )}

        {courses.data && courses.data.courses.length > 0 && (
          <StaggerList as="ul" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {courses.data.courses.map((c) => (
              <StaggerItem as="li" key={c.courseId}>
                <Link
                  href={`/courses/${c.courseId}`}
                  className="group flex h-full items-center gap-4 rounded-card border border-line bg-panel p-4 shadow-card transition-[border-color,box-shadow] duration-200 hover:border-accent-line hover:shadow-raised focus-ring"
                >
                  <CourseCover
                    id={c.courseId}
                    title={c.courseTitle}
                    className="size-14 shrink-0 rounded-control [&_span]:bottom-1 [&_span]:left-2 [&_span]:text-2xl"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug text-fg">
                      {c.courseTitle}
                    </p>
                    <p className="mt-1 text-xs text-fg-subtle">
                      {c.completed}/{c.total} bài đã hoàn thành
                    </p>
                    {c.percent === 100 && (
                      <Badge tone="success" icon="check" className="mt-2">
                        Hoàn tất
                      </Badge>
                    )}
                  </div>
                  <ProgressRing
                    size={56}
                    stroke={6}
                    tone={c.percent === 100 ? 'success' : 'sky'}
                    value={c.completed}
                    max={Math.max(c.total, 1)}
                    label={`${c.courseTitle}: ${c.completed} trên ${c.total} bài`}
                  >
                    <span className="text-xs font-semibold tabular-nums text-fg">{c.percent}%</span>
                  </ProgressRing>
                </Link>
              </StaggerItem>
            ))}
          </StaggerList>
        )}
      </section>

      {/* ------------------------------------------ lịch sử làm bài */}
      <section aria-labelledby="history" className="mt-12">
        <SectionTitle id="history" description="Bấm vào một lần làm bài để mở lại bài học đó.">
          Lịch sử làm bài
        </SectionTitle>

        {history.isLoading && <Skeleton className="h-72 rounded-card" />}

        {history.isError && (
          <ErrorState
            title="Không tải được lịch sử"
            description={errorText(history.error, 'Vui lòng thử lại.')}
            detail={errorDetail(history.error)}
            onRetry={() => void history.refetch()}
          />
        )}

        {history.data && items.length === 0 && (
          <EmptyState
            size="compact"
            title="Chưa có lần làm bài nào"
            description="Làm bài tập ở cuối mỗi bài học, kết quả sẽ hiện ở đây."
          />
        )}

        {items.length > 0 && (
          <>
            <Card padded={false}>
              <ol className="divide-y divide-line">
                {items.map((item) => {
                  const ratio = item.maxScore > 0 ? item.score / item.maxScore : 0;
                  // Ngưỡng đạt là của từng bài tập, server tính sẵn — không tự suy từ 70%.
                  const passed = item.passed;
                  return (
                    <li
                      key={item.id}
                      className="relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5 transition-colors duration-150 hover:bg-muted has-[a:focus-visible]:bg-muted sm:gap-4 sm:px-5"
                    >
                      <Icon
                        name={passed ? 'circle-check' : 'retry'}
                        size={20}
                        filled={passed}
                        className={passed ? 'text-ok' : 'text-warn'}
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/courses/${item.courseId}/lessons/${item.lessonId}`}
                          className="block truncate text-sm font-semibold text-fg outline-none after:absolute after:inset-0 focus-visible:underline"
                        >
                          {item.lessonTitle}
                        </Link>
                        <p className="truncate text-xs text-fg-subtle">
                          {item.courseTitle}
                          {item.exerciseTitle ? ` · ${item.exerciseTitle}` : ''} ·{' '}
                          <time dateTime={item.createdAt} title={absoluteTime(item.createdAt)}>
                            {relativeTime(item.createdAt)}
                          </time>
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="hidden w-24 sm:block" aria-hidden>
                          <span className="block h-1.5 overflow-hidden rounded-pill bg-track">
                            <span
                              className={
                                passed
                                  ? 'block h-full rounded-pill bg-fg'
                                  : 'block h-full rounded-pill bg-fg-subtle'
                              }
                              style={{ width: `${Math.round(ratio * 100)}%` }}
                            />
                          </span>
                        </span>
                        <Badge tone={passed ? 'success' : 'warning'} className="tabular-nums">
                          {item.score}/{item.maxScore}
                          <span className="sr-only">{passed ? ', đạt' : ', chưa đạt'}</span>
                        </Badge>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </Card>

            {history.hasNextPage && (
              <div className="mt-5 flex justify-center">
                <Button
                  variant="secondary"
                  onClick={() => void history.fetchNextPage()}
                  loading={history.isFetchingNextPage}
                >
                  Xem thêm
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
