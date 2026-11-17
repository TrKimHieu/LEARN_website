'use client';

import type { ExerciseRead } from '@learn/api-contracts';
import { useEffect, useMemo, useRef } from 'react';
import { renderMarkdown } from '@/components/shared/markdown';
import { Button, ButtonLink, Card, Icon, ProgressBar } from '@/components/ui';
import { useQueryParam } from '@/lib/url-state';
import {
  buildSequence,
  clampStep,
  eligibleQuizIds,
  isLastItem,
  splitSteps,
  type SequenceItem,
} from './lesson-steps';
import { StepToc } from './step-toc';

type Question = ExerciseRead['questions'][number];

export function LessonStepper({
  courseId,
  lessonId,
  lessonTitle,
  contentMd,
  quizQuestions,
  onReachedEnd,
  sources,
  navExtras,
}: {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  contentMd: string;
  quizQuestions: Question[];
  /** Task 3 dùng để chấm câu hỏi nhanh. */
  exerciseId: string | null;
  onReachedEnd: () => void;
  sources: React.ReactNode;
  navExtras: React.ReactNode;
}) {
  const steps = useMemo(() => splitSteps(contentMd), [contentMd]);
  const sequence = buildSequence(steps.length, eligibleQuizIds(quizQuestions));
  // `?step` dùng replace: Back rời bài học chứ không lùi từng bước (cố ý).
  const [rawStep, setRawStep] = useQueryParam('step');
  const index = clampStep(rawStep, sequence.length);
  const item = sequence[index];
  const last = isLastItem(index, sequence.length);
  const stepMarkdown = item?.kind === 'step' ? steps[item.step]?.markdown : undefined;
  const html = useMemo(
    () => (stepMarkdown === undefined ? '' : renderMarkdown(stepMarkdown).html),
    [stepMarkdown],
  );

  const container = useRef<HTMLDivElement>(null);
  const shownIndex = useRef(index);
  useEffect(() => {
    if (shownIndex.current === index) return;
    shownIndex.current = index;
    const el = container.current;
    // Link tới khối Nguồn mang theo hash: cuộn tới đó thay vì đầu bài.
    const hash = window.location.hash.slice(1);
    const anchor = hash ? document.getElementById(hash) : null;
    (anchor ?? el?.closest('article') ?? el)?.scrollIntoView({ block: 'start' });
    el?.focus({ preventScroll: true });
  }, [index]);

  const ended = useRef(false);
  useEffect(() => {
    if (last && !ended.current) {
      ended.current = true;
      onReachedEnd();
    }
  }, [last, onReachedEnd]);

  const goTo = (next: number) => setRawStep(next > 0 ? String(next) : '');

  function renderItem(current: SequenceItem) {
    switch (current.kind) {
      case 'step':
        return (
          <div className="lesson-content max-w-[72ch]" dangerouslySetInnerHTML={{ __html: html }} />
        );
      case 'quiz':
        return (
          <Card className="max-w-[72ch] space-y-4">
            <p className="font-display text-lg font-semibold text-fg">Câu hỏi nhanh</p>
            <Button variant="secondary" onClick={() => goTo(index + 1)}>
              Bỏ qua
            </Button>
          </Card>
        );
    }
  }

  return (
    <div className="mt-8 gap-10 xl:grid xl:grid-cols-[minmax(0,1fr)_15rem]">
      <div className="min-w-0">
        <div className="max-w-[72ch]">
          <p className="mb-2 text-xs font-medium text-fg-subtle">
            Bước {index + 1} trên {sequence.length}
          </p>
          <ProgressBar
            value={index + 1}
            max={sequence.length}
            label={`Bước ${index + 1} trên ${sequence.length}`}
            size="xs"
          />
        </div>

        <div ref={container} tabIndex={-1} className="mt-8 outline-none">
          {item && renderItem(item)}
        </div>

        {last && sources}

        {/* --------------------------------- thanh hành động dính đáy */}
        <div className="sticky bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] z-10 mt-12 lg:bottom-4">
          <div className="flex items-center gap-2 rounded-card border border-line bg-panel p-2 shadow-overlay">
            {index > 0 && (
              <Button variant="ghost" size="sm" onClick={() => goTo(index - 1)}>
                <Icon name="arrow-left" size={16} />
                Quay lại
              </Button>
            )}
            <div className="flex min-w-0 flex-1 items-center gap-2">{navExtras}</div>
            <div className="flex shrink-0 items-center">
              {last ? (
                <ButtonLink href={`/courses/${courseId}/lessons/${lessonId}/practice`}>
                  <Icon name="target" size={17} />
                  Luyện tập ngay
                </ButtonLink>
              ) : (
                <Button onClick={() => goTo(index + 1)}>
                  Tiếp
                  <Icon name="arrow-right" size={16} />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {steps.length > 1 && (
        <StepToc
          steps={steps}
          sequence={sequence}
          current={index}
          lessonTitle={lessonTitle}
          onSelect={goTo}
        />
      )}
    </div>
  );
}
