'use client';

import Link from 'next/link';
import { Mascot, type MascotState } from '@/components/shared/mascot';
import { useProgressCourses, useProgressHistoryPages } from '@/features/learning/learning-api';
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
import { usePageTitle } from '@/lib/use-page-title';
import { buildWeeklyActivity } from '@/features/learning/weekly-activity';

const PAGE_SIZE = 10;

export default function ProgressPage() {
  usePageTitle('Tiến trình');
  const courses = useProgressCourses();
  const history = useProgressHistoryPages(PAGE_SIZE);
  const items = history.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <>
      <PageHeader
        title="Tiến trình"
        description="Tiến độ theo từng khóa học và lịch sử các lần làm bài tập."
      />

      {/* Hai ô cao bằng nhau: biểu đồ giãn cột, ô khóa học đẩy lời động viên xuống đáy. */}
      <div
        className={`grid gap-6 ${items.length > 0 ? 'lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]' : ''}`}
      >
        {items.length > 0 && <WeeklyChart items={items} />}

        {/* --------------------------------------------- theo khóa học */}
        <section
          aria-labelledby="by-course"
          className="flex flex-col rounded-panel border border-line bg-panel p-6 shadow-card"
        >
          <SectionTitle id="by-course">Theo khóa học</SectionTitle>

          {courses.isLoading && (
            <div className="grid gap-3" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-16 rounded-control" />
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
            <>
              <StaggerList as="ul" className="divide-y divide-line">
                {courses.data.courses.map((c) => (
                  <StaggerItem as="li" key={c.courseId}>
                    <Link
                      href={`/courses/${c.courseId}`}
                      className="group -mx-2 flex items-center gap-4 rounded-control px-2 py-3 transition-colors duration-150 hover:bg-muted focus-ring"
                    >
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
                        <span className="text-xs font-semibold tabular-nums text-fg">
                          {c.percent}%
                        </span>
                      </ProgressRing>
                    </Link>
                  </StaggerItem>
                ))}
              </StaggerList>
              <CompanionNote courses={courses.data.courses} />
            </>
          )}
        </section>
      </div>

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
                          {item.exerciseTitle ? ` · ${item.exerciseTitle}` : ''}
                          <span className="hidden sm:inline">
                            {' · '}
                            <time dateTime={item.createdAt} title={absoluteTime(item.createdAt)}>
                              {relativeTime(item.createdAt)}
                            </time>
                          </span>
                        </p>
                        <p className="text-xs text-fg-subtle sm:hidden">
                          <time dateTime={item.createdAt}>{relativeTime(item.createdAt)}</time>
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

/** Mascot đồng hành: nói đúng tình hình học hiện tại, đặt ở đáy ô để lấp chỗ trống. */
function CompanionNote({
  courses,
}: {
  courses: ReadonlyArray<{ completed: number; total: number }>;
}) {
  const completed = courses.reduce((sum, c) => sum + c.completed, 0);
  const total = courses.reduce((sum, c) => sum + c.total, 0);
  const remaining = total - completed;
  let state: MascotState = 'happy';
  let text = `Bạn đã xong ${completed}/${total} bài. Còn ${remaining} bài nữa thôi, cố lên nhé!`;
  if (total === 0) {
    state = 'idle';
    text = 'Khóa học chưa có bài. Sinh bài từ tài liệu rồi mình cùng học nhé.';
  } else if (remaining === 0) {
    state = 'proud';
    text = 'Bạn đã học xong tất cả các bài. Giỏi lắm!';
  } else if (completed === 0) {
    state = 'idle';
    text = `Có ${total} bài đang đợi. Mình bắt đầu từ bài đầu tiên nhé.`;
  }
  return (
    <div className="mt-auto flex items-center gap-3 pt-5">
      <Mascot state={state} size={72} />
      <p className="min-w-0 flex-1 rounded-card bg-muted px-4 py-3 text-sm leading-relaxed text-fg-muted">
        {text}
      </p>
    </div>
  );
}

/** Một mốc đo duy nhất: số lần làm bài theo ngày. Số in ngay trên cột nên không cần trục. */
function WeeklyChart({ items }: { items: ReadonlyArray<{ createdAt: string }> }) {
  const week = buildWeeklyActivity(items);
  const max = Math.max(...week.map((d) => d.count), 1);
  const total = week.reduce((sum, d) => sum + d.count, 0);
  return (
    <section
      aria-labelledby="week-title"
      className="flex flex-col rounded-panel border-[1.5px] border-brand bg-brand-soft p-6 md:border md:border-line md:bg-panel md:shadow-card"
    >
      <h2 id="week-title" className="font-display text-[1.75rem] font-bold leading-tight text-fg">
        <span className="tabular-nums">{total}</span> lần làm bài
      </h2>
      <p className="mt-1 text-sm text-fg-subtle">
        Trong 7 ngày gần nhất, tính trên lịch sử đã tải.
      </p>
      <ol className="mt-6 grid min-h-52 flex-1 grid-cols-7 gap-2 md:min-h-40 md:gap-3">
        {week.map((d) => (
          <li key={d.key} className="flex min-w-0 flex-col items-center justify-end gap-2">
            <div className="flex w-full max-w-14 flex-1 items-end rounded-[1.25rem] bg-brand/20 md:bg-muted">
              {d.count > 0 && (
                <div
                  className="flex w-full items-start justify-center rounded-[1.25rem] bg-brand pt-2 text-xs font-bold tabular-nums text-on-brand"
                  style={{ height: `${Math.max(24, (d.count / max) * 100)}%` }}
                >
                  {d.count}
                </div>
              )}
            </div>
            <span className={`text-xs ${d.isToday ? 'font-bold text-fg' : 'text-fg-subtle'}`}>
              {d.label}
              <span className="sr-only">: {d.count} lần</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
