'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { generateFlashcardsSchema } from '@learn/api-contracts';
import {
  BackLink,
  Button,
  ButtonLink,
  Card,
  Field,
  InlineError,
  Input,
  PageHeader,
  ProgressBar,
  Select,
  UserText,
} from '@/components/ui';
import { errorText, isQuotaExceededError } from '@/lib/api-client';
import { usePageTitle } from '@/lib/use-page-title';
import { generationErrorText, generationState } from './drafts-logic';
import {
  useCancelFlashcardJob,
  useCourseDocuments,
  useCourseLessons,
  useCourseOptions,
  useFlashcardJob,
  useGenerateFlashcards,
} from './flashcards-api';

type SourceKind = 'lesson' | 'document';

/** Chọn bài học hoặc tài liệu rồi nhờ AI sinh Thẻ nháp; theo dõi tiến độ tại chỗ, xong thì sang màn duyệt. */
export function GenerateView() {
  usePageTitle('Sinh thẻ bằng AI');
  const courses = useCourseOptions();
  const [courseId, setCourseId] = useState('');
  const [kind, setKind] = useState<SourceKind>('lesson');
  const [sourceId, setSourceId] = useState('');
  const [count, setCount] = useState('10');
  const [error, setError] = useState<string>();
  const [jobId, setJobId] = useState<string | null>(null);

  const lessons = useCourseLessons(courseId);
  const documents = useCourseDocuments(courseId);
  const generate = useGenerateFlashcards(courseId);
  const job = useFlashcardJob(jobId);
  const cancel = useCancelFlashcardJob(jobId);
  const state = generationState(job.data);

  const sources =
    kind === 'lesson'
      ? (lessons.data?.lessons ?? []).map((l) => ({ id: l.id, label: l.title }))
      : (documents.data?.documents ?? [])
          .filter((d) => d.status === 'EXTRACTED')
          .map((d) => ({ id: d.id, label: d.filename }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    if (!courseId || !sourceId) {
      setError('Chọn khóa học và nguồn để sinh thẻ.');
      return;
    }
    const parsed = generateFlashcardsSchema.safeParse({
      [kind === 'lesson' ? 'lessonId' : 'documentId']: sourceId,
      count: Number(count),
    });
    if (!parsed.success) {
      setError('Số thẻ phải từ 1 đến 30.');
      document.getElementById('count')?.focus();
      return;
    }
    try {
      const created = await generate.mutateAsync(parsed.data);
      setJobId(created.id);
    } catch {
      /* lỗi hiện qua \`generate.error\` */
    }
  }

  const running = state === 'running';

  return (
    <>
      <BackLink href="/decks" label="Thẻ" className="mb-4" />
      <PageHeader title="Sinh thẻ bằng AI" />

      <Card className="max-w-xl">
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <Field label="Khóa học" htmlFor="course">
            <Select
              id="course"
              value={courseId}
              disabled={running}
              onChange={(e) => {
                setCourseId(e.target.value);
                setSourceId('');
              }}
            >
              <option value="">Chọn khóa học</option>
              {courses.data?.courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Nguồn" htmlFor="kind">
            <Select
              id="kind"
              value={kind}
              disabled={running}
              onChange={(e) => {
                setKind(e.target.value as SourceKind);
                setSourceId('');
              }}
            >
              <option value="lesson">Một bài học</option>
              <option value="document">Một tài liệu</option>
            </Select>
          </Field>

          <Field label={kind === 'lesson' ? 'Bài học' : 'Tài liệu'} htmlFor="source">
            <Select
              id="source"
              value={sourceId}
              disabled={running || !courseId}
              onChange={(e) => setSourceId(e.target.value)}
            >
              <option value="">{kind === 'lesson' ? 'Chọn bài học' : 'Chọn tài liệu'}</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Số thẻ tối đa" htmlFor="count">
            <Input
              id="count"
              type="number"
              inputMode="numeric"
              min={1}
              max={30}
              disabled={running}
              value={count}
              onChange={(e) => setCount(e.target.value)}
            />
          </Field>

          {error && <InlineError>{error}</InlineError>}
          {generate.isError && (
            <InlineError>
              {isQuotaExceededError(generate.error)
                ? 'Đã hết lượt AI trong tháng của gói hiện tại.'
                : errorText(generate.error, 'Không bắt đầu được, vui lòng thử lại.')}
            </InlineError>
          )}

          <Button
            type="submit"
            className="max-md:h-11"
            loading={generate.isPending}
            disabled={running}
          >
            Sinh thẻ
          </Button>
        </form>
      </Card>

      {jobId && (
        <Card className="mt-4 max-w-xl" aria-live="polite">
          {running && (
            <div className="space-y-3">
              <p className="text-sm font-medium">
                <UserText>{job.data?.progressLabel ?? 'Đang xếp hàng'}</UserText>
              </p>
              <ProgressBar
                size="xs"
                value={job.data?.progress ?? 0}
                max={100}
                label="Tiến độ sinh thẻ"
              />
              <Button
                variant="secondary"
                className="max-md:h-11"
                loading={cancel.isPending}
                onClick={() => cancel.mutate()}
              >
                Huỷ
              </Button>
            </div>
          )}
          {state === 'done' && (
            <div className="space-y-3">
              <p className="font-medium">Đã sinh xong thẻ nháp.</p>
              <ButtonLink href={`/decks/drafts?job=${jobId}`} className="max-md:h-11">
                Xem thẻ nháp
              </ButtonLink>
            </div>
          )}
          {state === 'failed' && (
            <div className="space-y-3">
              <InlineError>{generationErrorText(job.data?.error)}</InlineError>
              <Button variant="secondary" className="max-md:h-11" onClick={() => setJobId(null)}>
                Thử lại
              </Button>
            </div>
          )}
          {state === 'cancelled' && (
            <div className="space-y-3">
              <p className="font-medium">Đã huỷ.</p>
              <Button variant="secondary" className="max-md:h-11" onClick={() => setJobId(null)}>
                Sinh lại
              </Button>
            </div>
          )}
          {job.isError && (
            <InlineError>{errorText(job.error, 'Không theo dõi được tiến độ.')}</InlineError>
          )}
        </Card>
      )}
    </>
  );
}
