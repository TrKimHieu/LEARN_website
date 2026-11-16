import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  advance,
  countFocus,
  elapsedFraction,
  formatClock,
  initialState,
  normalizeSettings,
  parseTimer,
  pause,
  remaining,
  start,
  todayKey,
} from './pomodoro';

const MIN = 60_000;
const t0 = 1_000_000;

describe('normalizeSettings', () => {
  it('defaults to 25 minutes of focus and 5 of break', () => {
    expect(normalizeSettings(undefined)).toEqual({ focusMin: 25, breakMin: 5 });
    expect(DEFAULT_SETTINGS).toEqual({ focusMin: 25, breakMin: 5 });
  });
  it('keeps valid whole minutes and clamps the rest', () => {
    expect(normalizeSettings({ focusMin: 50, breakMin: 10 })).toEqual({ focusMin: 50, breakMin: 10 });
    expect(normalizeSettings({ focusMin: 500, breakMin: 0 })).toEqual({ focusMin: 120, breakMin: 1 });
    expect(normalizeSettings({ focusMin: 12.7, breakMin: '3' })).toEqual({ focusMin: 13, breakMin: 3 });
  });
  it('falls back per field for garbage', () => {
    expect(normalizeSettings({ focusMin: 'abc', breakMin: null })).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings('not an object')).toEqual(DEFAULT_SETTINGS);
  });
});

describe('timer', () => {
  const settings = { focusMin: 25, breakMin: 5 };

  it('starts in focus, stopped, with the full focus length', () => {
    const s = initialState(settings);
    expect(s.phase).toBe('focus');
    expect(s.running).toBe(false);
    expect(remaining(s, t0)).toBe(25 * MIN);
  });

  it('counts from the wall clock, so switching tabs does not drift', () => {
    const s = start(initialState(settings), t0);
    expect(remaining(s, t0 + 10 * MIN)).toBe(15 * MIN);
  });

  it('pause keeps what is left, and resuming continues from there', () => {
    const paused = pause(start(initialState(settings), t0), t0 + 5 * MIN);
    expect(paused.running).toBe(false);
    expect(remaining(paused, t0 + 60 * MIN)).toBe(20 * MIN);
    const resumed = start(paused, t0 + 60 * MIN);
    expect(remaining(resumed, t0 + 61 * MIN)).toBe(19 * MIN);
  });

  it('survives a reload mid-run through what is stored', () => {
    const running = start(initialState(settings), t0);
    const restored = parseTimer(JSON.stringify(running));
    expect(restored).not.toBeNull();
    expect(remaining(restored!, t0 + 7 * MIN)).toBe(18 * MIN);
  });

  it('never shows negative time once past the end', () => {
    const s = start(initialState(settings), t0);
    expect(remaining(s, t0 + 40 * MIN)).toBe(0);
  });

  it('when focus ends: switches to a stopped break and reports which phase finished', () => {
    const s = start(initialState(settings), t0);
    expect(advance(s, settings, t0 + 10 * MIN)).toEqual({ state: s, finished: null });
    const out = advance(s, settings, t0 + 25 * MIN);
    expect(out.finished).toBe('focus');
    expect(out.state).toMatchObject({ phase: 'break', running: false });
    expect(remaining(out.state, t0 + 25 * MIN)).toBe(5 * MIN);
  });

  it('when break ends: back to a stopped focus', () => {
    const brk = advance(start(initialState(settings), t0), settings, t0 + 25 * MIN).state;
    const out = advance(start(brk, t0 + 25 * MIN), settings, t0 + 30 * MIN);
    expect(out.finished).toBe('break');
    expect(out.state).toMatchObject({ phase: 'focus', running: false });
  });
});

describe('parseTimer', () => {
  it('rejects missing or damaged storage', () => {
    expect(parseTimer(null)).toBeNull();
    expect(parseTimer('{')).toBeNull();
    expect(parseTimer(JSON.stringify({ phase: 'nap', running: true }))).toBeNull();
  });
});

describe('formatClock', () => {
  it('shows minutes and seconds, rounding seconds up', () => {
    expect(formatClock(25 * MIN)).toBe('25:00');
    expect(formatClock(61_001)).toBe('01:02');
    expect(formatClock(0)).toBe('00:00');
  });
});

describe('countFocus', () => {
  it('counts a finished focus session for today', () => {
    expect(countFocus(null, 'focus', '2026-11-16')).toEqual({ date: '2026-11-16', done: 1 });
    expect(countFocus({ date: '2026-11-16', done: 3 }, 'focus', '2026-11-16').done).toBe(4);
  });
  it('does not count a finished break', () => {
    expect(countFocus({ date: '2026-11-16', done: 2 }, 'break', '2026-11-16').done).toBe(2);
  });
  it('starts over on a new day', () => {
    expect(countFocus({ date: '2026-11-15', done: 6 }, null, '2026-11-16')).toEqual({
      date: '2026-11-16',
      done: 0,
    });
    expect(countFocus({ date: '2026-11-15', done: 6 }, 'focus', '2026-11-16').done).toBe(1);
  });
});

describe('todayKey', () => {
  it('uses the local calendar date', () => {
    expect(todayKey(new Date(2026, 10, 16, 23, 59))).toBe('2026-11-16');
    expect(todayKey(new Date(2026, 0, 5, 0, 1))).toBe('2026-01-05');
  });
});

describe('elapsedFraction', () => {
  const settings = { focusMin: 25, breakMin: 5 };
  it('is 0 before starting and grows with time', () => {
    const s = initialState(settings);
    expect(elapsedFraction(s, settings, t0)).toBe(0);
    const running = start(s, t0);
    expect(elapsedFraction(running, settings, t0 + 5 * MIN)).toBeCloseTo(0.2, 5);
  });
  it('uses the break length during a break and never passes 1', () => {
    const brk = initialState(settings, 'break');
    const running = start(brk, t0);
    expect(elapsedFraction(running, settings, t0 + MIN)).toBeCloseTo(0.2, 5);
    expect(elapsedFraction(running, settings, t0 + 60 * MIN)).toBe(1);
  });
});
