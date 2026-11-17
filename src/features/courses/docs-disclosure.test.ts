import { describe, expect, it } from 'vitest';
import { docsStartOpen } from './docs-disclosure';

describe('docsStartOpen', () => {
  const base = { docCount: 2, loading: false, uploading: false, uploadError: false };
  it('no documents starts open', () => {
    expect(docsStartOpen({ ...base, docCount: 0 })).toBe(true);
  });
  it('documents present starts closed', () => {
    expect(docsStartOpen(base)).toBe(false);
  });
  it('uploading starts open', () => {
    expect(docsStartOpen({ ...base, uploading: true })).toBe(true);
  });
  it('upload error starts open', () => {
    expect(docsStartOpen({ ...base, uploadError: true })).toBe(true);
  });
  it('stays closed while the document list is still loading', () => {
    expect(docsStartOpen({ ...base, docCount: 0, loading: true })).toBe(false);
  });
});
