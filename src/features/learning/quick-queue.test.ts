import { describe, expect, it } from 'vitest';
import type { SubmitExerciseInput } from '@learn/api-contracts';
import {
  canCheck,
  currentQuestion,
  isFinished,
  progress,
  recordCheck,
  startQuick,
  submissionAnswers,
} from './quick-queue';

type Answer = SubmitExerciseInput['answers'][number];

const short = (questionId: string, text: string): Answer => ({
  type: 'SHORT_ANSWER',
  questionId,
  text,
});

describe('quick-queue', () => {
  it('start is fresh', () => {
    const s = startQuick(['a', 'b']);
    expect(currentQuestion(s)).toBe('a');
    expect(s.firstAnswers).toEqual({});
    expect(s.streak).toBe(0);
  });

  it('correct answers advance and build a streak', () => {
    let s = startQuick(['a', 'b']);
    s = recordCheck(s, short('a', 'x'), true);
    s = recordCheck(s, short('b', 'y'), true);
    expect(isFinished(s)).toBe(true);
    expect(s.bestStreak).toBe(2);
  });

  it('wrong answer goes to the end once', () => {
    let s = startQuick(['a', 'b']);
    const wrong = short('a', 'no');
    s = recordCheck(s, wrong, false);
    expect(currentQuestion(s)).toBe('b');
    s = recordCheck(s, short('b', 'y'), true);
    expect(currentQuestion(s)).toBe('a');
    s = recordCheck(s, short('a', 'yes'), true);
    expect(isFinished(s)).toBe(true);
    expect(s.firstAnswers.a).toEqual(wrong);
  });

  it('requeues a wrong question only once', () => {
    let s = startQuick(['a']);
    s = recordCheck(s, short('a', '1'), false);
    s = recordCheck(s, short('a', '2'), false);
    expect(isFinished(s)).toBe(true);
    expect(s.checked).toBe(2);
    expect(s.streak).toBe(0);
  });

  it('first answer is what gets submitted', () => {
    let s = startQuick(['a']);
    const wrong = short('a', 'no');
    s = recordCheck(s, wrong, false);
    s = recordCheck(s, short('a', 'yes'), true);
    expect(submissionAnswers(s)).toEqual([wrong]);
  });

  it('ignores blank text answers', () => {
    expect(canCheck(short('a', '  '))).toBe(false);
    expect(canCheck(undefined)).toBe(false);
    expect(canCheck(short('a', 'x'))).toBe(true);
  });

  it('progress counts requeued questions', () => {
    const s = recordCheck(startQuick(['a', 'b']), short('a', 'no'), false);
    expect(progress(s)).toEqual({ done: 1, total: 3 });
  });
});
