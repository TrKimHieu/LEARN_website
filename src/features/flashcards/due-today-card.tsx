'use client';

import { ButtonLink, Card, Icon } from '@/components/ui';
import { dueSummaryText } from './due-badge';
import { useDueCount } from './flashcards-api';

/** Lối vào Ôn hôm nay trên dashboard. Chỉ hiện khi có thẻ đến hạn, để không nhắc khi không có gì để ôn. */
export function DueTodayCard() {
  const { data: count } = useDueCount();
  if (!count) return null;
  return (
    <Card className="mt-4 flex flex-wrap items-center justify-between gap-4">
      <div className="min-w-0">
        <h2 className="font-display text-lg font-semibold">Ôn hôm nay</h2>
        <p className="mt-0.5 text-sm text-fg-muted">{dueSummaryText(count)}</p>
      </div>
      <ButtonLink href="/review" className="max-md:h-11">
        <Icon name="play" size={16} />
        Bắt đầu ôn
      </ButtonLink>
    </Card>
  );
}
