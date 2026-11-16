'use client';

import { useEffect, useState } from 'react';
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
import { useDueCount } from '@/features/flashcards/flashcards-api';
import {
  useProgressCourses,
  useProgressHistory,
  useProgressOverview,
} from '@/features/learning/learning-api';
import { errorDetail, errorText } from '@/lib/api-client';
import { TODAY_KEY, todayKey } from '@/lib/today-store';
import { moodFor } from './mood';
import { buildTasks, isDone, parsePlan, planGate, reconcile, type SavedPlan, type TodayTask } from './today-plan';
import { useNextLessons } from './use-next-lessons';

/** Lịch sử đủ dài để thấy bài chưa đạt mới nhất và lần đạt sau đó (nếu có). */
const HISTORY_LIMIT = 20;
/** Ngày học gần nhất trước hôm nay mà màn này đã thấy, để nhận ra lần quay lại sau khi nghỉ. */
const MOOD_KEY = 'learn.mood';

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage unavailable: the plan just isn't kept across visits
  }
}

/** Ngày hôm nay theo máy; kiểm lại mỗi phút khi tab đang mở để danh sách đổi khi qua ngày. */
function useToday() {
  const [day, setDay] = useState(() => todayKey());
  useEffect(() => {
    const check = () => {
      if (!document.hidden) setDay(todayKey());
    };
    const timer = setInterval(check, 60_000);
    document.addEventListener('visibilitychange', check);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', check);
    };
  }, []);
  return day;
}

/** Màn Học (spec 4.2): mascot, chuỗi ngày, vòng mục tiêu ngày và 2–4 việc hôm nay. */
export function TodayView() {
  const router = useRouter();
  const day = useToday();
  const overview = useProgressOverview();
  const courses = useProgressCourses();
  const due = useDueCount();
  const history = useProgressHistory(HISTORY_LIMIT);
  const next = useNextLessons(courses.data?.courses ?? []);
  const [plan, setPlan] = useState<SavedPlan | null>(null);
  const [previousSeen, setPreviousSeen] = useState<string | null>(null);

  const sources = [overview, courses, due, history, ...next.queries];
  const gate = planGate(sources);
  const ready = gate === 'ready';
  const failed = sources.find((q) => q.isLoadingError);

  // Danh sách chốt lần đầu trong ngày; các lần sau chỉ đọc lại bản đã lưu.
  useEffect(() => {
    if (!ready) return;
    const saved = parsePlan(readStorage(TODAY_KEY));
    const current = reconcile(saved, buildTasks({ dueCount: due.data ?? 0, nextLessons: next.lessons, history: history.data?.items ?? [] }), day);
    if (current !== saved) writeStorage(TODAY_KEY, JSON.stringify(current));
    setPlan(current);
    // Chỉ chạy khi dữ liệu vừa đủ hoặc qua ngày: sau lần chốt, reconcile luôn trả bản đã lưu.
  }, [ready, day]);

  const lastStudyDay = overview.data?.lastStudyDay ?? null;
  useEffect(() => {
    if (!overview.data) return;
    setPreviousSeen(readStorage(MOOD_KEY));
    // Chỉ ghi ngày học trước hôm nay, nên hôm nay vừa học xong vẫn so được với lần học trước.
    if (lastStudyDay && lastStudyDay !== day) writeStorage(MOOD_KEY, lastStudyDay);
  }, [overview.data, lastStudyDay, day]);

  if (gate === 'error') {
    return (
      <ErrorState
        title="Không tải được việc hôm nay"
        description={errorText(failed?.error, 'Vui lòng thử lại.')}
        detail={errorDetail(failed?.error)}
        onRetry={() => sources.forEach((q) => q.isLoadingError && void q.refetch())}
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

  // Lỗi đếm thẻ thì không tự đánh dấu xong việc ôn.
  const liveDue = due.data ?? 1;
  const total = plan.tasks.length;
  const doneCount = plan.tasks.filter((t) => isDone(plan, t, liveDue)).length;
  const allDone = total > 0 && doneCount === total;
  const streak = overview.data.activeStreak;
  const mood = moodFor({ today: day, lastStudyDay, previousSeenStudyDay: previousSeen, allDone });

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
          Khóa học đang học{next.studying > 0 && ` (${next.studying})`}
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
      return { icon: 'layers', title: `Ôn ${task.dueCount} thẻ đến hạn`, sub: null, action: 'Ôn', href: '/review' };
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
        href: `/courses/${task.courseId}/lessons/${task.lessonId}`,
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
        href: `/courses/${task.courseId}/lessons/${task.lessonId}/practice?exercise=${encodeURIComponent(task.exerciseId)}`,
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
