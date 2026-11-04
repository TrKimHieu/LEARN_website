import { describe, expect, it } from 'vitest';
import { isEndReached } from './reading-progress';

describe('isEndReached', () => {
  it('mốc cuối bài còn dưới màn hình thì chưa xong', () => {
    expect(isEndReached(1500, 800)).toBe(false);
  });

  it('mốc bị thanh dính đáy che vẫn tính là chưa thấy', () => {
    expect(isEndReached(750, 800)).toBe(false);
  });

  it('mốc đã lộ phía trên thanh thì xong, kể cả bài ngắn', () => {
    expect(isEndReached(700, 800)).toBe(true);
    expect(isEndReached(-200, 800)).toBe(true);
  });
});
