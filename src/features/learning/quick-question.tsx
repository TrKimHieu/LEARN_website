'use client';

import { useEffect, useRef, useState } from 'react';
import type { CheckResult, ExerciseRead, SubmitExerciseInput } from '@learn/api-contracts';
import { Mascot } from '@/components/shared/mascot';
import { Button, Icon, InlineError, cn } from '@/components/ui';
import { UserText } from '@/components/ui/user-text';
import { ApiClientError } from '@/lib/api-client';
import { useCheckAnswer } from './learning-api';
import { QuestionCard, describeCorrectAnswer } from './question-card';
import { canCheck } from './quick-queue';

type Answer = SubmitExerciseInput['answers'][number];
type Question = ExerciseRead['questions'][number];

/**
 * Câu hỏi nhanh giữa các bước bài học (spec 4.3): chỉ chấm bằng `/exercise/check`, không lưu và
 * không nộp gì, nên không ảnh hưởng điểm luyện tập.
 */
export function QuickQuestion({
  lessonId,
  exerciseId,
  question,
  onDone,
}: {
  lessonId: string;
  exerciseId: string;
  question: Question;
  onDone: () => void;
}) {
  const check = useCheckAnswer(lessonId);
  const [answer, setAnswer] = useState<Answer | undefined>();
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const footer = useRef<HTMLDivElement>(null);

  // Khoá đáp án làm mất focus đang ở ô chọn: đưa focus sang nút "Tiếp" để Enter đi tiếp. Khung
  // kết quả nằm dưới đề, không dính đáy như ở luyện tập: cuộn tới để người học thấy đáp án.
  useEffect(() => {
    if (!result) return;
    footer.current?.scrollIntoView({ block: 'nearest' });
    footer.current?.querySelector<HTMLElement>('[type=submit]')?.focus({ preventScroll: true });
  }, [result]);

  async function runCheck() {
    if (check.isPending || !answer || !canCheck(answer)) return;
    try {
      setResult(await check.mutateAsync({ exerciseId, answer }));
      setError(null);
    } catch (err) {
      // Lỗi mạng của `fetch` là tiếng Anh ("Failed to fetch"); chỉ hiện lời của API.
      setError(
        err instanceof ApiClientError && err.message
          ? err.message
          : 'Không kiểm tra được, vui lòng thử lại.',
      );
    }
  }

  const correctText =
    result && !result.isCorrect ? describeCorrectAnswer(question, result.correctAnswer) : null;

  return (
    <form
      className="max-w-[72ch]"
      onSubmit={(e) => {
        e.preventDefault();
        if (result) onDone();
        else void runCheck();
      }}
    >
      <h2 className="mb-4 font-display text-lg font-semibold text-fg">Câu hỏi nhanh</h2>

      {/* Lỗi cũ giữ nguyên tới khi chấm xong: gỡ sớm sẽ làm rơi focus của nút "Thử lại". */}
      {/* Lúc đang chấm không khoá, để focus không rơi khỏi ô chọn; `runCheck` tự chặn bấm lặp. */}
      <fieldset disabled={Boolean(result)}>
        <QuestionCard
          question={question}
          value={answer}
          onChange={(a) => {
            setAnswer(a);
            setError(null);
          }}
        />
      </fieldset>

      {error && (
        <InlineError className="mt-4">
          {error}{' '}
          <Button variant="link" size="sm" onClick={() => void runCheck()}>
            Thử lại
          </Button>
        </InlineError>
      )}

      <div
        ref={footer}
        // Chừa chỗ cho thanh hành động dính đáy của bài học.
        className={cn(
          'mt-4 flex scroll-mb-40 flex-wrap items-center gap-3 rounded-card border p-3',
          !result && 'border-line bg-panel',
          result?.isCorrect && 'border-ok-line bg-ok-soft',
          result?.isCorrect === false && 'border-bad-line bg-bad-soft',
        )}
      >
        <Mascot
          state={result ? (result.isCorrect ? 'happy' : 'confused') : 'listening'}
          size={44}
          priority="companion"
          className="shrink-0"
        />
        <div role="status" className="min-w-0 flex-1 basis-40 text-sm">
          {result?.isCorrect && (
            <p className="flex items-center gap-1.5 font-semibold text-ok">
              <Icon name="check" size={16} strokeWidth={2.75} />
              Chính xác!
            </p>
          )}
          {result && !result.isCorrect && (
            <p className="flex gap-1.5 font-semibold text-bad">
              <Icon name="x" size={16} strokeWidth={2.75} className="mt-0.5 shrink-0" />
              <span className="min-w-0">
                {correctText ? (
                  <>
                    Đáp án: <UserText full>{correctText}</UserText>
                  </>
                ) : (
                  'Chưa đúng'
                )}
              </span>
            </p>
          )}
          {result?.explanation && (
            <p className="mt-1 leading-relaxed text-fg-muted">
              <UserText full>{result.explanation}</UserText>
            </p>
          )}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {!result && (
            <Button variant="ghost" onClick={onDone}>
              Bỏ qua
            </Button>
          )}
          {/* Không dùng `loading`: nó tắt nút và làm rơi focus; bấm lặp đã bị `runCheck` chặn. */}
          <Button
            type="submit"
            disabled={!result && !canCheck(answer)}
            aria-disabled={check.isPending || undefined}
          >
            {check.isPending && <Icon name="spinner" size={16} className="animate-spin" />}
            {result ? 'Tiếp' : check.isPending ? 'Đang kiểm tra…' : 'Kiểm tra'}
            {result && <Icon name="arrow-right" size={16} />}
          </Button>
        </div>
      </div>
    </form>
  );
}
