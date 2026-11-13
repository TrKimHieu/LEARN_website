import type { DueFlashcard } from '@learn/api-contracts';

export type Grade = 'AGAIN' | 'HARD' | 'GOOD' | 'EASY';

export type SessionCard = Pick<DueFlashcard, 'id' | 'front' | 'back'>;

/** Mức nhớ đã chọn, chờ máy chủ xác nhận. Giữ nguyên cả key và giờ chấm để gửi lại không bị chấm hai lần. */
export interface PendingGrade {
  cardId: string;
  grade: Grade;
  reviewedAt: string;
  key: string;
}

export interface SessionState {
  cards: readonly SessionCard[];
  index: number;
  revealed: boolean;
  pending: PendingGrade | null;
  reviewed: number;
}

/** Bốn Mức nhớ theo thứ tự từ quên đến dễ, nhãn tiếng Việt theo GLOSSARY.md. */
export const GRADES: ReadonlyArray<{ grade: Grade; label: string }> = [
  { grade: 'AGAIN', label: 'Quên' },
  { grade: 'HARD', label: 'Khó' },
  { grade: 'GOOD', label: 'Tốt' },
  { grade: 'EASY', label: 'Dễ' },
];

/** Danh sách thẻ được chụp lúc mở phiên: ôn xong một thẻ không làm đổi hàng đang đi. */
export function startSession(cards: readonly SessionCard[]): SessionState {
  return { cards, index: 0, revealed: false, pending: null, reviewed: 0 };
}

export function currentCard(state: SessionState): SessionCard | null {
  return state.cards[state.index] ?? null;
}

export function isFinished(state: SessionState): boolean {
  return state.index >= state.cards.length;
}

export function progressLabel(state: SessionState): string {
  const total = state.cards.length;
  return `${Math.min(state.index + 1, total)}/${total}`;
}

export function reveal(state: SessionState): SessionState {
  return isFinished(state) || state.revealed ? state : { ...state, revealed: true };
}

/**
 * Chọn Mức nhớ. Chỉ sau khi lật thẻ; khi đã có lượt chờ xác nhận thì giữ nguyên lượt đó
 * (cùng mức, giờ và key) để gửi lại sau lỗi mạng cho ra đúng một lần chấm.
 */
export function choose(
  state: SessionState,
  grade: Grade,
  now: Date,
  newKey: () => string,
): SessionState {
  const card = currentCard(state);
  if (!card || !state.revealed || state.pending) return state;
  return {
    ...state,
    pending: { cardId: card.id, grade, reviewedAt: now.toISOString(), key: newKey() },
  };
}

/** Máy chủ đã nhận lượt chấm: sang thẻ kế tiếp, mặt sau ẩn lại. */
export function confirmPending(state: SessionState): SessionState {
  if (!state.pending) return state;
  return {
    ...state,
    index: state.index + 1,
    revealed: false,
    pending: null,
    reviewed: state.reviewed + 1,
  };
}
