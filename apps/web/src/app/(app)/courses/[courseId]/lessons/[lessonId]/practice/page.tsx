'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import type { ExerciseRead, SubmissionResult, SubmitExerciseInput } from '@learn/contracts';
import { useExercise, useSubmitExercise } from '@/lib/learning-api';
import { Mascot } from '@/components/mascot';
import { Badge, Button, Card, Icon, ProgressBar, cn } from '@/components/ui';
import { EmptyState, ErrorState, InlineError, LoadingState } from '@/components/ui/states';
import { ApiClientError, errorDetail, errorText } from '@/lib/api-client';
import { celebrateSuccess } from '@/lib/celebrate';
import { popIn } from '@/lib/motion';
import { motion } from 'motion/react';

type Answer = SubmitExerciseInput['answers'][number];
type AnswerState = Record<string, Answer>;
type Question = ExerciseRead['questions'][number];

/**
 * Đáp án đúng chỉ tồn tại trong `SubmissionResult` — tức là chỉ sau khi nộp
 * bài `[SPEC]`. Trước khi nộp, client không hề có dữ liệu này.
 *
 * Kiểu trả về từ API là `unknown`, hình dạng thực tế do `exercises.service.ts`
 * quyết định: `{ optionId?, value?, acceptable? }`. Bóc tách phòng thủ để một
 * hình dạng lạ chỉ làm mất phần gợi ý, không làm hỏng cả màn kết quả.
 */
