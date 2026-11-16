'use client';

import { useEffect, useId, useState } from 'react';
import type { SubmitFeedbackInput } from '@learn/api-contracts';
import { Button, InlineError, Textarea, cn } from '@/components/ui';
import { errorText } from '@/lib/api-client';
import { useSubmitFeedback } from './feedback-api';
import {
  askable,
  parseHistory,
  record,
  type FeedbackHistory,
  type FeedbackItem,
} from './feedback-policy';

const KEY = 'learn.feedback';
const SCORES = [1, 2, 3, 4, 5] as const;

function loadHistory(): FeedbackHistory {
  try {
    return parseHistory(window.localStorage.getItem(KEY));
  } catch {
    return {};
  }
}

function saveHistory(history: FeedbackHistory) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(history));
  } catch {
    /* bị chặn lưu trữ: có thể bị hỏi lại, không sao */
  }
}

const itemKey = (i: FeedbackItem) => `${i.topic}:${i.subjectId ?? '*'}:${i.question}`;

/** Gom câu trả lời theo (chủ đề, đối tượng) thành từng lượt gửi; góp ý chữ đi theo lượt đầu. */
function toRequests(items: FeedbackItem[], scores: Record<string, number>, comment: string) {
  const groups = new Map<string, SubmitFeedbackInput>();
  for (const item of items) {
    const key = `${item.topic}:${item.subjectId ?? ''}`;
    const group: SubmitFeedbackInput = groups.get(key) ?? {
      topic: item.topic,
      answers: [],
      ...(item.subjectId ? { subjectId: item.subjectId } : {}),
    };
    group.answers.push({ question: item.question, score: scores[itemKey(item)]! });
    groups.set(key, group);
  }
  const list = [...groups.values()];
  if (comment.trim() && list[0]) list[0].comment = comment.trim();
  return list;
}

/**
 * Thẻ hỏi ý kiến nhỏ ở góc màn hình, không chặn thao tác. Chỉ hiện những câu chưa hỏi (theo
 * `feedback-policy`), sau một nhịp ngắn để người học kịp thấy kết quả trước đã.
 */
export function FeedbackPrompt({
  title,
  items,
  when = true,
  delayMs = 1200,
}: {
  title: string;
  items: FeedbackItem[];
  when?: boolean;
  delayMs?: number;
}) {
  const titleId = useId();
  const submit = useSubmitFeedback();
  const [shown, setShown] = useState<FeedbackItem[] | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [thanked, setThanked] = useState(false);
  // Đại diện cho `items`: mảng mới ở mỗi lần render không làm hỏi lại.
  const signature = items.map(itemKey).join('|');

  useEffect(() => {
    if (!when || shown) return;
    const pending = askable(items, loadHistory(), new Date());
    if (pending.length === 0) return;
    const id = window.setTimeout(() => setShown(pending), delayMs);
    return () => window.clearTimeout(id);
  }, [when, signature, delayMs, shown]);

  useEffect(() => {
    if (!thanked) return;
    const id = window.setTimeout(() => setShown([]), 1500);
    return () => window.clearTimeout(id);
  }, [thanked]);

  if (!shown || shown.length === 0) return null;
  const pending = shown;
  const complete = pending.every((i) => scores[itemKey(i)] !== undefined);

  function dismiss() {
    saveHistory(record(loadHistory(), pending, 'dismissed', new Date()));
    setShown([]);
  }

  async function send() {
    try {
      for (const req of toRequests(pending, scores, comment)) await submit.mutateAsync(req);
      saveHistory(record(loadHistory(), pending, 'voted', new Date()));
      setThanked(true);
    } catch {
      /* hiện qua `submit.error` */
    }
  }

  return (
    <section
      role="dialog"
      aria-labelledby={titleId}
      className="fixed inset-x-4 bottom-24 z-40 rounded-card border border-line bg-panel p-5 shadow-overlay md:inset-x-auto md:bottom-6 md:right-6 md:w-96"
    >
      {thanked ? (
        <p id={titleId} role="status" className="text-center font-medium">
          Cảm ơn bạn!
        </p>
      ) : (
        <>
          <h2 id={titleId} className="font-display text-base font-semibold">
            {title}
          </h2>
          <div className="mt-4 space-y-4">
            {pending.map((item) => (
              <ScoreRow
                key={itemKey(item)}
                item={item}
                value={scores[itemKey(item)]}
                onChange={(score) => setScores((s) => ({ ...s, [itemKey(item)]: score }))}
              />
            ))}
          </div>
          {commenting ? (
            <Textarea
              className="mt-4"
              rows={2}
              maxLength={500}
              aria-label="Góp ý thêm"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          ) : (
            <button
              type="button"
              className="mt-3 text-sm font-medium text-accent underline underline-offset-2 focus-ring max-md:min-h-11"
              onClick={() => setCommenting(true)}
            >
              Thêm góp ý
            </button>
          )}
          {submit.isError && (
            <InlineError className="mt-3">
              {errorText(submit.error, 'Chưa gửi được, vui lòng thử lại.')}
            </InlineError>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" size="sm" className="max-md:h-11" onClick={dismiss}>
              Bỏ qua
            </Button>
            <Button
              size="sm"
              className="max-md:h-11"
              disabled={!complete}
              loading={submit.isPending}
              onClick={() => void send()}
            >
              Gửi
            </Button>
          </div>
        </>
      )}
    </section>
  );
}

const ENDS: Record<FeedbackItem['question'], [string, string]> = {
  QUALITY: ['Chưa tốt', 'Rất tốt'],
  UNDERSTANDING: ['Chưa nắm', 'Nắm chắc'],
  USEFULNESS: ['Ít ích', 'Rất hữu ích'],
};

function ScoreRow({
  item,
  value,
  onChange,
}: {
  item: FeedbackItem;
  value: number | undefined;
  onChange: (score: number) => void;
}) {
  const labelId = useId();
  const [low, high] = ENDS[item.question];
  return (
    <div>
      <p id={labelId} className="text-sm font-medium">
        {item.label}
      </p>
      <div role="radiogroup" aria-labelledby={labelId} className="mt-2 grid grid-cols-5 gap-1.5">
        {SCORES.map((score) => (
          <button
            key={score}
            type="button"
            role="radio"
            aria-checked={value === score}
            aria-label={`${score} trên 5`}
            onClick={() => onChange(score)}
            className={cn(
              'h-11 rounded-control border text-sm font-semibold tabular-nums transition-colors focus-ring md:h-9',
              value === score
                ? 'border-brand bg-brand text-on-brand'
                : 'border-line bg-panel text-fg-muted hover:border-line-strong hover:text-fg',
            )}
          >
            {score}
          </button>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-fg-subtle">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}
