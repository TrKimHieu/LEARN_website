export interface LessonStep {
  title: string | null;
  markdown: string;
}

export type SequenceItem = { kind: 'step'; step: number } | { kind: 'quiz'; questionId: string };

const QUIZ_EVERY = 2;
const QUIZ_TYPES = new Set(['MULTIPLE_CHOICE', 'TRUE_FALSE']);

/** Splits on level-2 headings outside code fences; intro text joins the first step. */
export function splitSteps(contentMd: string): LessonStep[] {
  const steps: LessonStep[] = [];
  let intro: string[] = [];
  let current: { title: string; lines: string[] } | null = null;
  let fence: string | null = null;

  for (const line of contentMd.split('\n')) {
    // shortcut: fence closers with info strings, fence length and 4+ space indent are ignored, upgrade if lessons need them
    const marker = /^\s*(```|~~~)/.exec(line)?.[1];
    if (marker) {
      if (fence === null) fence = marker;
      else if (fence === marker) fence = null;
    }
    const heading = fence === null && marker === undefined ? /^##\s+(.+?)\s*$/.exec(line) : null;
    if (heading) {
      if (current) steps.push({ title: current.title, markdown: current.lines.join('\n') });
      current = { title: heading[1] ?? '', lines: [...intro, line] };
      intro = [];
    } else if (current) {
      current.lines.push(line);
    } else {
      intro.push(line);
    }
  }

  if (current) steps.push({ title: current.title, markdown: current.lines.join('\n') });
  return steps.length > 0 ? steps : [{ title: null, markdown: contentMd }];
}

export function buildSequence(stepCount: number, quizIds: string[]): SequenceItem[] {
  const items: SequenceItem[] = [];
  let next = 0;
  for (let i = 0; i < stepCount; i += 1) {
    items.push({ kind: 'step', step: i });
    if ((i + 1) % QUIZ_EVERY === 0 && i < stepCount - 1 && next < quizIds.length) {
      items.push({ kind: 'quiz', questionId: quizIds[next] ?? '' });
      next += 1;
    }
  }
  return items;
}

export function eligibleQuizIds(questions: Array<{ id: string; type: string }>): string[] {
  return questions.filter((q) => QUIZ_TYPES.has(q.type)).map((q) => q.id);
}

export function clampStep(raw: string, length: number): number {
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n) || n < 0) return 0;
  return Math.max(0, Math.min(n, length - 1));
}

export function isLastItem(index: number, length: number): boolean {
  return index >= length - 1;
}