function describeCorrectAnswer(question: Question, correctAnswer: unknown): string | null {
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

function correctOptionId(correctAnswer: unknown): string | null {
  if (correctAnswer === null || typeof correctAnswer !== 'object') return null;
  const c = correctAnswer as { optionId?: unknown };
  return typeof c.optionId === 'string' ? c.optionId : null;
}

/** Câu trả lời người dùng đã chọn, hiển thị lại ở màn kết quả. */
function describeGivenAnswer(question: Question, answer: Answer | undefined): string | null {
  if (!answer) return null;
  if (answer.type === 'MULTIPLE_CHOICE') {
    const opt = question.options.find((o) => o.id === answer.optionId);
    return opt ? `${opt.label}. ${opt.content}` : null;
  }
  if (answer.type === 'TRUE_FALSE') return answer.value ? 'Đúng' : 'Sai';
  return answer.text;
}

export default function PracticePage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = use(params);
  const exercise = useExercise(lessonId);
  const submitExercise = useSubmitExercise(courseId, lessonId);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  /** Câu bị đánh dấu thiếu sau một lần bấm Nộp bài hụt. */
  const [missingId, setMissingId] = useState<string | null>(null);

  function setAnswer(a: Answer) {
    setAnswers((prev) => ({ ...prev, [a.questionId]: a }));
    // Vừa trả lời đúng câu đang bị đánh dấu thì gỡ dấu ngay, không bắt người
    // dùng bấm Nộp bài lần nữa mới thấy lỗi biến mất.
    setMissingId((cur) => (cur === a.questionId ? null : cur));
  }

  /**
   * Đưa người học tới đúng câu còn thiếu.
   *
   * Trước đây bấm Nộp bài khi chưa điền hết chỉ hiện một dòng chữ đỏ ở cuối
   * trang — người dùng biết "có câu chưa trả lời" nhưng không biết là câu nào,
   * phải tự cuộn lên dò. NN/g ("10 Design Guidelines for Reporting Errors in
   * Forms"): thông báo lỗi phải nằm cạnh chỗ sai, và phải giúp người dùng tới
   * được đó. Ở đây ta cuộn tới câu, focus vào nó, và đánh dấu nó luôn.
   */
  function goToMissing(questionId: string) {
    setMissingId(questionId);
    const card = document.getElementById(`question-${questionId}`);
    if (!card) return;
    card.scrollIntoView({ block: 'center', behavior: 'smooth' });
    // Ô nhập chữ focus thẳng được; với câu trắc nghiệm thì radio đầu tiên là
    // điểm vào của nhóm, bàn phím đi tiếp bằng phím mũi tên.
    const field = card.querySelector<HTMLElement>('input, textarea');
    field?.focus({ preventScroll: true });
  }

  async function handleSubmit() {
    if (!exercise.data) return;
    setSubmitError(null);
    const list = Object.values(answers);
    if (list.length < exercise.data.questions.length) {
      const first = exercise.data.questions.find((q) => !answers[q.id]);
      const at = exercise.data.questions.findIndex((q) => !answers[q.id]) + 1;
      setSubmitError(`Câu ${at} chưa được trả lời. Trả lời hết rồi mới nộp được.`);
      if (first) goToMissing(first.id);
      return;
    }
    setMissingId(null);
    try {
      const res = await submitExercise.mutateAsync({ answers: list });
      setResult(res);
    } catch (err) {
      setSubmitError(errorText(err, 'Nộp bài thất bại, vui lòng thử lại.'));
    }
  }

  function retry() {
    setAnswers({});
    setResult(null);
    setSubmitError(null);
  }

  const backToLesson = `/courses/${courseId}/lessons/${lessonId}`;

  if (exercise.isLoading) return <LoadingState rows={3} label="Đang tải bài tập" />;

  if (exercise.isError) {
    const is404 = exercise.error instanceof ApiClientError && exercise.error.status === 404;
    return (
      <div className="space-y-4">
        {is404 ? (
          <EmptyState
            title="Bài học này chưa có bài tập"
            description="Sinh bài học bằng AI sẽ tạo kèm bài tập cho từng bài."
          />
        ) : (
          <ErrorState
            title="Không tải được bài tập"
            description={errorText(exercise.error, 'Vui lòng thử lại.')}
            detail={errorDetail(exercise.error)}
            onRetry={() => void exercise.refetch()}
          />
        )}
        <Link
          href={backToLesson}
          className="inline-flex items-center gap-1 text-sm font-bold text-sky-700 underline underline-offset-2 hover:no-underline"
        >
          <Icon name="chevron-right" size={15} className="rotate-180" />
          Quay lại bài học
        </Link>
      </div>
    );
  }

  const data = exercise.data;
  if (!data) return null;

  if (result) {
    return (
      <ResultScreen
        data={data}
        result={result}
        answers={answers}
        onRetry={retry}
        backToLesson={backToLesson}
      />
    );
  }

  const answeredCount = Object.keys(answers).length;
  const total = data.questions.length;

  return (
    <section className="mx-auto max-w-2xl">
      <Link
        href={backToLesson}
        className="inline-flex items-center gap-1 rounded-md text-sm font-bold text-ink-500 hover:text-ink-900"
      >
        <Icon name="chevron-right" size={15} className="rotate-180" />
        Bài học
      </Link>

      <h1 className="mt-3 text-2xl font-bold text-ink-900">{data.title ?? 'Bài tập'}</h1>
      {data.instruction && <p className="mt-1 text-sm text-ink-500">{data.instruction}</p>}

      <div className="mt-4 flex items-center gap-3">
        <ProgressBar
          value={answeredCount}
          max={total}
          label={`Đã trả lời ${answeredCount} trên ${total} câu`}
        />
        <span className="shrink-0 text-sm font-bold tabular-nums text-ink-700">
          {answeredCount}/{total}
        </span>
      </div>

      {data.bestSubmission && (
        <p className="mt-2 text-xs text-ink-500">
          Điểm cao nhất trước đó: {data.bestSubmission.score}/{data.bestSubmission.maxScore} (lần{' '}
          {data.bestSubmission.attemptNo})
        </p>
      )}

      <div className="mt-6 space-y-4">
        {data.questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            index={i + 1}
            question={q}
            value={answers[q.id]}
            onChange={setAnswer}
            missing={missingId === q.id}
          />
        ))}
      </div>

      {submitError && <InlineError className="mt-4">{submitError}</InlineError>}

      <div className="sticky bottom-0 z-10 -mx-4 mt-6 border-t-2 border-surface-300 bg-surface-100/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <div className="flex items-center justify-between gap-3">
          <p className="hidden text-sm font-medium text-ink-500 sm:block">
            {answeredCount < total
              ? `Còn ${total - answeredCount} câu chưa trả lời`
              : 'Đã trả lời hết, sẵn sàng nộp'}
          </p>
          <Button
            className="ml-auto"
            onClick={() => void handleSubmit()}
            disabled={submitExercise.isPending}
          >
            {submitExercise.isPending ? 'Đang nộp…' : 'Nộp bài'}
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ làm bài */

