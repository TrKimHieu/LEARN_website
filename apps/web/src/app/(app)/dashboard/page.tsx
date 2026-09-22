'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProgressCourses, useProgressHistory, useProgressOverview } from '@/lib/learning-api';
import {
  Badge,
  ButtonLink,
  Card,
  CardTitle,
  Icon,
  PageHeader,
  ProgressBar,
  Skeleton,
  type IconName,
} from '@/components/ui';
import { EmptyState, ErrorState, InlineError } from '@/components/ui/states';
import { errorText } from '@/lib/api-client';
import { Reveal, StaggerItem, StaggerList } from '@/lib/motion';
import { absoluteTime, relativeTime } from '@/lib/format';

/** Số khóa học đang dở hiện ở mục "Tiếp tục học". */
const CONTINUE_LIMIT = 3;
/** Số lần làm bài gần nhất hiện ở mục hoạt động. */
const HISTORY_LIMIT = 5;

export default function DashboardPage() {
  const router = useRouter();
  const overview = useProgressOverview();
  const courses = useProgressCourses();
  const history = useProgressHistory(HISTORY_LIMIT);

  if (overview.isLoading) {
    return (
      <section>
        <PageHeader title="Tổng quan" />
        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </section>
    );
  }

  if (overview.isError || !overview.data) {
    return (
      <section>
        <PageHeader title="Tổng quan" />
        <ErrorState
          title="Không tải được tổng quan"
          description={errorText(overview.error, 'Vui lòng thử lại.')}
          onRetry={() => void overview.refetch()}
        />
      </section>
    );
  }

  const data = overview.data;

  if (data.courseCount === 0) {
    return (
      <section>
        <PageHeader title="Tổng quan" />
        <EmptyState
          title="Chưa có khóa học nào"
          description="Tạo khóa học đầu tiên và tải tài liệu lên để AI sinh bài học cho bạn."
          action={{ label: 'Tạo khóa học đầu tiên', onClick: () => router.push('/courses/new') }}
        />
      </section>
    );
  }

  // Khóa học đang dở, ưu tiên cái gần hoàn thành nhất để đẩy người học về đích.
  // `courses.data?.courses ?? []` chỉ an toàn khi có data — trước đây mục "Tiếp tục học"
  // không hề có nhánh loading/error riêng, nên khi truy vấn `courses` lỗi, mục này lặng lẽ
  // biến mất thay vì báo lỗi.
  const inProgress = (courses.data?.courses ?? [])
    .filter((c) => c.percent > 0 && c.percent < 100)
    .sort((a, b) => b.percent - a.percent)
    .slice(0, CONTINUE_LIMIT);

  return (
    <section>
      <PageHeader title="Tổng quan" />

      {/* Cột giữa chỉ ~736px khi có rail phải — 4 cột làm nhãn bị cắt, nên chỉ
          trải 4 cột từ 2xl trở lên. */}
      <StaggerList className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <StaggerItem>
          <StatCard icon="layers" tone="sky" label="Khóa học" value={String(data.courseCount)} />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            icon="check"
            tone="success"
            label="Bài đã hoàn thành"
            value={`${data.completedLessons}/${data.totalLessons}`}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            icon="star"
            tone="sky"
            label="Điểm trung bình"
            value={data.averageScore !== null ? data.averageScore.toFixed(1) : '—'}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            icon="flame"
            tone="warning"
            label="Chuỗi ngày học"
            value={String(data.activeStreak)}
          />
        </StaggerItem>
      </StaggerList>

      {/* ------------------------------------------------ tiếp tục học */}
      {courses.isLoading && (
        <Reveal delay={0.12} className="mt-8">
          <h2 className="mb-3 text-lg font-bold text-ink-900">Tiếp tục học</h2>
          <ul className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <li key={i}>
                <Skeleton className="h-40" />
              </li>
            ))}
          </ul>
        </Reveal>
      )}

      {courses.isError && (
        <Reveal delay={0.12} className="mt-8">
          <h2 className="mb-3 text-lg font-bold text-ink-900">Tiếp tục học</h2>
          <InlineError>
            {errorText(courses.error, 'Không tải được danh sách khóa học đang dở.')}
          </InlineError>
        </Reveal>
      )}

      {!courses.isLoading && !courses.isError && inProgress.length > 0 && (
        <Reveal delay={0.12} className="mt-8">
          <h2 className="mb-3 text-lg font-bold text-ink-900">Tiếp tục học</h2>
          <ul className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {inProgress.map((c) => (
              <li key={c.courseId}>
                <Link href={`/courses/${c.courseId}`} className="block rounded-card focus-ring">
                  <Card className="h-full transition-shadow hover:shadow-raised">
                    <CardTitle className="line-clamp-2">{c.courseTitle}</CardTitle>
                    <div className="mt-3 flex items-center gap-2">
                      <ProgressBar
                        size="sm"
                        value={c.completed}
                        max={c.total}
                        label={`${c.courseTitle}: ${c.completed} trên ${c.total} bài`}
                      />
                      <span className="shrink-0 text-xs font-bold tabular-nums text-ink-700">
                        {c.percent}%
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-ink-500">
                      {c.completed}/{c.total} bài
                    </p>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      )}

      {/* ------------------------------------------------ hoạt động */}
      <Reveal delay={0.18} className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-ink-900">Hoạt động gần đây</h2>
          <ButtonLink href="/progress" variant="secondary" size="sm">
            Xem tiến trình
          </ButtonLink>
        </div>

        {history.isLoading && <Skeleton className="h-32" />}
        {history.isError && (
          <ErrorState
            title="Không tải được hoạt động"
            description={errorText(history.error, 'Vui lòng thử lại.')}
            onRetry={() => void history.refetch()}
          />
        )}
        {history.data && history.data.items.length === 0 && (
          <EmptyState
            size="compact"
            title="Chưa có lần làm bài nào"
            description="Mở một bài học và làm bài tập để bắt đầu."
          />
        )}
        {history.data && history.data.items.length > 0 && (
          <Card padded={false}>
            <ul className="divide-y divide-surface-200">
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
        )}
      </Reveal>
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: IconName;
  label: string;
  value: string;
  tone: 'sky' | 'success' | 'warning';
}) {
  const chip =
    tone === 'success'
      ? 'bg-success-50 text-success-700'
      : tone === 'warning'
        ? 'bg-warning-50 text-warning-700'
        : 'bg-sky-50 text-sky-700';
  return (
    <Card className="flex items-center gap-4">
      <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${chip}`}>
        <Icon name={icon} size={22} strokeWidth={2.5} />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-bold tabular-nums text-ink-900">{value}</p>
        <p className="mt-0.5 text-xs font-medium text-ink-500">{label}</p>
      </div>
    </Card>
  );
}
