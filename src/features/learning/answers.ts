import type { SubmitExerciseInput } from '@learn/api-contracts';

type Answer = SubmitExerciseInput['answers'][number];

/** Câu tự luận xoá hết chữ vẫn còn trong state; API từ chối chuỗi rỗng nên phải lọc trước khi nộp. */
export function answeredOnly(answers: Record<string, Answer>): Answer[] {
  return Object.values(answers).filter((a) => !('text' in a) || a.text.trim() !== '');
}
