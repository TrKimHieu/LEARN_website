'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type {
  CheckResult,
  ExerciseRead,
  SubmissionResult,
  SubmitExerciseInput,
} from '@learn/api-contracts';
import { Mascot, type MascotState } from '@/components/shared/mascot';
import { Button, EmptyState, Icon, InlineError, LoadingState, ProgressBar, cn } from '@/components/ui';
import { UserText } from '@/components/ui/user-text';
import { ApiClientError } from '@/lib/api-client';
import { useCheckAnswer, useSubmitExercise } from './learning-api';
import { QuestionCard, STICKY_BAR, STICKY_PANEL, describeCorrectAnswer } from './question-card';
import {
  canCheck,
  currentQuestion,
  isFinished,
  progress,
  recordCheck,
  startQuick,
  submissionAnswers,
  type QuickState,
} from './quick-queue';

type Answer = SubmitExerciseInput['answers'][number];

export interface QuickSummary {
  bestStreak: number;
  durationMs: number;
}

/** Lỗi mạng của `fetch` là tiếng Anh ("Failed to fetch"); chỉ hiện lời của API. */
function failText(err: unknown, fallback: string): string {
  return err instanceof ApiClientError && err.message ? err.message : fallback;
}

/** Trần của `durationMs` trong `submitExerciseSchema`; phiên dài hơn vẫn nộp được. */
const MAX_DURATION_MS = 3_600_000;

/**
 * Luyện tập từng câu, chấm ngay (spec 4.4). Chỉ nộp bài một lần khi hết hàng, bằng lần trả lời đầu
 * tiên của mỗi câu; rời trang giữa chừng thì không nộp gì.
 */
