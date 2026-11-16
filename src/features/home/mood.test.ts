import { describe, expect, it } from 'vitest';
import { daysBetween, moodFor, seenStudyDayToKeep } from './mood';

const base = {
  today: '2026-11-17',
  lastStudyDay: null,
  previousSeenStudyDay: null,
  allDone: false,
  activeStreak: 0,
};
const studiedToday = { ...base, lastStudyDay: '2026-11-17', activeStreak: 1 };
const lastStudied = (lastStudyDay: string) => moodFor({ ...base, lastStudyDay });

describe('moodFor', () => {
  it('new learner is listening', () => expect(moodFor(base)).toBe('listening'));
  it('studied today is happy', () => expect(moodFor(studiedToday)).toBe('happy'));
  it('came back after 3 days is excited', () =>
    expect(moodFor({ ...studiedToday, previousSeenStudyDay: '2026-11-14' })).toBe('excited'));
  it('is not excited when the streak shows no gap', () =>
    expect(
      moodFor({ ...studiedToday, previousSeenStudyDay: '2026-11-14', activeStreak: 3 }),
    ).toBe('happy'));
  it('a study day ahead of the browser day (server timezone) counts as today', () => {
    expect(moodFor({ ...studiedToday, lastStudyDay: '2026-11-18' })).toBe('happy');
    expect(
      moodFor({ ...studiedToday, lastStudyDay: '2026-11-18', previousSeenStudyDay: '2026-11-14' }),
    ).toBe('excited');
  });
  it('yesterday is listening', () => expect(lastStudied('2026-11-16')).toBe('listening'));
  it('two idle days is sad', () => expect(lastStudied('2026-11-15')).toBe('sad'));
  it('three idle days is still sad', () => expect(lastStudied('2026-11-14')).toBe('sad'));
  it('four idle days is sleeping', () => expect(lastStudied('2026-11-13')).toBe('sleeping'));
  it('all done celebrates', () =>
    expect(moodFor({ ...studiedToday, allDone: true })).toBe('celebrate'));
});

describe('seenStudyDayToKeep', () => {
  it('keeps only study days before today', () => {
    expect(seenStudyDayToKeep('2026-11-16', '2026-11-17')).toBe('2026-11-16');
    expect(seenStudyDayToKeep('2026-11-17', '2026-11-17')).toBeNull();
    expect(seenStudyDayToKeep('2026-11-18', '2026-11-17')).toBeNull();
    expect(seenStudyDayToKeep(null, '2026-11-17')).toBeNull();
  });
});

describe('daysBetween', () => {
  it('counts calendar days across month end', () =>
    expect(daysBetween('2026-10-30', '2026-11-02')).toBe(3));
});
