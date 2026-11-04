import { describe, expect, it } from 'vitest';
import { formatFileSize } from './format-size';

describe('formatFileSize', () => {
  it.each([
    [4, '4 B'],
    [1023, '1023 B'],
    [1024, '1 KB'],
    [8192, '8 KB'],
    [5 * 1024 * 1024, '5.0 MB'],
  ])('%d byte', (bytes, expected) => {
    expect(formatFileSize(bytes)).toBe(expected);
  });
});