export function QuickSession({
  courseId,
  lessonId,
  data,
  onFinished,
  onExamMode,
}: {
  courseId: string;
  lessonId: string;
  data: ExerciseRead;
  onFinished: (
    result: SubmissionResult,
    answers: Record<string, Answer>,
    summary: QuickSummary,
  ) => void;
  onExamMode: () => void;
}) {
  const check = useCheckAnswer(lessonId);
  const submit = useSubmitExercise(courseId, lessonId);
  const [state, setState] = useState<QuickState>(() =>
    startQuick(data.questions.map((q) => q.id)),
  );
  const [answer, setAnswer] = useState<Answer | undefined>();
  /** Kết quả kiểm tra câu hiện tại; còn null là chưa kiểm tra. */
  const [verdict, setVerdict] = useState<{ answer: Answer; result: CheckResult } | null>(null);
  const [mood, setMood] = useState<MascotState>('listening');
  const [error, setError] = useState<string | null>(null);
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const questionId = currentQuestion(state);
  const question = data.questions.find((q) => q.id === questionId);
  const { done, total } = progress(state);
  const streak = verdict ? (verdict.result.isCorrect ? state.streak + 1 : 0) : state.streak;

  async function runCheck() {
    if (!answer || !canCheck(answer)) return;
    setError(null);
    try {
      const result = await check.mutateAsync({ exerciseId: data.id, answer });
      const nextStreak = result.isCorrect ? state.streak + 1 : 0;
      setVerdict({ answer, result });
      setMood(result.isCorrect ? (nextStreak >= 3 ? 'celebrate' : 'happy') : 'confused');
    } catch (err) {
      setError(failText(err, 'Không kiểm tra được, vui lòng thử lại.'));
    }
  }

  async function finish(s: QuickState) {
    setError(null);
    const durationMs = Math.max(1, Date.now() - startedAt.current);
    try {
      const res = await submit.mutateAsync({
        exerciseId: data.id,
        answers: submissionAnswers(s),
        durationMs: Math.min(durationMs, MAX_DURATION_MS),
      });
      onFinished(res, s.firstAnswers, { bestStreak: s.bestStreak, durationMs });
    } catch (err) {
      setError(failText(err, 'Nộp bài thất bại, vui lòng thử lại.'));
    }
  }

  function next() {
    if (!verdict) return;
    const s = recordCheck(state, verdict.answer, verdict.result.isCorrect);
    setState(s);
    setAnswer(undefined);
    setVerdict(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (isFinished(s)) void finish(s);
  }

  if (data.questions.length === 0) {
    return <EmptyState title="Bài tập này chưa có câu hỏi" className="mx-auto mt-6 max-w-2xl" />;
  }

  if (!question) {
    return (
      <section className="mx-auto mt-6 max-w-2xl">
        <h1 className="sr-only">{data.title ?? 'Bài tập'}</h1>
        {error ? (
          <InlineError>
            {error}{' '}
            <Button variant="link" size="sm" onClick={() => void finish(state)}>
              Thử lại
            </Button>
          </InlineError>
        ) : (
          <LoadingState rows={2} label="Đang nộp bài" />
        )}
      </section>
    );
  }

  const correctText =
    verdict && !verdict.result.isCorrect
      ? describeCorrectAnswer(question, verdict.result.correctAnswer)
      : null;

  return (
    <form
      className="mx-auto max-w-2xl"
      onSubmit={(e) => {
        e.preventDefault();
        if (verdict) next();
        else void runCheck();
      }}
    >
      <h1 className="sr-only">{data.title ?? 'Bài tập'}</h1>
      <div className="mt-4 flex items-center gap-3">
        <Link
          href={`/courses/${courseId}/lessons/${lessonId}`}
          aria-label="Về bài học"
          className="-ml-2 grid size-11 shrink-0 place-items-center rounded-control text-fg-muted transition-colors hover:bg-muted hover:text-fg focus-ring md:size-9"
        >
          <Icon name="x" size={18} />
        </Link>
        <ProgressBar
          value={done}
          max={total}
          label={`Đã làm ${done} trên ${total} câu`}
          className="flex-1"
        />
        {streak >= 2 && (
          <span className="shrink-0 text-sm font-semibold tabular-nums text-fg">🔥 {streak}</span>
        )}
      </div>

      {/* Đã kiểm tra thì khoá đáp án: lần trả lời được ghi là lần vừa chấm. */}
      <fieldset disabled={Boolean(verdict) || check.isPending} className="mt-6">
        <QuestionCard
          index={data.questions.indexOf(question) + 1}
          question={question}
          value={answer}
          onChange={(a) => {
            setAnswer(a);
            setError(null);
          }}
        />
      </fieldset>

      <Button variant="link" size="sm" className="mt-4" onClick={onExamMode}>
        Làm kiểu kiểm tra
      </Button>

      {error && (
        <InlineError className="mt-5">
          {error}{' '}
          <Button variant="link" size="sm" onClick={() => void runCheck()}>
            Thử lại
          </Button>
        </InlineError>
      )}

      <div className={STICKY_BAR}>
        <div
          className={cn(
            STICKY_PANEL,
            'gap-3 p-2 sm:p-3',
            verdict &&
              (verdict.result.isCorrect ? 'border-ok-line bg-ok-soft' : 'border-bad-line bg-bad-soft'),
          )}
        >
          <Mascot state={mood} size={44} className="shrink-0" />
          <div role="status" className="min-w-0 flex-1 text-sm">
            {verdict?.result.isCorrect && (
              <p className="flex items-center gap-1.5 font-semibold text-ok">
                <Icon name="check" size={16} strokeWidth={2.75} />
                Chính xác!
              </p>
            )}
            {verdict && !verdict.result.isCorrect && (
              <>
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
                {verdict.result.explanation && (
                  // Lời giải dài không được che hết màn hẹp: thanh này dính đáy.
                  <p className="mt-1 max-h-24 overflow-y-auto leading-relaxed text-fg-muted">
                    <UserText full>{verdict.result.explanation}</UserText>
                  </p>
                )}
              </>
            )}
          </div>
          <Button
            type="submit"
            className="shrink-0"
            disabled={!verdict && !canCheck(answer)}
            loading={check.isPending}
          >
            {verdict
              ? verdict.result.isCorrect
                ? 'Tiếp'
                : 'Hiểu rồi'
              : check.isPending
                ? 'Đang kiểm tra…'
                : 'Kiểm tra'}
          </Button>
        </div>
      </div>
    </form>
  );
}
