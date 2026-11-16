import { describe, expect, it } from 'vitest';
import { daysBetween, moodFor } from './mood';

const base = { today: '2026-11-17', lastStudyDay: null, previousSeenStudyDay: null, allDone: false };

describe('moodFor', () => {
  it('new learner is listening', () => expect(moodFor(base)).toBe('listening'));
  it('studied today is happy', () => expect(moodFor({ ...base, lastStudyDay: '2026-11-17' })).toBe('happy'));
  it('came back after 3 days is excited', () =>
    expect(moodFor({ ...base, lastStudyDay: '2026-11-17', previousSeenStudyDay: '2026-11-14' })).toBe('excited'));
  it('yesterday is listening', () => expect(moodFor({ ...base, lastStudyDay: '2026-11-16' })).toBe('listening'));
  it('two idle days is sad', () => expect(moodFor({ ...base, lastStudyDay: '2026-11-15' })).toBe('sad'));
  it('four idle days is sleeping', () => expect(moodFor({ ...base, lastStudyDay: '2026-11-13' })).toBe('sleeping'));
  it('all done celebrates', () => expect(moodFor({ ...base, lastStudyDay: '2026-11-17', allDone: true })).toBe('celebrate'));
});

describe('daysBetween', () => {
  it('counts calendar days across month end', () => expect(daysBetween('2026-10-30', '2026-11-02')).toBe(3));
});