const OPTION_ROW =
  'flex cursor-pointer items-center gap-3 rounded-lg border border-surface-300 shadow-card ' +
  'bg-white px-4 py-3 text-sm transition-all duration-200 ' +
  'hover:border-surface-400 hover:shadow-raised ' +
  'has-[:checked]:border-sky-500 has-[:checked]:bg-sky-50 has-[:focus-visible]:outline-2 ' +
  'has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-sky-600';

function LetterChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="grid size-7 shrink-0 place-items-center rounded-md border border-surface-300 text-xs font-semibold text-ink-700">
      {children}
    </span>
  );
}

function QuestionCard({
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
  return (
    <Card
      id={`question-${question.id}`}
      // `scroll-mt-24` chừa chỗ cho header dính đỉnh, `scroll-mb-28` chừa chỗ cho
      // thanh nộp bài dính đáy — nếu không, cuộn tới câu nào thì câu đó nằm ngay
      // dưới thanh và bị che (WCAG 2.2 — Focus Not Obscured).
      className={cn('scroll-mb-28 scroll-mt-24', missing && 'border-danger-500 bg-danger-50/40')}
    >
      <p className="text-sm font-bold text-ink-900">
        Câu {index}. {question.prompt}
      </p>
      {missing && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-danger-700">
          <Icon name="alert" size={14} />
          Câu này chưa được trả lời.
        </p>
      )}

      {question.type === 'MULTIPLE_CHOICE' && (
        <div className="mt-3 space-y-2">
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
              <span className="text-ink-900">{opt.content}</span>
            </label>
          ))}
        </div>
      )}

      {question.type === 'TRUE_FALSE' && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {[true, false].map((v) => (
            <label key={String(v)} className={cn(OPTION_ROW, 'justify-center font-bold')}>
              <input
                type="radio"
                name={question.id}
                className="sr-only"
                checked={value?.type === 'TRUE_FALSE' && value.value === v}
                onChange={() => onChange({ type: 'TRUE_FALSE', questionId: question.id, value: v })}
              />
              <span className="text-ink-900">{v ? 'Đúng' : 'Sai'}</span>
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
          className="mt-3 w-full rounded-lg border border-surface-300 px-3 py-2 text-sm outline-none transition-all duration-200 hover:border-surface-400 focus:border-sky-500 focus-ring-tight"
        />
      )}
    </Card>
  );
}

/* ----------------------------------------------------------- kết quả */

