import { describe, expect, it } from 'vitest';
import {
  DISMISS_COOLDOWN_MS,
  VOTE_COOLDOWN_MS,
  askable,
  parseHistory,
  record,
  type FeedbackItem,
} from './feedback-policy';

const now = new Date('2026-11-16T10:00:00.000Z');
const lesson = (id: string, question: FeedbackItem['question']): FeedbackItem => ({
  topic: 'LESSON',
  subjectId: id,
  question,
  label: 'x',
});
const pomodoro: FeedbackItem = { topic: 'POMODORO', question: 'USEFULNESS', label: 'x' };

describe('askable', () => {
  it('asks at most one question at a time', () => {
    const [a, b, c] = [lesson('a', 'QUALITY'), lesson('a', 'UNDERSTANDING'), pomodoro];
    expect(askable([a, b, c], {}, now)).toEqual([a]);
  });

  it('asks nothing more on a day something was already asked', () => {
    const history = record({}, [pomodoro], 'dismissed', new Date('2026-11-17T08:00:00'));
    expect(askable([lesson('a', 'QUALITY')], history, new Date('2026-11-17T21:00:00'))).toEqual([]);
  });

  it('asks again the next day', () => {
    const a = lesson('a', 'QUALITY');
    const history = record({}, [pomodoro], 'voted', new Date('2026-11-17T08:00:00'));
    expect(askable([a], history, new Date('2026-11-18T08:00:00'))).toEqual([a]);
  });

  it('never asks about the same lesson twice, voted or dismissed', () => {
    const voted = record({}, [lesson('a', 'QUALITY')], 'voted', now);
    const later = new Date(now.getTime() + 365 * 86_400_000);
    expect(askable([lesson('a', 'QUALITY')], voted, later)).toEqual([]);
    const dismissed = record({}, [lesson('b', 'QUALITY')], 'dismissed', now);
    expect(askable([lesson('b', 'QUALITY')], dismissed, later)).toEqual([]);
    expect(askable([lesson('c', 'QUALITY')], voted, later)).toHaveLength(1);
  });

  it('asks about a feature again only after its cooldown', () => {
    const voted = record({}, [pomodoro], 'voted', now);
    const soon = new Date(now.getTime() + VOTE_COOLDOWN_MS - 1);
    const later = new Date(now.getTime() + VOTE_COOLDOWN_MS);
    expect(askable([pomodoro], voted, soon)).toEqual([]);
    expect(askable([pomodoro], voted, later)).toEqual([pomodoro]);
  });

  it('a dismissal waits less than a vote, but still waits', () => {
    expect(DISMISS_COOLDOWN_MS).toBeLessThan(VOTE_COOLDOWN_MS);
    const dismissed = record({}, [pomodoro], 'dismissed', now);
    expect(askable([pomodoro], dismissed, new Date(now.getTime() + 60_000))).toEqual([]);
    const later = new Date(now.getTime() + DISMISS_COOLDOWN_MS);
    expect(askable([pomodoro], dismissed, later)).toEqual([pomodoro]);
  });

  it('keeps only the questions not yet answered when one card mixes topics', () => {
    const history = record(
      {},
      [lesson('a', 'QUALITY'), lesson('a', 'UNDERSTANDING')],
      'voted',
      new Date(now.getTime() - 2 * 86_400_000),
    );
    const practice: FeedbackItem = {
      topic: 'PRACTICE',
      subjectId: 'a',
      question: 'QUALITY',
      label: 'x',
    };
    const items = [lesson('a', 'QUALITY'), lesson('a', 'UNDERSTANDING'), practice];
    expect(askable(items, history, now)).toEqual([practice]);
  });
});

describe('parseHistory', () => {
  it('reads saved history and drops damaged entries', () => {
    const raw = JSON.stringify({
      'POMODORO:*:USEFULNESS': { at: now.toISOString(), outcome: 'voted' },
      bad: { at: 42, outcome: 'voted' },
      worse: 'x',
    });
    expect(Object.keys(parseHistory(raw))).toEqual(['POMODORO:*:USEFULNESS']);
  });
  it('treats missing or broken storage as empty', () => {
    expect(parseHistory(null)).toEqual({});
    expect(parseHistory('{')).toEqual({});
  });
});
