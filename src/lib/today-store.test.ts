import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { markTodayDone, TODAY_KEY, todayKey } from './today-store';

let data: Record<string, string>;
beforeEach(() => {
  data = {};
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => data[k] ?? null,
    setItem: (k: string, v: string) => { data[k] = v; },
  });
});
afterEach(() => vi.unstubAllGlobals());

describe('markTodayDone', () => {
  it('appends id to today plan once', () => {
    data[TODAY_KEY] = JSON.stringify({ day: todayKey(), tasks: [], done: [] });
    markTodayDone('review');
    markTodayDone('review');
    expect(JSON.parse(data[TODAY_KEY]).done).toEqual(['review']);
  });
  it('ignores a plan from another day', () => {
    const raw = JSON.stringify({ day: '2000-01-01', tasks: [], done: [] });
    data[TODAY_KEY] = raw;
    markTodayDone('review');
    expect(data[TODAY_KEY]).toBe(raw);
  });
  it('swallows corrupt json and storage errors', () => {
    data[TODAY_KEY] = '{bad';
    expect(() => markTodayDone('review')).not.toThrow();
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('x'); }, setItem: () => {} });
    expect(() => markTodayDone('review')).not.toThrow();
  });
});
