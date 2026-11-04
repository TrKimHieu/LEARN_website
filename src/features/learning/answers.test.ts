import { describe, expect, it } from 'vitest';
import { answeredOnly } from './answers';

describe('answeredOnly', () => {
  it('bỏ câu tự luận chỉ có khoảng trắng', () => {
    const list = answeredOnly({
      a: { type: 'SHORT_ANSWER', questionId: 'a', text: '   ' },
      b: { type: 'SHORT_ANSWER', questionId: 'b', text: 'Có nội dung' },
      c: { type: 'TRUE_FALSE', questionId: 'c', value: false },
    });
    expect(list.map((x) => x.questionId)).toEqual(['b', 'c']);
  });
});
