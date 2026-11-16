import type { FeedbackQuestion, FeedbackTopic } from '@learn/api-contracts';

/** Một câu hỏi trong thẻ feedback. `subjectId` gắn câu hỏi với một bài học hoặc khóa học cụ thể. */
export interface FeedbackItem {
  topic: FeedbackTopic;
  question: FeedbackQuestion;
  subjectId?: string;
  label: string;
}

type Outcome = 'voted' | 'dismissed';
export type FeedbackHistory = Record<string, { at: string; outcome: Outcome }>;

/** Hỏi lại về một tính năng sau 7 ngày nếu đã vote, 3 ngày nếu đã bỏ qua. */
export const VOTE_COOLDOWN_MS = 7 * 86_400_000;
export const DISMISS_COOLDOWN_MS = 3 * 86_400_000;

/** Tối đa một câu hỏi mỗi ngày (theo giờ địa phương). */
export const MAX_PER_DAY = 1;

const keyOf = (i: Pick<FeedbackItem, 'topic' | 'subjectId' | 'question'>) =>
  `${i.topic}:${i.subjectId ?? '*'}:${i.question}`;

/**
 * Những câu nên hỏi bây giờ. Câu gắn đối tượng (một bài học, một lần sinh bài) chỉ hỏi một lần;
 * câu về cả tính năng hỏi lại sau thời gian chờ, để thu ý kiến liên tục mà không làm phiền.
 */
export function askable(
  items: FeedbackItem[],
  history: FeedbackHistory,
  now: Date,
): FeedbackItem[] {
  const today = now.toDateString();
  if (Object.values(history).some((h) => new Date(h.at).toDateString() === today)) return [];
  return items
    .filter((item) => {
      const seen = history[keyOf(item)];
      if (!seen) return true;
      if (item.subjectId) return false;
      const wait = seen.outcome === 'voted' ? VOTE_COOLDOWN_MS : DISMISS_COOLDOWN_MS;
      return now.getTime() - new Date(seen.at).getTime() >= wait;
    })
    .slice(0, MAX_PER_DAY);
}

export function record(
  history: FeedbackHistory,
  items: FeedbackItem[],
  outcome: Outcome,
  now: Date,
): FeedbackHistory {
  const next = { ...history };
  for (const item of items) next[keyOf(item)] = { at: now.toISOString(), outcome };
  return next;
}

/** Lịch sử lưu trong trình duyệt; mục hỏng bị bỏ, bộ nhớ hỏng coi như trống. */
export function parseHistory(raw: string | null): FeedbackHistory {
  if (!raw) return {};
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    const out: FeedbackHistory = {};
    for (const [key, entry] of Object.entries(value ?? {})) {
      const e = entry as { at?: unknown; outcome?: unknown } | null;
      if (e && typeof e.at === 'string' && (e.outcome === 'voted' || e.outcome === 'dismissed')) {
        out[key] = { at: e.at, outcome: e.outcome };
      }
    }
    return out;
  } catch {
    return {};
  }
}
