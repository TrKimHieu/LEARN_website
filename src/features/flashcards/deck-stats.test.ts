import { describe, expect, it } from 'vitest';
import { cardCountLabel, deckStats } from './deck-stats';

const deck = { cardCount: 5, newCount: 2, learningCount: 3, dueCount: 4 };

describe('deckStats', () => {
  it('lists new, learning and due counts in that order', () => {
    expect(deckStats(deck)).toEqual([
      { key: 'new', label: 'Mới', value: 2 },
      { key: 'learning', label: 'Đang học', value: 3 },
      { key: 'due', label: 'Đến hạn', value: 4 },
    ]);
  });
  it('keeps zero counts so the three numbers never shift position', () => {
    const empty = { cardCount: 0, newCount: 0, learningCount: 0, dueCount: 0 };
    expect(deckStats(empty).map((s) => s.value)).toEqual([0, 0, 0]);
  });
});

describe('cardCountLabel', () => {
  it('says the deck is empty instead of "0 thẻ"', () => {
    expect(cardCountLabel(0)).toBe('Chưa có thẻ');
  });
  it('counts cards', () => {
    expect(cardCountLabel(1)).toBe('1 thẻ');
    expect(cardCountLabel(12)).toBe('12 thẻ');
  });
});
