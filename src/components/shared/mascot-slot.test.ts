import { afterEach, describe, expect, it } from 'vitest';
import { claimMascot, currentMascot } from './mascot-slot';

const releases: Array<() => void> = [];
const claim = (id: string, role: 'overlay' | 'state' | 'companion') => {
  const release = claimMascot(id, role);
  releases.push(release);
  return release;
};

afterEach(() => {
  releases.splice(0).forEach((release) => release());
});

describe('mascot-slot', () => {
  it('không có mascot nào thì không ai thắng', () => {
    expect(currentMascot()).toBeNull();
  });

  it('mascot trạng thái thắng mascot đồng hành dù gắn sau', () => {
    claim('header', 'companion');
    claim('empty', 'state');
    expect(currentMascot()).toBe('empty');
  });

  it('mascot trong hộp thoại phủ thắng mascot trạng thái của trang bên dưới', () => {
    claim('empty', 'state');
    claim('popup', 'overlay');
    expect(currentMascot()).toBe('popup');
  });

  it('cùng loại thì cái gắn trước thắng', () => {
    claim('a', 'state');
    claim('b', 'state');
    expect(currentMascot()).toBe('a');
  });

  it('mascot trạng thái biến mất thì mascot đồng hành hiện lại', () => {
    claim('header', 'companion');
    const release = claim('empty', 'state');
    release();
    expect(currentMascot()).toBe('header');
  });
});
