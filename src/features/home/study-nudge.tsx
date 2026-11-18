'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Mascot } from '@/components/shared/mascot';
import { Button, ButtonLink } from '@/components/ui';
import { TODAY_KEY } from '@/lib/today-store';
import { moodFor } from './mood';
import {
  NUDGE_KEY,
  freshestPlan,
  isLearningPath,
  nudgeSummary,
  parseLastShown,
  shouldNudge,
} from './nudge';
import { isDone, parsePlan, taskHref, type TodayTask } from './today-plan';
import { readStorage, useTodayPlan, writeStorage } from './use-today-plan';

/**
 * Popup nhắc học khi mở web: mascot, một dòng tóm tắt việc còn lại và nút "Bắt đầu" tới việc đầu
 * tiên chưa xong. Phần ngoài chỉ gắn phần đọc dữ liệu ở trang không phải trang đang học và chỉ
 * cho tới khi đã quyết xong một lần trong phiên, để không tải "Việc hôm nay" trên mọi trang.
 */
export function StudyNudge() {
  const pathname = usePathname();
  const [settled, setSettled] = useState(false);
  if (settled || isLearningPath(pathname)) return null;
  return <NudgeDecider pathname={pathname} onSettled={() => setSettled(true)} />;
}

function NudgeDecider({ pathname, onSettled }: { pathname: string; onSettled: () => void }) {
  const { gate, plan, liveDue, overview, day, previousSeen } = useTodayPlan();
  const [pending, setPending] = useState<TodayTask[] | null>(null);
  const decided = useRef(false);

  useEffect(() => {
    if (decided.current || gate !== 'ready' || !plan) return;
    decided.current = true;
    const current = freshestPlan(parsePlan(readStorage(TODAY_KEY)), plan, day);
    const left = current.tasks.filter((t) => !isDone(current, t, liveDue));
    const now = new Date();
    const ok = shouldNudge({
      now,
      lastShown: parseLastShown(readStorage(NUDGE_KEY)),
      pathname,
      ready: true,
      pendingCount: left.length,
    });
    if (!ok || document.querySelector('dialog[open], [role="dialog"]')) {
      onSettled();
      return;
    }
    // Ghi ngay khi hiện: tải lại trang hay đóng tab cũng tính là đã thấy.
    writeStorage(NUDGE_KEY, now.toISOString());
    setPending(left);
  }, [gate, plan, day, liveDue, pathname, onSettled]);

  if (!pending) return null;

  const mood = moodFor({
    today: day,
    lastStudyDay: overview.data?.lastStudyDay ?? null,
    previousSeenStudyDay: previousSeen,
    allDone: false,
    activeStreak: overview.data?.activeStreak ?? 0,
  });

  return <NudgeDialog pending={pending} mood={mood} onClosed={onSettled} />;
}

function NudgeDialog({
  pending,
  mood,
  onClosed,
}: {
  pending: TodayTask[];
  mood: ReturnType<typeof moodFor>;
  onClosed: () => void;
}) {
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const firstPath = useRef(pathname);

  useEffect(() => {
    const d = dialog.current;
    if (d && !d.open) d.showModal();
    d?.querySelector<HTMLElement>('[data-nudge-start]')?.focus();
  }, []);

  // Đi sang trang khác (kể cả bấm "Bắt đầu") thì đóng.
  useEffect(() => {
    if (pathname !== firstPath.current) dialog.current?.close();
  }, [pathname]);

  return (
    // Bấm ra nền thì đóng; bàn phím đã có Esc do <dialog> tự xử lý. Nội dung nằm trong thẻ con nên
    // bấm vào phần đệm của hộp không bị tính là bấm ra nền.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={dialog}
      aria-labelledby="study-nudge-title"
      aria-describedby="study-nudge-summary"
      onClose={onClosed}
      onClick={(e) => {
        if (e.target === dialog.current) dialog.current?.close();
      }}
      className="m-0 mt-auto w-full max-w-none overflow-hidden rounded-t-card bg-panel p-0 text-fg shadow-overlay backdrop:bg-black/40 md:m-auto md:max-w-sm md:rounded-card"
    >
      <div className="p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] motion-safe:animate-rise md:pb-6">
        <div className="flex items-center gap-4">
          <Mascot state={mood} size={72} priority="overlay" />
          <div className="min-w-0">
            <h2 id="study-nudge-title" className="font-display text-lg font-semibold">
              Hôm nay
            </h2>
            <p id="study-nudge-summary" className="mt-1 text-sm text-fg-muted">
              {nudgeSummary(pending)}
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-2 md:flex-row-reverse">
          <ButtonLink data-nudge-start href={taskHref(pending[0]!)}>
            Bắt đầu
          </ButtonLink>
          <Button variant="ghost" onClick={() => dialog.current?.close()}>
            Để sau
          </Button>
        </div>
      </div>
    </dialog>
  );
}
