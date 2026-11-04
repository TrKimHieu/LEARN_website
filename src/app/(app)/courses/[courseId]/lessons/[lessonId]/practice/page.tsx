'use client';

import { UserText } from '@/components/ui/user-text';
import { use, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { ExerciseRead, SubmissionResult, SubmitExerciseInput } from '@learn/api-contracts';
import { useExercise, useLessons, useSubmitExercise } from '@/features/learning/learning-api';
import { LessonSplit } from '@/features/learning/lesson-split';
import { useCourse } from '@/features/courses/courses-api';
import { useQueryParam } from '@/lib/url-state';
import { Mascot } from '@/components/shared/mascot';
import {
  BackLink,
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  ErrorState,
  Icon,
  InlineError,
  LoadingState,
  ProgressBar,
  ProgressRing,
  cn,
} from '@/components/ui';
import { ApiClientError, errorDetail, errorText } from '@/lib/api-client';
import { usePageTitle } from '@/lib/use-page-title';
import { answeredOnly } from '@/features/learning/answers';
import { celebrateSuccess } from '@/lib/celebrate';
import { popIn } from '@/lib/motion';

type Answer = SubmitExerciseInput['answers'][number];
type AnswerState = Record<string, Answer>;
type Question = ExerciseRead['questions'][number];

/**
 * Đáp án đúng chỉ tồn tại trong `SubmissionResult` — tức là chỉ sau khi nộp bài `[SPEC]`.
 * Trước khi nộp, client không hề có dữ liệu này.
 *
 * Kiểu trả về từ API là `unknown`, hình dạng thực tế do `exercises.service.ts` quyết
 * định: `{ optionId?, value?, acceptable? }`. Bóc tách phòng thủ để một hình dạng lạ chỉ
 * làm mất phần gợi ý, không làm hỏng cả màn kết quả.
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

/** Thanh hành động dính đáy — nằm trên thanh tab mobile, sát đáy từ `lg`. */
const STICKY_BAR =
  'sticky bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] z-10 mt-8 lg:bottom-4';
const STICKY_PANEL =
  'flex items-center gap-4 rounded-card border border-line bg-panel shadow-overlay';

export default function PracticePage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = use(params);
  // Bài tập đang mở sống trong URL: F5 hay gửi link vẫn đúng bài tập (UX-UI-PRINCIPLES §12).
  const [exerciseParam, setExerciseParam] = useQueryParam('exercise');
  const exercise = useExercise(lessonId, exerciseParam);
  const course = useCourse(courseId);
  usePageTitle(exercise.data?.title ?? 'Bài tập');
  const backToLesson = `/courses/${courseId}/lessons/${lessonId}`;

  if (exercise.isLoading) {
    return (
      <div className="mx-auto max-w-2xl">
        <LoadingState rows={4} variant="card" label="Đang tải bài tập" />
      </div>
    );
  }

  if (exercise.isError) {
    const is404 = exercise.error instanceof ApiClientError && exercise.error.status === 404;
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <h1 className="sr-only">Bài tập</h1>
        <BackLink href={backToLesson} label="Quay lại bài học" />
        {is404 && exerciseParam ? (
          <EmptyState
            title="Không tìm thấy bài tập này"
            description="Đường dẫn có thể đã cũ. Mở bài tập đầu tiên của bài học để làm tiếp."
            action={{ label: 'Mở bài tập đầu tiên', onClick: () => setExerciseParam('') }}
          />
        ) : is404 ? (
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
      </div>
    );
  }

  const data = exercise.data;
  if (!data) return null;

  return (
    <LessonSplit courseId={courseId} courseTitle={course.data?.title} lessonId={lessonId}>
      {/* `key`: đổi bài tập là một phiên làm bài mới, câu trả lời của bài trước không được sót lại. */}
      <ExerciseSession
        key={data.id}
        courseId={courseId}
        lessonId={lessonId}
        data={data}
        backToLesson={backToLesson}
        onOpenExercise={(id) => {
          setExerciseParam(id);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </LessonSplit>
  );
}

function ExerciseSession({
  courseId,
  lessonId,
  data,
  backToLesson,
  onOpenExercise,
}: {
  courseId: string;
  lessonId: string;
  data: ExerciseRead;
  backToLesson: string;
  onOpenExercise: (exerciseId: string) => void;
}) {
  const submitExercise = useSubmitExercise(courseId, lessonId);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  /** Câu bị đánh dấu thiếu sau một lần bấm Nộp bài hụt. */
  const [missingId, setMissingId] = useState<string | null>(null);
  /** Số câu còn trống khi đang hỏi có muốn nộp luôn không; null = không hỏi. */
  const [confirmingBlank, setConfirmingBlank] = useState<number | null>(null);

  function setAnswer(a: Answer) {
    setAnswers((prev) => ({ ...prev, [a.questionId]: a }));
    // Trả lời đúng câu đang bị đánh dấu thì gỡ dấu ngay.
    setMissingId((cur) => (cur === a.questionId ? null : cur));
    setSubmitError(null);
    setConfirmingBlank(null);
  }

  /**
   * Đưa người học tới đúng câu còn thiếu: cuộn tới, focus, đánh dấu tại chỗ — NN/g
   * "10 Design Guidelines for Reporting Errors in Forms".
   */
  function goToMissing(questionId: string) {
    setMissingId(questionId);
    const card = document.getElementById(`question-${questionId}`);
    if (!card) return;
    card.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const field = card.querySelector<HTMLElement>('input, textarea');
    field?.focus({ preventScroll: true });
  }

  function firstBlankQuestion() {
    const answered = new Set(answeredOnly(answers).map((a) => a.questionId));
    return data.questions.find((q) => !answered.has(q.id));
  }

  /** Bỏ trống vài câu là quyền của người học (tính 0 điểm), chỉ cần hỏi lại một lần. */
  async function handleSubmit({ allowBlank = false } = {}) {
    setSubmitError(null);
    const list = answeredOnly(answers);
    if (list.length === 0) {
      setSubmitError('Hãy trả lời ít nhất một câu rồi mới nộp bài.');
      const first = firstBlankQuestion();
      if (first) goToMissing(first.id);
      return;
    }
    if (list.length < data.questions.length && !allowBlank) {
      setConfirmingBlank(data.questions.length - list.length);
      return;
    }
    setConfirmingBlank(null);
    setMissingId(null);
    try {
      const res = await submitExercise.mutateAsync({ answers: list, exerciseId: data.id });
      setResult(res);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSubmitError(errorText(err, 'Nộp bài thất bại, vui lòng thử lại.'));
    }
  }

  function retry() {
    setAnswers({});
    setResult(null);
    setSubmitError(null);
    setConfirmingBlank(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (result) {
    return (
      <ResultScreen
        courseId={courseId}
        lessonId={lessonId}
        data={data}
        result={result}
        answers={answers}
        onRetry={retry}
        onOpenExercise={onOpenExercise}
        backToLesson={backToLesson}
      />
    );
  }

  const answeredCount = answeredOnly(answers).length;
  const total = data.questions.length;
  const position = data.exercises.findIndex((e) => e.id === data.id);

  return (
    <section className="mx-auto max-w-2xl">
      <ExercisePicker data={data} onOpen={onOpenExercise} className="mt-6" />

      <header className="mt-6">
        <p className="text-sm text-fg-subtle">
          {data.exercises.length > 1 && position >= 0
            ? `Bài tập ${position + 1}/${data.exercises.length}`
            : 'Bài tập'}
          {` · ${total} câu, cần ${data.passScore} điểm để qua`}
        </p>
        <h1 className="mt-1 font-display text-[1.75rem] font-semibold leading-[1.15] text-fg sm:text-[2rem]">
          {data.title ?? 'Bài tập'}
        </h1>
        {data.instruction && (
          <p className="mt-2 leading-relaxed text-fg-subtle">{data.instruction}</p>
        )}
        {data.bestSubmission && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-fg-subtle">
            <Icon name="trophy" size={13} className="text-warn" />
            Điểm cao nhất trước đó: {data.bestSubmission.score}/{data.bestSubmission.maxScore} (lần{' '}
            {data.bestSubmission.attemptNo})
          </p>
        )}
      </header>

      <ol className="mt-8 space-y-4">
        {data.questions.map((q, i) => (
          <li key={q.id}>
            <QuestionCard
              index={i + 1}
              question={q}
              value={answers[q.id]}
              onChange={setAnswer}
              missing={missingId === q.id}
            />
          </li>
        ))}
      </ol>

      {submitError && <InlineError className="mt-5">{submitError}</InlineError>}
      {confirmingBlank !== null && (
        <div
          role="alert"
          className="mt-5 rounded-control border border-line bg-panel-2 px-3.5 py-3 text-sm text-fg"
        >
          <p className="font-medium">Còn {confirmingBlank} câu chưa trả lời. Vẫn nộp bài?</p>
          <p className="mt-1 text-fg-subtle">Câu bỏ trống được tính 0 điểm.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => void handleSubmit({ allowBlank: true })}>
              Vẫn nộp bài
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setConfirmingBlank(null);
                const first = firstBlankQuestion();
                if (first) goToMissing(first.id);
              }}
            >
              Làm tiếp
            </Button>
          </div>
        </div>
      )}

      <div className={STICKY_BAR}>
        <div className={cn(STICKY_PANEL, 'p-2 pl-4 sm:p-3 sm:pl-4')}>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-fg-subtle sm:mb-1.5">
              {answeredCount < total
                ? `Đã trả lời ${answeredCount}/${total}, còn ${total - answeredCount} câu`
                : 'Đã trả lời hết, sẵn sàng nộp'}
            </p>
            {/* Màn hẹp còn thanh điều hướng dưới cùng: dòng chữ đã đủ, không chiếm thêm chỗ học. */}
            <ProgressBar
              size="sm"
              value={answeredCount}
              max={total}
              label={`Đã trả lời ${answeredCount} trên ${total} câu`}
              className="hidden sm:block"
            />
          </div>
          <Button onClick={() => void handleSubmit()} loading={submitExercise.isPending}>
            {submitExercise.isPending ? 'Đang nộp…' : 'Nộp bài'}
          </Button>
        </div>
      </div>
    </section>
  );
}

/**
 * Chọn bài tập khi bài học có nhiều bài tập. Mỗi bài tập mang dấu đạt bằng icon + chữ, không
 * chỉ bằng màu (ADR 015). Bài học chỉ có một bài tập thì không hiện gì.
 */
function ExercisePicker({
  data,
  onOpen,
  className,
}: {
  data: ExerciseRead;
  onOpen: (exerciseId: string) => void;
  className?: string;
}) {
  if (data.exercises.length < 2) return null;
  const passedCount = data.exercises.filter((e) => e.passed).length;
  return (
    <nav aria-label="Các bài tập của bài học" className={className}>
      <p className="mb-2 text-xs font-medium text-fg-subtle">
        Đã đạt {passedCount}/{data.exercises.length} bài tập. Đạt hết để hoàn thành bài học.
      </p>
      <ul className="flex flex-wrap gap-2">
        {data.exercises.map((e, i) => {
          const current = e.id === data.id;
          return (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => !current && onOpen(e.id)}
                aria-current={current ? 'step' : undefined}
                title={e.title ?? undefined}
                className={cn(
                  'inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-sm transition-colors duration-150 focus-ring-tight',
                  current
                    ? 'border-fg bg-fg font-semibold text-app'
                    : 'border-line bg-panel text-fg hover:border-line-strong',
                )}
              >
                {e.passed && <Icon name="check" size={14} strokeWidth={2.75} />}
                Bài tập {i + 1}
                <span className="sr-only">{e.passed ? ', đã đạt' : ', chưa đạt'}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* ------------------------------------------------------------ làm bài */

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

/* ----------------------------------------------------------- kết quả */

function ResultScreen({
  courseId,
  lessonId,
  data,
  result,
  answers,
  onRetry,
  onOpenExercise,
  backToLesson,
}: {
  courseId: string;
  lessonId: string;
  data: ExerciseRead;
  result: SubmissionResult;
  answers: AnswerState;
  onRetry: () => void;
  onOpenExercise: (exerciseId: string) => void;
  backToLesson: string;
}) {
  const resultByQuestion = new Map(result.results.map((r) => [r.questionId, r]));
  const correctCount = result.results.filter((r) => r.isCorrect).length;
  const lessons = useLessons(courseId);

  // Bước kế tiếp sau khi nộp: bài tập chưa đạt kế tiếp trong bài học, rồi tới bài học kế tiếp
  // khi đã xong cả bài. Loại hẳn bài tập hiện tại khỏi ứng viên: `data.exercises` có thể chưa
  // kịp làm mới sau lượt nộp này.
  const position = data.exercises.findIndex((e) => e.id === data.id);
  const nextExercise =
    data.exercises.slice(position + 1).find((e) => !e.passed) ??
    data.exercises.slice(0, Math.max(position, 0)).find((e) => !e.passed);
  const lessonList = lessons.data?.lessons ?? [];
  const lessonIndex = lessonList.findIndex((l) => l.id === lessonId);
  const nextLesson = lessonIndex >= 0 ? lessonList[lessonIndex + 1] : undefined;

  // Chỉ bắn khi qua bài, một lần mỗi lượt nộp. Tự bỏ qua nếu bật giảm chuyển động.
  useEffect(() => {
    if (result.passed) celebrateSuccess();
  }, [result.passed, result.attemptNo]);

  return (
    <section className="mx-auto max-w-2xl">
      <h1 className="sr-only">Kết quả bài tập</h1>
      {/* HANDBOOK §13.2: `celebrate` khi người dùng hoàn thành bài học. */}
      <motion.div initial="hidden" animate="show" variants={popIn}>
        <Card
          className={cn(
            'relative overflow-hidden px-6 py-10 text-center',
            result.passed ? 'border-ok-line' : 'border-warn-line',
          )}
        >
          <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:justify-center sm:gap-8 sm:text-left">
            <Mascot state={result.passed ? 'celebrate' : 'confused'} size={104} />
            <div>
              <Badge
                tone={result.passed ? 'success' : 'warning'}
                icon={result.passed ? 'check' : 'alert'}
              >
                {result.passed ? 'Đạt' : 'Chưa đạt'} · Lần {result.attemptNo}
              </Badge>
              <p className="mt-3 text-5xl font-semibold tabular-nums text-fg">
                {result.score}
                <span className="text-2xl text-fg-subtle"> / {result.maxScore} điểm</span>
              </p>
              <p className="mt-1 max-w-sm text-sm font-medium text-fg-subtle">
                {result.passed
                  ? `Bạn đã hoàn thành bài tập, đúng ${correctCount}/${data.questions.length} câu.`
                  : `Cần đạt ${data.passScore} điểm để qua bài. Xem lại các câu sai bên dưới.`}
              </p>
              {result.lessonCompleted ? (
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-fg">
                  <Icon name="book-check" size={16} />
                  Bạn đã hoàn thành cả bài học.
                </p>
              ) : (
                result.passed &&
                nextExercise && (
                  <p className="mt-2 text-sm text-fg-subtle">
                    Còn bài tập chưa đạt. Đạt hết để hoàn thành bài học.
                  </p>
                )
              )}
            </div>
            <ProgressRing
              className="hidden sm:inline-grid"
              size={88}
              stroke={8}
              tone={result.passed ? 'success' : 'sky'}
              value={result.score}
              max={Math.max(result.maxScore, 1)}
              label={`Đạt ${result.score} trên ${result.maxScore} điểm`}
            />
          </div>
        </Card>
      </motion.div>

      <h2 className="mb-3 mt-12 text-base font-semibold text-fg">Xem lại từng câu</h2>
      <ol className="space-y-4">
        {data.questions.map((q, i) => {
          const r = resultByQuestion.get(q.id);
          const isCorrect = r?.isCorrect ?? false;
          const correctId = correctOptionId(r?.correctAnswer);
          const correctText = r ? describeCorrectAnswer(q, r.correctAnswer) : null;
          const given = answers[q.id];
          const givenText = describeGivenAnswer(q, given);
          const blank = !given || ('text' in given && given.text.trim() === '');

          return (
            <li key={q.id}>
              <Card
                className={isCorrect ? 'border-ok-line' : blank ? 'border-line' : 'border-bad-line'}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold leading-relaxed text-fg">
                    Câu {i + 1}. <UserText full>{q.prompt}</UserText>
                  </p>
                  <Badge
                    tone={isCorrect ? 'success' : blank ? 'neutral' : 'danger'}
                    icon={isCorrect ? 'check' : blank ? undefined : 'x'}
                    className="shrink-0"
                  >
                    {isCorrect ? 'Đúng' : blank ? 'Bỏ trống' : 'Sai'}
                  </Badge>
                </div>

                {q.type === 'MULTIPLE_CHOICE' && (
                  <ul className="mt-4 space-y-2">
                    {q.options.map((opt) => {
                      const chosen = given?.type === 'MULTIPLE_CHOICE' && given.optionId === opt.id;
                      const isRight = correctId === opt.id;
                      return (
                        <li
                          key={opt.id}
                          className={cn(
                            'flex items-center gap-3 rounded-control border px-3 py-2.5 text-sm',
                            isRight
                              ? 'border-2 border-fg bg-ok-soft'
                              : chosen
                                ? 'border-dashed border-fg-subtle bg-bad-soft'
                                : 'border-line',
                          )}
                        >
                          <span className="grid size-7 shrink-0 place-items-center rounded-md border border-line-strong bg-panel text-xs font-semibold text-fg-muted">
                            {opt.label}
                          </span>
                          <span className="text-fg">
                            <UserText full>{opt.content}</UserText>
                          </span>
                          {isRight && (
                            <span className="ml-auto flex shrink-0 items-center gap-1 text-xs font-semibold text-ok">
                              <Icon name="check" size={13} strokeWidth={3} />
                              Đáp án đúng
                            </span>
                          )}
                          {chosen && !isRight && (
                            <span className="ml-auto flex shrink-0 items-center gap-1 text-xs font-semibold text-bad">
                              <Icon name="x" size={13} strokeWidth={3} />
                              Bạn chọn
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}

                {q.type !== 'MULTIPLE_CHOICE' && (
                  <dl className="mt-4 space-y-1.5 text-sm">
                    {givenText && (
                      <div className="flex gap-2">
                        <dt className="shrink-0 font-medium text-fg-subtle">Bạn trả lời:</dt>
                        <dd className={isCorrect ? 'text-fg' : 'text-bad'}>{givenText}</dd>
                      </div>
                    )}
                    {!isCorrect && correctText && (
                      <div className="flex gap-2">
                        <dt className="shrink-0 font-medium text-fg-subtle">Đáp án đúng:</dt>
                        <dd className="font-semibold text-ok">{correctText}</dd>
                      </div>
                    )}
                  </dl>
                )}

                {r?.explanation && (
                  <p className="mt-4 flex gap-2 rounded-control border border-accent-line bg-accent-soft px-3.5 py-2.5 text-sm leading-relaxed text-fg-muted">
                    <Icon name="info" size={16} className="mt-0.5 shrink-0 text-accent" />
                    <span>
                      <UserText full>{r.explanation}</UserText>
                    </span>
                  </p>
                )}
              </Card>
            </li>
          );
        })}
      </ol>

      <div className={STICKY_BAR}>
        <div className={cn(STICKY_PANEL, 'justify-between p-2 pl-4')}>
          <BackLink href={backToLesson} label="Về bài học" />
          <div className="flex min-w-0 items-center gap-2">
            <Button
              variant={result.passed ? 'secondary' : 'primary'}
              onClick={onRetry}
              aria-label="Làm lại"
            >
              <Icon name="retry" size={16} />
              {/* Có bước tiếp theo thì ở màn hẹp chỉ giữ icon, nhường chỗ cho nút đi tiếp. */}
              <span
                className={cn(result.passed && (nextExercise || nextLesson) && 'max-sm:sr-only')}
              >
                Làm lại
              </span>
            </Button>
            {result.passed && nextExercise && (
              <Button onClick={() => onOpenExercise(nextExercise.id)}>
                Bài tập tiếp theo
                <Icon name="arrow-right" size={16} />
              </Button>
            )}
            {result.passed && !nextExercise && result.lessonCompleted && nextLesson && (
              <ButtonLink
                href={`/courses/${courseId}/lessons/${nextLesson.id}`}
                className="min-w-0"
                aria-label={`Bài học tiếp theo: ${nextLesson.title}`}
              >
                <span className="truncate">Bài học tiếp theo</span>
                <Icon name="arrow-right" size={16} />
              </ButtonLink>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
