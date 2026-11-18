import { describe, expect, it } from 'vitest';
import {
  buildSequence,
  clampStep,
  eligibleQuizIds,
  isLastItem,
  splitSteps,
} from './lesson-steps';

describe('splitSteps', () => {
  it('no headings is one step', () => {
    expect(splitSteps('Xin chào\n\nđoạn 2')).toEqual([
      { title: null, markdown: 'Xin chào\n\nđoạn 2' },
    ]);
  });

  it('splits on level-2 headings and keeps the intro in step 1', () => {
    const steps = splitSteps('Mở đầu\n## A\na\n## B\nb');
    expect(steps).toHaveLength(2);
    expect(steps[0]?.title).toBe('A');
    expect(steps[0]?.markdown).toContain('Mở đầu');
    expect(steps[0]?.markdown).toContain('## A');
    expect(steps[1]?.title).toBe('B');
  });

  it('level-3 headings do not split', () => {
    expect(splitSteps('## A\n### a1\nx\n## B')).toHaveLength(2);
  });

  it('ignores headings inside code fences', () => {
    const steps = splitSteps('## A\n```\n## not\n```\n## B');
    expect(steps.map((s) => s.title)).toEqual(['A', 'B']);
  });

  it('cleans closing hashes and inline markers from titles', () => {
    expect(splitSteps('## A ##\nx')[0]?.title).toBe('A');
    expect(splitSteps('## **Khái niệm**\nx')[0]?.title).toBe('Khái niệm');
    expect(splitSteps('## `code` và _nghiêng_\nx')[0]?.title).toBe('code và nghiêng');
    expect(splitSteps('## snake_case\nx')[0]?.title).toBe('snake_case');
  });

  it('handles CRLF titles and ~~~ fences', () => {
    const steps = splitSteps('## A\r\na\r\n~~~\r\n## not\r\n~~~\r\n## B\r\nb');
    expect(steps.map((s) => s.title)).toEqual(['A', 'B']);
  });

  it('empty content is one empty step', () => {
    expect(splitSteps('')).toHaveLength(1);
  });
});

describe('buildSequence', () => {
  const s = (step: number) => ({ kind: 'step', step });
  const q = (questionId: string) => ({ kind: 'quiz', questionId });

  it('quiz after every two steps, never after the last', () => {
    expect(buildSequence(5, ['q1', 'q2', 'q3'])).toEqual([
      s(0), s(1), q('q1'), s(2), s(3), q('q2'), s(4),
    ]);
  });

  it('guard: no quiz when the pair ends on the last step', () => {
    expect(buildSequence(2, ['q1'])).toEqual([s(0), s(1)]);
    expect(buildSequence(4, ['q1', 'q2'])).toEqual([s(0), s(1), q('q1'), s(2), s(3)]);
  });

  it('no quiz without eligible questions', () => {
    expect(buildSequence(4, [])).toEqual([s(0), s(1), s(2), s(3)]);
  });

  it('single step ends immediately', () => {
    expect(buildSequence(1, ['q1'])).toEqual([s(0)]);
    expect(isLastItem(0, 1)).toBe(true);
  });
});

describe('eligibleQuizIds', () => {
  it('keeps only MC and TF', () => {
    expect(
      eligibleQuizIds([
        { id: 'a', type: 'SHORT_ANSWER' },
        { id: 'b', type: 'TRUE_FALSE' },
        { id: 'c', type: 'MULTIPLE_CHOICE' },
        { id: 'd', type: 'FILL_BLANK' },
      ]),
    ).toEqual(['b', 'c']);
  });
});

describe('clampStep', () => {
  it('clamps', () => {
    expect(clampStep('', 5)).toBe(0);
    expect(clampStep('abc', 5)).toBe(0);
    expect(clampStep('-1', 5)).toBe(0);
    expect(clampStep('3', 5)).toBe(3);
    expect(clampStep('99', 5)).toBe(4);
    expect(clampStep('3', 0)).toBe(0);
  });
});
