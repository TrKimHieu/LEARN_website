import { describe, expect, it } from 'vitest';
import {
  choose,
  confirmPending,
  currentCard,
  isFinished,
  progressLabel,
  reveal,
  startSession,
} from './review-session';

const cards = [
  { id: 'a', front: 'Q1', back: 'A1' },
  { id: 'b', front: 'Q2', back: 'A2' },
];
const at = new Date('2026-11-13T08:00:00.000Z');
const key = () => 'key-0001-abcd';

describe('review session', () => {
  it('starts on the first card with its back hidden', () => {
    const s = startSession(cards);
    expect(currentCard(s)).toEqual(cards[0]);
    expect(s.revealed).toBe(false);
    expect(isFinished(s)).toBe(false);
    expect(progressLabel(s)).toBe('1/2');
  });

  it('refuses a grade before the card is flipped', () => {
    const s = startSession(cards);
    expect(choose(s, 'GOOD', at, key)).toBe(s);
  });

  it('records the grade with the time and a key once flipped', () => {
    const s = choose(reveal(startSession(cards)), 'HARD', at, key);
    expect(s.pending).toEqual({
      cardId: 'a',
      grade: 'HARD',
      reviewedAt: '2026-11-13T08:00:00.000Z',
      key: 'key-0001-abcd',
    });
  });

  it('keeps the same grade, time and key until the server confirms, so a retry is replayable', () => {
    const first = choose(reveal(startSession(cards)), 'GOOD', at, key);
    const again = choose(first, 'EASY', new Date(at.getTime() + 5000), () => 'other-key-xyz');
    expect(again).toBe(first);
    expect(again.pending?.grade).toBe('GOOD');
  });

  it('moves to the next card hidden after confirmation', () => {
    const graded = choose(reveal(startSession(cards)), 'GOOD', at, key);
    const next = confirmPending(graded);
    expect(currentCard(next)).toEqual(cards[1]);
    expect(next.revealed).toBe(false);
    expect(next.pending).toBeNull();
    expect(next.reviewed).toBe(1);
    expect(progressLabel(next)).toBe('2/2');
  });

  it('finishes after the last card and counts what was reviewed', () => {
    let s = startSession(cards);
    for (let i = 0; i < cards.length; i++) {
      s = confirmPending(choose(reveal(s), 'GOOD', at, key));
    }
    expect(isFinished(s)).toBe(true);
    expect(currentCard(s)).toBeNull();
    expect(s.reviewed).toBe(2);
  });

  it('ignores confirmation when nothing is pending', () => {
    const s = startSession(cards);
    expect(confirmPending(s)).toBe(s);
  });

  it('is finished at once for an empty deck', () => {
    const s = startSession([]);
    expect(isFinished(s)).toBe(true);
    expect(progressLabel(s)).toBe('0/0');
  });
});
