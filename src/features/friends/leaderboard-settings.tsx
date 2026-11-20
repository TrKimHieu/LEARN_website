'use client';

import { Card, InlineError, cn } from '@/components/ui';
import { errorText } from '@/lib/api-client';
import { useFriends, useLeaderboardHidden } from './friends-api';

const OPTIONS = [
  { value: false, label: 'Hiện' },
  { value: true, label: 'Ẩn' },
] as const;

/** Ẩn mình khỏi bảng xếp hạng của bạn bè (vẫn kết bạn được). Chỉ hiện khi máy chủ có bạn học. */
export function LeaderboardSettings({ className }: { className?: string }) {
  const friends = useFriends();
  const update = useLeaderboardHidden();
  if (!friends.data) return null;
  const hidden = update.isPending ? update.variables : friends.data.leaderboardHidden;

  return (
    <Card className={className}>
      <h2 className="text-base font-semibold text-fg">Bảng xếp hạng</h2>
      <p className="mt-1 text-sm text-fg-subtle">Bạn bè thấy XP tuần của bạn. Ẩn thì vẫn kết bạn được.</p>
      <fieldset className="mt-4 min-w-0" disabled={update.isPending}>
        <legend className="sr-only">Hiện trên bảng xếp hạng của bạn bè</legend>
        <div className="grid max-w-xs grid-cols-2 gap-0.5 rounded-control bg-muted p-0.5">
          {OPTIONS.map((o) => (
            <label
              key={o.label}
              className={cn(
                'flex h-8 cursor-pointer items-center justify-center rounded-md text-xs font-medium transition-colors duration-150',
                'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-fg',
                hidden === o.value
                  ? 'bg-panel text-fg shadow-card dark:bg-line-strong'
                  : 'text-fg-subtle hover:text-fg',
              )}
            >
              <input
                type="radio"
                name="leaderboard-hidden"
                checked={hidden === o.value}
                onChange={() => update.mutate(o.value)}
                className="sr-only"
              />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>
      {update.isError && (
        <InlineError className="mt-3">{errorText(update.error, 'Không lưu được, vui lòng thử lại.')}</InlineError>
      )}
    </Card>
  );
}
