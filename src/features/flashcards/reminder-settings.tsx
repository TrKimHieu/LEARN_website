'use client';

import { Button, Card, Icon } from '@/components/ui';
import { useReminder } from './use-reminder';

/** Bật/tắt thông báo nhắc ôn thẻ trên trình duyệt này. Từ chối quyền không chặn tính năng nào khác. */
export function ReminderSettings({ className }: { className?: string }) {
  const { state, permission, enable, disable } = useReminder();
  const active = state.enabled && permission === 'granted';

  return (
    <Card className={className}>
      <h2 className="text-base font-semibold text-fg">Nhắc ôn thẻ</h2>
      {permission === 'unsupported' && (
        <p className="mt-1 text-sm text-fg-subtle">Trình duyệt này không hỗ trợ thông báo.</p>
      )}
      {permission === 'denied' && (
        <p className="mt-1 text-sm text-fg-subtle">
          Thông báo đang bị chặn. Cho phép lại trong cài đặt trang của trình duyệt để bật.
        </p>
      )}
      {permission !== 'unsupported' && permission !== 'denied' && (
        <p className="mt-1 text-sm text-fg-subtle">
          Báo khi có thẻ đến hạn, lúc tab này đang mở.
        </p>
      )}
      {permission !== 'unsupported' && permission !== 'denied' && (
        <div className="mt-4">
          {active ? (
            <Button variant="secondary" className="max-md:h-11" onClick={disable}>
              <Icon name="check" size={16} />
              Đang bật · Tắt
            </Button>
          ) : (
            <Button className="max-md:h-11" onClick={() => void enable()}>
              Bật nhắc ôn
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
