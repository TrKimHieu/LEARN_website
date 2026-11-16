import type { DeckSummary } from '@learn/api-contracts';

type Counts = Pick<DeckSummary, 'cardCount' | 'newCount' | 'learningCount' | 'dueCount'>;

/** Ba số theo thứ tự cố định; giữ cả số 0 để vị trí không nhảy khi dữ liệu đổi. */
export function deckStats(deck: Counts) {
  return [
    { key: 'new', label: 'Mới', value: deck.newCount },
    { key: 'learning', label: 'Đang học', value: deck.learningCount },
    { key: 'due', label: 'Đến hạn', value: deck.dueCount },
  ] as const;
}

export function cardCountLabel(count: number): string {
  return count === 0 ? 'Chưa có thẻ' : `${count} thẻ`;
}
