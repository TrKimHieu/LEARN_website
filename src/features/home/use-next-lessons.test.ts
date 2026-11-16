import { describe, expect, it } from 'vitest';
import type { LessonSummary } from '@learn/api-contracts';
import { pickNextLesson } from './today-plan';

const l = (id: string, progressStatus: string) => ({ id, progressStatus }) as LessonSummary;

describe('pickNextLesson', () => {
  it('prefers the lesson in progress', () => {
    const list = [l('a', 'COMPLETED'), l('b', 'NOT_STARTED'), l('c', 'IN_PROGRESS')];
    expect(pickNextLesson(list)).toEqual({ lesson: list[2], index: 2 });
  });
  it('falls back to the first not started', () => {
    const list = [l('a', 'COMPLETED'), l('b', 'NOT_STARTED'), l('c', 'NOT_STARTED')];
    expect(pickNextLesson(list)).toEqual({ lesson: list[1], index: 1 });
  });
  it('returns null when all are done', () => {
    expect(pickNextLesson([l('a', 'COMPLETED')])).toBeNull();
    expect(pickNextLesson([])).toBeNull();
  });
});
