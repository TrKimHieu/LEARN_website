'use client';

import { useRouter } from 'next/navigation';
import { Mascot } from '@/components/shared/mascot';
import {
  Badge,
  ButtonLink,
  Card,
  EmptyState,
  ErrorState,
  Icon,
  ProgressRing,
  Skeleton,
  UserText,
  cn,
  type IconName,
} from '@/components/ui';
import { errorDetail, errorText } from '@/lib/api-client';
import { moodFor } from './mood';
import { isDone, taskHref, type TodayTask } from './today-plan';
import { useTodayPlan } from './use-today-plan';

/** Màn Học (spec 4.2): mascot, chuỗi ngày, vòng mục tiêu ngày và 2–4 việc hôm nay. */
export function TodayView() {
  const router = useRouter();
  const { gate, failed, retry, plan, day, overview, liveDue, previousSeen, studying } =
    useTodayPlan();
  const lastStudyDay = overview.data?.lastStudyDay ?? null;

  if (gate === 'error') {
    return (
      <ErrorState
        title="Không tải được việc hôm nay"
        description={errorText(failed?.error, 'Vui lòng thử lại.')}
        detail={errorDetail(failed?.error)}
        onRetry={retry}
      />
    );
  }

  if (overview.data?.courseCount === 0) {
    return (
      <EmptyState
        title="Chưa có khóa học nào"
        description="Tạo khóa học đầu tiên và tải tài liệu lên. AI sẽ sinh bài học và bài tập từ chính nội dung đó."
        mascot="listening"
        action={{ label: 'Tạo khóa học đầu tiên', onClick: () => router.push('/courses/new') }}
      />
    );
  }

  if (!overview.data || !plan) {
    return (
      <div aria-busy="true" aria-live="polite" className="space-y-4">
        <span className="sr-only">Đang tải việc hôm nay</span>
        <Skeleton className="h-20 rounded-card" />
        <Skeleton className="h-48 rounded-card" />
      </div>
    );
  }

  const total = plan.tasks.length;
  const doneCount = plan.tasks.filter((t) => isDone(plan, t, liveDue)).length;
  const allDone = total > 0 && doneCount === total;
  const streak = overview.data.activeStreak;
  const mood = moodFor({
    today: day,
    lastStudyDay,
    previousSeenStudyDay: previousSeen,
    allDone,
    activeStreak: streak,
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-4">
        <Mascot state={mood} size={72} />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-2xl font-bold">Hôm nay</h2>
          {streak > 0 && (
            <Badge tone="warning" className="mt-1">
              🔥 {streak} ngày liền
            </Badge>
          )}
        </div>
        {total > 0 && (
          <ProgressRing
            value={doneCount}
            max={total}
            size={56}
            stroke={6}
            tone={allDone ? 'success' : 'sky'}
            label={`Đã xong ${doneCount} trên ${total} việc hôm nay`}
          >
            <span className="text-sm font-semibold tabular-nums">
              {doneCount}/{total}
            </span>
          </ProgressRing>
        )}
      </div>

      {total === 0 ? (
        <p className="mt-6 text-sm text-fg-muted">Hôm nay không còn việc nào.</p>
      ) : (
        <Card padded={false} className="mt-6">
          <ul className="divide-y divide-line">
            {plan.tasks.map((task) => (
              <li key={task.id}>
                <TaskRow task={task} done={isDone(plan, task, liveDue)} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-fg-subtle">
        <ButtonLink href="/focus" variant="link" size="sm" className="relative">
          Pomodoro
        </ButtonLink>
        <span aria-hidden="true">·</span>
        <ButtonLink href="/courses" variant="link" size="sm" className="relative">
          Khóa học đang học{studying > 0 && ` (${studying})`}
        </ButtonLink>
      </p>
    </div>
  );
}

function taskView(task: TodayTask): {
  icon: IconName;
  title: React.ReactNode;
  sub: React.ReactNode;
  action: string;
  href: string;
} {
  switch (task.kind) {
    case 'review':
      return { icon: 'layers', title: `Ôn ${task.dueCount} thẻ đến hạn`, sub: null, action: 'Ôn', href: taskHref(task) };
    case 'lesson':
      return {
        icon: 'book',
        title: <UserText>{task.title}</UserText>,
        sub: (
          <>
            <UserText>{task.courseTitle}</UserText> · Bài {task.index}/{task.total}
          </>
        ),
        action: 'Học',
        href: taskHref(task),
      };
    case 'exercise':
      return {
        icon: 'retry',
        title: (
          <>
            Luyện lại: <UserText>{task.lessonTitle}</UserText>
          </>
        ),
        sub: `Lần trước ${task.score} điểm`,
        action: 'Làm lại',
        href: taskHref(task),
      };
  }
}

function TaskRow({ task, done }: { task: TodayTask; done: boolean }) {
  const v = taskView(task);
  return (
    <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
      <Icon
        name={done ? 'circle-check' : v.icon}
        size={20}
        filled={done}
        className={cn('shrink-0', done ? 'text-ok' : 'text-fg-muted')}
      />
      <div className={cn('min-w-0 flex-1', done && 'text-fg-subtle')}>
        <p className={cn('line-clamp-2 text-sm font-medium', !done && 'text-fg')}>
          {v.title}
          {done && <span className="sr-only">, đã xong</span>}
        </p>
        {v.sub && <p className="mt-0.5 truncate text-xs text-fg-subtle">{v.sub}</p>}
      </div>
      {!done && (
        <ButtonLink href={v.href} size="sm" variant={task.kind === 'exercise' ? 'secondary' : 'primary'}>
          {v.action}
        </ButtonLink>
      )}
    </div>
  );
}
