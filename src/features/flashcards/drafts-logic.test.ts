import { describe, expect, it } from 'vitest';
import {
  acceptLabel,
  generationState,
  generationErrorText,
  selectAll,
  toggle,
  withoutIds,
} from './drafts-logic';

const ids = ['a', 'b', 'c'];

describe('selection', () => {
  it('selects every draft at first, so accepting all is one click', () => {
    expect(selectAll(ids)).toEqual(new Set(ids));
  });
  it('toggles one draft without touching the others', () => {
    const s = toggle(new Set(ids), 'b');
    expect([...s].sort()).toEqual(['a', 'c']);
    expect(toggle(s, 'b')).toEqual(new Set(ids));
  });
  it('drops ids that are gone (deleted or accepted) from the selection', () => {
    expect(withoutIds(new Set(ids), ['b'])).toEqual(new Set(['a', 'c']));
  });
  it('does not mutate the previous selection', () => {
    const before = new Set(ids);
    toggle(before, 'a');
    expect(before).toEqual(new Set(ids));
  });
});

describe('acceptLabel', () => {
  it('names the number of selected cards', () => {
    expect(acceptLabel(3)).toBe('Thêm 3 thẻ');
  });
  it('is generic when nothing is selected', () => {
    expect(acceptLabel(0)).toBe('Thêm thẻ');
  });
});

describe('generationState', () => {
  it('maps job statuses to what the screen shows', () => {
    expect(generationState(undefined)).toBe('idle');
    expect(generationState({ status: 'QUEUED' })).toBe('running');
    expect(generationState({ status: 'RUNNING' })).toBe('running');
    expect(generationState({ status: 'SUCCEEDED' })).toBe('done');
    expect(generationState({ status: 'FAILED' })).toBe('failed');
    expect(generationState({ status: 'CANCELLED' })).toBe('cancelled');
  });
});

describe('generationErrorText', () => {
  it('explains known failure codes in Vietnamese', () => {
    expect(generationErrorText({ code: 'NO_SOURCE_CONTENT' })).toMatch(/chưa có nội dung/);
    expect(generationErrorText({ code: 'FLASHCARD_OUTPUT_INVALID' })).toMatch(/thử lại/);
  });
  it('falls back to a generic message instead of showing a machine code', () => {
    expect(generationErrorText({ code: 'SOMETHING_NEW' })).toBe('Không sinh được thẻ, vui lòng thử lại.');
    expect(generationErrorText(null)).toBe('Không sinh được thẻ, vui lòng thử lại.');
  });
});
