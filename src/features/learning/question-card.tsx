'use client';

import type { ExerciseRead, SubmitExerciseInput } from '@learn/api-contracts';
import { UserText } from '@/components/ui/user-text';
import { Card, Icon, cn } from '@/components/ui';

type Answer = SubmitExerciseInput['answers'][number];
type Question = ExerciseRead['questions'][number];

/**
 * Đáp án đúng chỉ tồn tại trong `SubmissionResult` — tức là chỉ sau khi nộp bài `[SPEC]`.
 * Trước khi nộp, client không hề có dữ liệu này.
 *
 * Kiểu trả về từ API là `unknown`, hình dạng thực tế do `exercises.service.ts` quyết
 * định: `{ optionId?, value?, acceptable? }`. Bóc tách phòng thủ để một hình dạng lạ chỉ
 * làm mất phần gợi ý, không làm hỏng cả màn kết quả.
 */
export function describeCorrectAnswer(question: Question, correctAnswer: unknown): string | null {
  if (correctAnswer === null || typeof correctAnswer !== 'object') return null;
  const c = correctAnswer as { optionId?: unknown; value?: unknown; acceptable?: unknown };

  if (question.type === 'MULTIPLE_CHOICE' && typeof c.optionId === 'string') {
    const opt = question.options.find((o) => o.id === c.optionId);
    return opt ? `${opt.label}. ${opt.content}` : null;
  }
  if (question.type === 'TRUE_FALSE' && typeof c.value === 'boolean') {
    return c.value ? 'Đúng' : 'Sai';
  }
  if (Array.isArray(c.acceptable)) {
    const list = c.acceptable.filter((x): x is string => typeof x === 'string');
    return list.length > 0 ? list.join(' · ') : null;
  }
  return null;
}

export function correctOptionId(correctAnswer: unknown): string | null {
  if (correctAnswer === null || typeof correctAnswer !== 'object') return null;
  const c = correctAnswer as { optionId?: unknown };
  return typeof c.optionId === 'string' ? c.optionId : null;
}

const OPTION_ROW =
  'tactile group/opt mb-1 flex min-h-12 cursor-pointer items-center gap-3 rounded-control border-[1.5px] border-line-strong ' +
  '[--edge:var(--line-strong)] bg-panel px-4 py-3 text-[0.9375rem] ' +
  'hover:border-accent hover:bg-panel-2 ' +
  'has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:checked]:[--edge:var(--brand)] ' +
  'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-fg';

function LetterChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-md border border-line-strong bg-panel text-xs font-semibold text-fg-muted transition-colors duration-200 group-has-[:checked]/opt:border-fg group-has-[:checked]/opt:bg-fg group-has-[:checked]/opt:text-panel">
      {children}
    </span>
  );
}

export function QuestionCard({
  index,
  question,
  value,
  onChange,
  missing = false,
}: {
  index: number;
  question: Question;
  value: Answer | undefined;
  onChange: (a: Answer) => void;
  /** Bị bỏ trống khi người dùng bấm Nộp bài — đánh dấu ngay tại chỗ. */
  missing?: boolean;
}) {
  const promptId = `prompt-${question.id}`;
  return (
    <Card
      id={`question-${question.id}`}
      // Chừa chỗ cho header dính đỉnh và thanh nộp bài dính đáy — WCAG 2.4.11.
      className={cn('scroll-mb-40 scroll-mt-24', missing && 'border-2 border-fg bg-bad-soft')}
    >
      <div className="flex gap-3">
        <span aria-hidden className="w-5 shrink-0 pt-0.5 font-semibold tabular-nums text-fg-subtle">
          {index}.
        </span>
        <p id={promptId} className="pt-0.5 font-semibold leading-relaxed text-fg">
          <span className="sr-only">Câu {index}. </span>
          <UserText full>{question.prompt}</UserText>
        </p>
      </div>
      {missing && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-bad">
          <Icon name="alert" size={14} />
          Câu này chưa được trả lời.
        </p>
      )}

      {question.type === 'MULTIPLE_CHOICE' && (
        <div role="radiogroup" aria-labelledby={promptId} className="mt-4 space-y-2">
          {question.options.map((opt) => (
            <label key={opt.id} className={OPTION_ROW}>
              <input
                type="radio"
                name={question.id}
                className="sr-only"
                checked={value?.type === 'MULTIPLE_CHOICE' && value.optionId === opt.id}
                onChange={() =>
                  onChange({ type: 'MULTIPLE_CHOICE', questionId: question.id, optionId: opt.id })
                }
              />
              <LetterChip>{opt.label}</LetterChip>
              <span className="text-fg">
                <UserText full>{opt.content}</UserText>
              </span>
            </label>
          ))}
        </div>
      )}

      {question.type === 'TRUE_FALSE' && (
        <div role="radiogroup" aria-labelledby={promptId} className="mt-4 grid grid-cols-2 gap-2">
          {[true, false].map((v) => (
            <label key={String(v)} className={cn(OPTION_ROW, 'justify-center font-semibold')}>
              <input
                type="radio"
                name={question.id}
                className="sr-only"
                checked={value?.type === 'TRUE_FALSE' && value.value === v}
                onChange={() => onChange({ type: 'TRUE_FALSE', questionId: question.id, value: v })}
              />
              <Icon name={v ? 'check' : 'x'} size={16} className="text-fg-subtle" />
              <span className="text-fg">{v ? 'Đúng' : 'Sai'}</span>
            </label>
          ))}
        </div>
      )}

      {(question.type === 'SHORT_ANSWER' || question.type === 'FILL_BLANK') && (
        <input
          type="text"
          value={value && 'text' in value ? value.text : ''}
          onChange={(e) => {
            const text = e.target.value;
            if (question.type === 'SHORT_ANSWER') {
              onChange({ type: 'SHORT_ANSWER', questionId: question.id, text });
            } else {
              onChange({ type: 'FILL_BLANK', questionId: question.id, text });
            }
          }}
          placeholder="Nhập câu trả lời…"
          aria-labelledby={promptId}
          className="mt-4 h-11 w-full rounded-control border border-line bg-panel px-3.5 text-[0.9375rem] text-fg outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-fg-subtle/80 hover:border-line-strong focus:border-fg focus:shadow-[0_0_0_4px_rgb(94_200_245/0.18)]"
        />
      )}
    </Card>
  );
}
