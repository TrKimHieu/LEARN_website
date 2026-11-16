import { describe, expect, it } from 'vitest';
import {
  COOLDOWN_MS,
  DEFAULT_STATE,
  afterNotified,
  notificationText,
  parseState,
  settle,
  shouldNotify,
  type ReminderState,
} from './reminder';

const now = new Date('2026-11-14T10:00:00.000Z');
const on: ReminderState = { enabled: true, lastNotifiedAt: null };

describe('shouldNotify', () => {
  it('stays quiet unless the learner enabled reminders and the browser allows them', () => {
    expect(shouldNotify({ permission: 'granted', state: DEFAULT_STATE, dueCount: 5, now })).toBe(false);
    expect(shouldNotify({ permission: 'denied', state: on, dueCount: 5, now })).toBe(false);
    expect(shouldNotify({ permission: 'default', state: on, dueCount: 5, now })).toBe(false);
    expect(shouldNotify({ permission: 'unsupported', state: on, dueCount: 5, now })).toBe(false);
  });

  it('stays quiet when nothing is due or the count is unknown', () => {
    expect(shouldNotify({ permission: 'granted', state: on, dueCount: 0, now })).toBe(false);
    expect(shouldNotify({ permission: 'granted', state: on, dueCount: undefined, now })).toBe(false);
  });

  it('notifies the first time cards are due', () => {
    expect(shouldNotify({ permission: 'granted', state: on, dueCount: 3, now })).toBe(true);
  });

  it('does not repeat on every poll: waits for the cooldown', () => {
    const state = afterNotified(on, now);
    const soon = new Date(now.getTime() + 60_000);
    const later = new Date(now.getTime() + COOLDOWN_MS);
    expect(shouldNotify({ permission: 'granted', state, dueCount: 3, now: soon })).toBe(false);
    expect(shouldNotify({ permission: 'granted', state, dueCount: 3, now: later })).toBe(true);
  });

  it('notifies again right away once everything was reviewed and new cards fall due', () => {
    const notified = afterNotified(on, now);
    const cleared = settle(notified, 0);
    expect(cleared.lastNotifiedAt).toBeNull();
    const soon = new Date(now.getTime() + 60_000);
    expect(shouldNotify({ permission: 'granted', state: cleared, dueCount: 2, now: soon })).toBe(true);
  });
});

describe('settle', () => {
  it('keeps the cooldown while cards are still due', () => {
    const notified = afterNotified(on, now);
    expect(settle(notified, 4)).toBe(notified);
  });
});

describe('notificationText', () => {
  it('names the count', () => {
    expect(notificationText(7)).toEqual({ title: 'Đến giờ ôn thẻ', body: '7 thẻ đến hạn' });
  });
});

describe('parseState', () => {
  it('reads what was saved', () => {
    expect(parseState(JSON.stringify({ enabled: true, lastNotifiedAt: '2026-11-14T09:00:00.000Z' }))).toEqual({
      enabled: true,
      lastNotifiedAt: '2026-11-14T09:00:00.000Z',
    });
  });
  it('falls back to off for missing or damaged storage', () => {
    expect(parseState(null)).toEqual(DEFAULT_STATE);
    expect(parseState('not json')).toEqual(DEFAULT_STATE);
    expect(parseState(JSON.stringify({ enabled: 'yes', lastNotifiedAt: 42 }))).toEqual(DEFAULT_STATE);
  });
});
