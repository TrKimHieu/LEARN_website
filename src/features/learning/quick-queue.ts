import type { SubmitExerciseInput } from '@learn/api-contracts';

type Answer = SubmitExerciseInput['answers'][number];

export interface QuickState {
  /** Câu còn phải làm; đầu hàng là câu hiện tại. */
  queue: string[];
  /** Câu đã bị đưa lại cuối hàng một lần. */
  requeued: string[];
  /** Đáp án đầu tiên của mỗi câu, dùng để chấm điểm khi nộp. */
  firstAnswers: Record<string, Answer>;
  streak: number;
  bestStreak: number;
  checked: number;
}

export function startQuick(questionIds: string[]): QuickState {
  return {
    queue: [...questionIds],
    requeued: [],
    firstAnswers: {},
    streak: 0,
    bestStreak: 0,
    checked: 0,
  };
}

export function currentQuestion(s: QuickState): string | null {
  return s.queue[0] ?? null;
}

/** Áp dụng một lần kiểm tra đã chấm cho câu hiện tại. */
export function recordCheck(s: QuickState, answer: Answer, isCorrect: boolean): QuickState {
  const id = s.queue[0];
  if (id === undefined) return s;
  const streak = isCorrect ? s.streak + 1 : 0;
  const requeue = !isCorrect && !s.requeued.includes(id);
  return {
    queue: requeue ? [...s.queue.slice(1), id] : s.queue.slice(1),
    requeued: requeue ? [...s.requeued, id] : s.requeued,
    firstAnswers: id in s.firstAnswers ? s.firstAnswers : { ...s.firstAnswers, [id]: answer },
    streak,
    bestStreak: Math.max(s.bestStreak, streak),
    checked: s.checked + 1,
  };
}

export function isFinished(s: QuickState): boolean {
  return s.queue.length === 0;
}

export function progress(s: QuickState): { done: number; total: number } {
  return { done: s.checked, total: s.checked + s.queue.length };
}

export function submissionAnswers(s: QuickState): Answer[] {
  return Object.values(s.firstAnswers);
}

export function canCheck(answer: Answer | undefined): boolean {
  if (!answer) return false;
  return !('text' in answer) || answer.text.trim() !== '';
}