function ResultScreen({
  data,
  result,
  answers,
  onRetry,
  backToLesson,
}: {
  data: ExerciseRead;
  result: SubmissionResult;
  answers: AnswerState;
  onRetry: () => void;
  backToLesson: string;
}) {
  const resultByQuestion = new Map(result.results.map((r) => [r.questionId, r]));

  // Chỉ bắn khi vượt qua bài, và chỉ một lần cho mỗi lượt nộp (`attemptNo` đổi
  // khi người học làm lại). Hàm tự bỏ qua nếu người dùng bật giảm chuyển động.
  useEffect(() => {
    if (result.passed) celebrateSuccess();
  }, [result.passed, result.attemptNo]);

  return (
    <section className="mx-auto max-w-2xl">
      {/* HANDBOOK §13.2: `celebrate` khi người dùng hoàn thành bài học. */}
      <motion.div initial="hidden" animate="show" variants={popIn}>
        <Card
          className={cn(
            'flex flex-col items-center gap-2 py-8 text-center',
            result.passed ? 'border-success-100' : 'border-surface-300',
          )}
        >
          <Mascot state={result.passed ? 'celebrate' : 'confused'} size={96} />
          <p className="text-3xl font-bold text-ink-900">
            {result.score}/{result.maxScore} điểm
          </p>
          <p className="text-sm font-medium text-ink-500">
            {result.passed
              ? 'Bạn đã hoàn thành bài tập!'
              : `Cần đạt ${data.passScore} điểm để qua bài.`}
          </p>
          <div className="mt-1">
            <Badge
              tone={result.passed ? 'success' : 'warning'}
              icon={result.passed ? 'check' : 'alert'}
            >
              {result.passed ? 'Đạt' : 'Chưa đạt'} · Lần {result.attemptNo}
            </Badge>
          </div>
        </Card>
      </motion.div>

      <div className="mt-5 space-y-4">
        {data.questions.map((q, i) => {
          const r = resultByQuestion.get(q.id);
          const isCorrect = r?.isCorrect ?? false;
          const correctId = correctOptionId(r?.correctAnswer);
          const correctText = r ? describeCorrectAnswer(q, r.correctAnswer) : null;
          const given = answers[q.id];
          const givenText = describeGivenAnswer(q, given);

          return (
            <Card key={q.id} className={isCorrect ? 'border-success-100' : 'border-danger-100'}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-bold text-ink-900">
                  Câu {i + 1}. {q.prompt}
                </p>
                <Badge
                  tone={isCorrect ? 'success' : 'danger'}
                  icon={isCorrect ? 'check' : 'x'}
                  className="shrink-0"
                >
                  {isCorrect ? 'Đúng' : 'Sai'}
                </Badge>
              </div>

              {q.type === 'MULTIPLE_CHOICE' && (
                <ul className="mt-3 space-y-1.5">
                  {q.options.map((opt) => {
                    const chosen = given?.type === 'MULTIPLE_CHOICE' && given.optionId === opt.id;
                    const isRight = correctId === opt.id;
                    return (
                      <li
                        key={opt.id}
                        className={cn(
                          'flex items-center gap-3 rounded-lg border px-3 py-2 text-sm',
                          isRight
                            ? 'border-success-500 bg-success-50'
                            : chosen
                              ? 'border-danger-500 bg-danger-50'
                              : 'border-surface-300',
                        )}
                      >
                        <LetterChip>{opt.label}</LetterChip>
                        <span className="text-ink-900">{opt.content}</span>
                        {isRight && (
                          <span className="ml-auto flex shrink-0 items-center gap-1 text-xs font-bold text-success-700">
                            <Icon name="check" size={13} strokeWidth={3} />
                            Đáp án đúng
                          </span>
                        )}
                        {chosen && !isRight && (
                          <span className="ml-auto shrink-0 text-xs font-bold text-danger-700">
                            Bạn chọn
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              {q.type !== 'MULTIPLE_CHOICE' && (
                <dl className="mt-3 space-y-1.5 text-sm">
                  {givenText && (
                    <div className="flex gap-2">
                      <dt className="shrink-0 font-medium text-ink-500">Bạn trả lời:</dt>
                      <dd className={isCorrect ? 'text-ink-900' : 'text-danger-700'}>
                        {givenText}
                      </dd>
                    </div>
                  )}
                  {!isCorrect && correctText && (
                    <div className="flex gap-2">
                      <dt className="shrink-0 font-medium text-ink-500">Đáp án đúng:</dt>
                      <dd className="font-bold text-success-700">{correctText}</dd>
                    </div>
                  )}
                </dl>
              )}

              {r?.explanation && (
                <p className="mt-3 rounded-xl bg-surface-100 px-3 py-2 text-sm text-ink-700">
                  {r.explanation}
                </p>
              )}
            </Card>
          );
        })}
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 mt-6 border-t-2 border-surface-300 bg-surface-100/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <div className="flex items-center justify-between gap-3">
          <Link
            href={backToLesson}
            className="inline-flex items-center gap-1 rounded-md text-sm font-bold text-ink-500 hover:text-ink-900"
          >
            <Icon name="chevron-right" size={15} className="rotate-180" />
            Bài học
          </Link>
          <Button variant="secondary" onClick={onRetry}>
            Làm lại
          </Button>
        </div>
      </div>
    </section>
  );
}
