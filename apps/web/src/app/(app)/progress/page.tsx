'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useProgressCourses, useProgressHistory } from '@/lib/learning-api';
import { Badge, Button, Card, CardTitle, PageHeader, ProgressBar, Skeleton } from '@/components/ui';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { errorText } from '@/lib/api-client';
import { absoluteTime, relativeTime } from '@/lib/format';

const PAGE_SIZE = 10;

export default function ProgressPage() {
  const courses = useProgressCourses();
  const [limit, setLimit] = useState(PAGE_SIZE);
  const history = useProgressHistory(limit);

  return (
    <section>
      <PageHeader title="Tiến trình" />

      {/* --------------------------------------------- theo khóa học */}
      {courses.isLoading && (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      )}

      {courses.isError && (
        <ErrorState
          title="Không tải được tiến trình"
          description={errorText(courses.error, 'Vui lòng thử lại.')}
          onRetry={() => void courses.refetch()}
        />
      )}

      {courses.data && courses.data.courses.length === 0 && (
        <EmptyState
          title="Chưa có khóa học nào để theo dõi"
          description="Tiến trình sẽ xuất hiện ở đây khi bạn bắt đầu học."
        />
      )}

      {courses.data && courses.data.courses.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {courses.data.courses.map((c) => (
            <li key={c.courseId}>
              <Link
                href={`/courses/${c.courseId}`}
                className="block h-full rounded-card focus-ring"
              >
                <Card className="h-full transition-shadow hover:shadow-raised">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="line-clamp-2">{c.courseTitle}</CardTitle>
                    <Badge
                      tone={c.percent === 100 ? 'success' : c.percent > 0 ? 'info' : 'neutral'}
                      icon={c.percent === 100 ? 'check' : undefined}
                      className="shrink-0 tabular-nums"
                    >
                      {c.percent}%
                    </Badge>
                  </div>
                  <ProgressBar
                    className="mt-3"
                    tone={c.percent === 100 ? 'success' : 'sky'}
                    value={c.completed}
                    max={c.total}
                    label={`${c.courseTitle}: ${c.completed} trên ${c.total} bài`}
                  />
                  <p className="mt-2 text-xs text-ink-500">
                    {c.completed}/{c.total} bài đã hoàn thành
                  </p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* ------------------------------------------ lịch sử làm bài */}
      <h2 className="mb-3 mt-10 text-lg font-bold text-ink-900">Lịch sử làm bài</h2>

      {history.isLoading && <Skeleton className="h-40" />}

      {history.isError && (
        <ErrorState
          title="Không tải được lịch sử"
          description={errorText(history.error, 'Vui lòng thử lại.')}
          onRetry={() => void history.refetch()}
        />
      )}

      {history.data && history.data.items.length === 0 && (
        <EmptyState size="compact" title="Chưa có lần làm bài nào" />
      )}

      {history.data && history.data.items.length > 0 && (
        <>
          <Card padded={false}>
            <ul className="divide-y-2 divide-surface-200">
              {history.data.items.map((item) => {
                const passed = item.maxScore > 0 && item.score / item.maxScore >= 0.7;
                return (
                  <li key={item.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ink-900">{item.lessonTitle}</p>
                      <p className="truncate text-xs text-ink-500">
                        {item.courseTitle}
                        {item.exerciseTitle ? ` · ${item.exerciseTitle}` : ''} ·{' '}
                        <time dateTime={item.createdAt} title={absoluteTime(item.createdAt)}>
                          {relativeTime(item.createdAt)}
                        </time>
                      </p>
                    </div>
                    <Badge tone={passed ? 'success' : 'warning'} className="shrink-0 tabular-nums">
                      {item.score}/{item.maxScore}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          </Card>

          {history.data.items.length >= limit && (
            <div className="mt-4 flex justify-center">
              <Button variant="secondary" onClick={() => setLimit((l) => l + PAGE_SIZE)}>
                Xem thêm
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
