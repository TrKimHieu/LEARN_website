'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useDueCount } from './flashcards-api';
import { afterNotified, notificationText, settle, shouldNotify } from './reminder';
import { useReminder } from './use-reminder';

/**
 * Đặt trong khung app: khi tab đang mở và có thẻ đến hạn thì báo bằng thông báo trình duyệt, nếu người
 * học đã bật và trình duyệt cho phép. Không web push: đóng tab thì không có thông báo.
 */
export function ReminderWatcher() {
  const { data: dueCount } = useDueCount();
  const { state, permission, save } = useReminder();
  const router = useRouter();

  useEffect(() => {
    const settled = settle(state, dueCount);
    if (settled !== state) {
      save(settled);
      return;
    }
    const now = new Date();
    if (!shouldNotify({ permission, state, dueCount, now })) return;
    const text = notificationText(dueCount!);
    const notification = new Notification(text.title, { body: text.body, tag: 'learn-due' });
    notification.onclick = () => {
      window.focus();
      router.push('/review');
      notification.close();
    };
    save(afterNotified(state, now));
  }, [dueCount, permission, state, save, router]);

  return null;
}
