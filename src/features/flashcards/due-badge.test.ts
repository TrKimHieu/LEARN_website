import { describe, expect, it } from 'vitest';
import { dueBadgeLabel } from './due-badge';

describe('dueBadgeLabel', () => {
  it('hides the badge when nothing is due or the count is unknown', () => {
    expect(dueBadgeLabel(0)).toBeNull();
    expect(dueBadgeLabel(undefined)).toBeNull();
    expect(dueBadgeLabel(-3)).toBeNull();
  });
  it('shows the exact count up to 99', () => {
    expect(dueBadgeLabel(1)).toBe('1');
    expect(dueBadgeLabel(99)).toBe('99');
  });
  it('caps larger counts so the badge never outgrows the tab', () => {
    expect(dueBadgeLabel(100)).toBe('99+');
    expect(dueBadgeLabel(2500)).toBe('99+');
  });
});
