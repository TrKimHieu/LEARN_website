'use client';

import { UserText } from '@/components/ui/user-text';
import { cn } from '@/components/ui';
import type { LessonStep, SequenceItem } from './lesson-steps';

/** Mục lục chỉ cho Website: mỗi bước một mục, bấm thì nhảy tới bước đó. */
export function StepToc({
  steps,
  sequence,
  current,
  lessonTitle,
  onSelect,
}: {
  steps: LessonStep[];
  sequence: SequenceItem[];
  current: number;
  lessonTitle: string;
  onSelect: (index: number) => void;
}) {
  return (
    <nav className="hidden xl:block" aria-label="Mục lục">
      <div className="sticky top-24">
        <p className="mb-3 text-xs font-medium text-fg-subtle">Trong bài này</p>
        <ul className="space-y-0.5 border-l border-line text-sm">
          {steps.map((step, stepIndex) => {
            const index = sequence.findIndex((s) => s.kind === 'step' && s.step === stepIndex);
            const active = index === current;
            return (
              <li key={stepIndex}>
                <button
                  type="button"
                  onClick={() => onSelect(index)}
                  aria-current={active ? 'step' : undefined}
                  className={cn(
                    '-ml-px line-clamp-2 w-full border-l-2 py-1.5 pl-3 pr-2 text-left leading-snug transition-colors duration-200 focus-ring-tight',
                    active
                      ? 'border-fg font-semibold text-fg'
                      : 'border-transparent text-fg-subtle hover:border-line-strong hover:text-fg',
                  )}
                >
                  <UserText>{step.title ?? lessonTitle}</UserText>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
