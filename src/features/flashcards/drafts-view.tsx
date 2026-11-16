'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { acceptFlashcardDraftsSchema, createFlashcardSchema } from '@learn/api-contracts';
import type { FlashcardDraft } from '@learn/api-contracts';
import {
  BackLink,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  ErrorState,
  Field,
  InlineError,
  Input,
  PageHeader,
  Select,
  Skeleton,
  Textarea,
  UserText,
} from '@/components/ui';
import { errorDetail, errorText } from '@/lib/api-client';
import { usePageTitle } from '@/lib/use-page-title';
import { acceptLabel, selectAll, toggle, withoutIds } from './drafts-logic';
import {
  useAcceptDrafts,
  useDecks,
  useDeleteDraft,
  useDrafts,
  usePatchDraft,
} from './flashcards-api';

export function DraftsView() {
  return (
    <Suspense fallback={null}>
      <Drafts />
    </Suspense>
  );
}

/** Duyệt Thẻ nháp do AI sinh: sửa, bỏ bớt, rồi chấp nhận vào một bộ. Nháp chưa có lịch ôn cho đến khi chấp nhận. */
function Drafts() {
  usePageTitle('Thẻ nháp');
  const router = useRouter();
  const jobId = useSearchParams().get('job') ?? undefined;
  const drafts = useDrafts(jobId);
  const decks = useDecks();
  const accept = useAcceptDrafts();

  const list = drafts.data?.drafts ?? [];
  // null = chưa chạm vào vùng chọn: tất cả đang được chọn.
  const [picked, setPicked] = useState<Set<string> | null>(null);
  const selected = picked ?? selectAll(list.map((d) => d.id));
  const chosen = list.filter((d) => selected.has(d.id));

  const [target, setTarget] = useState('new');
  const [newTitle, setNewTitle] = useState('Thẻ AI');
  const [titleError, setTitleError] = useState<string>();

  async function onAccept() {
    setTitleError(undefined);
    const parsed = acceptFlashcardDraftsSchema.safeParse({
      draftIds: chosen.map((d) => d.id),
      ...(target === 'new' ? { newDeckTitle: newTitle } : { deckId: target }),
    });
    if (!parsed.success) {
      setTitleError(parsed.error.issues[0]?.message);
      return;
    }
    try {
      const result = await accept.mutateAsync(parsed.data);
      router.push(`/decks/${result.deckId}`);
    } catch {
      /* hiện qua \`accept.error\` */
    }
  }

  const back = <BackLink href="/decks" label="Thẻ" className="mb-4" />;

  if (drafts.isError) {
    return (
      <>
        {back}
        <ErrorState
          title="Không tải được thẻ nháp"
          description={errorText(drafts.error, 'Vui lòng thử lại.')}
          detail={errorDetail(drafts.error)}
          onRetry={() => void drafts.refetch()}
        />
      </>
    );
  }
  if (drafts.isLoading) {
    return (
      <>
        {back}
        <Skeleton className="h-48 rounded-card" aria-busy="true" />
      </>
    );
  }
  if (list.length === 0) {
    return (
      <>
        {back}
        <PageHeader title="Thẻ nháp" />
        <EmptyState title="Không có thẻ nháp nào" />
        <div className="mt-4">
          <ButtonLink href="/decks/generate" variant="secondary" className="max-md:h-11">
            Sinh thẻ bằng AI
          </ButtonLink>
        </div>
      </>
    );
  }

  return (
    <>
      {back}
      <PageHeader title="Thẻ nháp" />

      <ul className="grid gap-3">
        {list.map((draft) => (
          <li key={draft.id} className="min-w-0">
            <DraftRow
              draft={draft}
              checked={selected.has(draft.id)}
              onToggle={() => setPicked(toggle(selected, draft.id))}
              onRemoved={() => setPicked(withoutIds(selected, [draft.id]))}
            />
          </li>
        ))}
      </ul>

      <Card className="mt-6 max-w-xl">
        <div className="space-y-4">
          <Field label="Thêm vào" htmlFor="target">
            <Select id="target" value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="new">Bộ thẻ mới</option>
              {decks.data?.decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </Select>
          </Field>
          {target === 'new' && (
            <Field label="Tên bộ thẻ mới" htmlFor="new-title" error={titleError}>
              <Input
                id="new-title"
                maxLength={100}
                invalid={Boolean(titleError)}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </Field>
          )}
          {accept.isError && (
            <InlineError>
              {errorText(accept.error, 'Không thêm được thẻ, vui lòng thử lại.')}
            </InlineError>
          )}
          <Button
            className="max-md:h-11"
            loading={accept.isPending}
            disabled={chosen.length === 0}
            onClick={() => void onAccept()}
          >
            {acceptLabel(chosen.length)}
          </Button>
        </div>
      </Card>
    </>
  );
}

function DraftRow({
  draft,
  checked,
  onToggle,
  onRemoved,
}: {
  draft: FlashcardDraft;
  checked: boolean;
  onToggle: () => void;
  onRemoved: () => void;
}) {
  const patch = usePatchDraft();
  const remove = useDeleteDraft();
  const [editing, setEditing] = useState(false);
  const [front, setFront] = useState(draft.front);
  const [back, setBack] = useState(draft.back);
  const [error, setError] = useState<string>();

  async function save() {
    const parsed = createFlashcardSchema.safeParse({ front, back });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }
    setError(undefined);
    try {
      await patch.mutateAsync({ id: draft.id, ...parsed.data });
      setEditing(false);
    } catch {
      /* hiện qua \`patch.error\` */
    }
  }

  if (editing) {
    return (
      <Card className="grid gap-4 md:grid-cols-2">
        <Field label="Mặt trước" htmlFor={`df-${draft.id}`}>
          <Textarea
            id={`df-${draft.id}`}
            rows={3}
            maxLength={500}
            value={front}
            onChange={(e) => setFront(e.target.value)}
          />
        </Field>
        <Field label="Mặt sau" htmlFor={`db-${draft.id}`}>
          <Textarea
            id={`db-${draft.id}`}
            rows={3}
            maxLength={1000}
            value={back}
            onChange={(e) => setBack(e.target.value)}
          />
        </Field>
        {(error || patch.isError) && (
          <InlineError className="md:col-span-2">
            {error ?? errorText(patch.error, 'Không lưu được thẻ, vui lòng thử lại.')}
          </InlineError>
        )}
        <div className="flex gap-2 md:col-span-2">
          <Button className="max-md:h-11" loading={patch.isPending} onClick={() => void save()}>
            Lưu
          </Button>
          <Button variant="secondary" className="max-md:h-11" onClick={() => setEditing(false)}>
            Huỷ
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="grid items-start gap-3 md:grid-cols-[auto_1fr_1fr_auto]">
      {/* Vùng chạm 44px trên điện thoại; ô vuông vẫn nhỏ cho gọn. */}
      <label className="-m-3 flex size-11 cursor-pointer items-center justify-center md:m-0 md:size-auto md:pt-1">
        <input
          type="checkbox"
          className="size-5 accent-[var(--brand)]"
          checked={checked}
          onChange={onToggle}
          aria-label={`Chọn thẻ nháp: ${draft.front}`}
        />
      </label>
      <p className="line-clamp-3 min-w-0 font-medium">
        <UserText>{draft.front}</UserText>
      </p>
      <p className="line-clamp-3 min-w-0 text-fg-muted">
        <UserText>{draft.back}</UserText>
      </p>
      <div className="flex flex-wrap items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          className="max-md:h-11"
          onClick={() => {
            setFront(draft.front);
            setBack(draft.back);
            setEditing(true);
          }}
        >
          Sửa
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="max-md:h-11"
          loading={remove.isPending}
          onClick={() => remove.mutate(draft.id, { onSuccess: onRemoved })}
        >
          Bỏ
        </Button>
      </div>
      {remove.isError && (
        <InlineError className="md:col-span-4">
          {errorText(remove.error, 'Không bỏ được thẻ nháp, vui lòng thử lại.')}
        </InlineError>
      )}
    </Card>
  );
}
