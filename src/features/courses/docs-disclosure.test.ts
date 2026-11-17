import { describe, expect, it } from 'vitest';
import { docsStartOpen } from './docs-disclosure';

describe('docsStartOpen', () => {
  it('no documents starts open', () => {
    expect(docsStartOpen({ docCount: 0, uploading: false, uploadError: false })).toBe(true);
  });
  it('documents present starts closed', () => {
    expect(docsStartOpen({ docCount: 2, uploading: false, uploadError: false })).toBe(false);
  });
  it('uploading starts open', () => {
    expect(docsStartOpen({ docCount: 2, uploading: true, uploadError: false })).toBe(true);
  });
  it('upload error starts open', () => {
    expect(docsStartOpen({ docCount: 2, uploading: false, uploadError: true })).toBe(true);
  });
});
