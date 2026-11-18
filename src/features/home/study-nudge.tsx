'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Mascot } from '@/components/shared/mascot';
import { Button, ButtonLink } from '@/components/ui';
import { moodFor } from './mood';
import { NUDGE_KEY, nudgeSummary, parseLastShown, shouldNudge } from './nudge';
import { isDone, taskHref } from './today-plan';
import { readStorage, useTodayPlan, writeStorage } from './use-today-plan';

/**
 * Popup nhắc học khi mở web: mascot, một dòng tóm tắt việc còn lại và nút "Bắt đầu" tới việc đầu
 * tiên chưa xong. Dùng `<dialog>` của trình duyệt: giữ focus bên trong, Esc đóng, nền phía sau trơ.
 */
export function StudyNudge() {
  const pathname = usePathname();
  const { gate, plan, liveDue, overview, day, previousSeen } = useTodayPlan();
  const dialog = useRef<HTMLDialogElement>(null);
  const shown = useRef(false);
  const returnFocus = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);

  const pending = plan ? plan.tasks.filter((t) => !isDone(plan, t, liveDue)) : [];

  useEffect(() => {
    if (shown.current) return;
    const now = new Date();
    const ok = shouldNudge({
      now,
      lastShown: parseLastShown(readStorage(NUDGE_KEY)),
      pathname,
      ready: gate === 'ready' && plan !== null,
      pendingCount: pending.length,
    });
    if (!ok || document.querySelector('dialog[open], [role="dialog"]')) return;
    shown.current = true;
    // Ghi ngay khi hiện: tải lại trang hay đóng tab cũng tính là đã thấy.
    writeStorage(NUDGE_KEY, now.toISOString());
    returnFocus.current = document.activeElement as HTMLElement | null;
    setOpen(true);
  }, [gate, plan, pathname, pending.length]);

  useEffect(() => {
    if (!open) return;
    dialog.current?.showModal();
    dialog.current?.querySelector<HTMLElement>('[data-nudge-start]')?.focus();
  }, [open]);

  // Đi sang trang khác (kể cả bấm "Bắt đầu") thì đóng.
  const firstPath = useRef(pathname);
  useEffect(() => {
    if (open && pathname !== firstPath.current) dialog.current?.close();
    firstPath.current = pathname;
  }, [pathname, open]);

  if (!open || !plan || pending.length === 0) return null;

  const mood = moodFor({
    today: day,
    lastStudyDay: overview.data?.lastStudyDay ?? null,
    previousSeenStudyDay: previousSeen,
    allDone: false,
    activeStreak: overview.data?.activeStreak ?? 0,
  });

  return (
    // Bấm ra nền thì đóng; bàn phím đã có Esc do <dialog> tự xử lý.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={dialog}
      aria-labelledby="study-nudge-title"
      onClose={() => {
        setOpen(false);
        returnFocus.current?.focus?.();
      }}
      onClick={(e) => {
        if (e.target === dialog.current) dialog.current?.close();
      }}
      className="m-0 mt-auto w-full max-w-none rounded-t-card bg-panel p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] text-fg shadow-overlay backdrop:bg-black/40 motion-safe:animate-in md:m-auto md:max-w-sm md:rounded-card md:pb-6"
    >
      <div className="flex items-center gap-4">
        <Mascot state={mood} size={72} priority="overlay" />
        <div className="min-w-0">
          <h2 id="study-nudge-title" className="font-display text-lg font-semibold">
            Hôm nay
          </h2>
          <p className="mt-1 text-sm text-fg-muted">{nudgeSummary(pending)}</p>
        </div>
      </div>
      <div className="mt-6 flex flex-col-reverse gap-2 md:flex-row md:justify-end">
        <Button variant="ghost" onClick={() => dialog.current?.close()}>
          Để sau
        </Button>
        <ButtonLink data-nudge-start href={taskHref(pending[0]!)}>
          Bắt đầu
        </ButtonLink>
      </div>
    </dialog>
  );
}
