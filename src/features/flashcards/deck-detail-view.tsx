'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  createFlashcardSchema,
  patchDeckSchema,
  type DeckSummary,
  type Flashcard,
} from '@learn/api-contracts';
import {
  BackLink,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Icon,
  InlineError,
  Input,
  Select,
  Skeleton,
  Textarea,
  UserText,
} from '@/components/ui';
import { cn } from '@/components/ui/cn';
import { errorDetail, errorText, isNotFoundError } from '@/lib/api-client';
import { fieldErrorsFrom, focusFirstError } from '@/lib/form-errors';
import { usePageTitle } from '@/lib/use-page-title';
import { cardCountLabel, deckStats } from './deck-stats';
import {
  useCourseOptions,
  useCreateCard,
  useDecks,
  useDeck,
  useDeleteCard,
  useDeleteDeck,
  usePatchCard,
  usePatchDeck,
} from './flashcards-api';

export function DeckDetailView({ deckId }: { deckId: string }) {
  const deck = useDeck(deckId);
  usePageTitle(deck.data?.deck.title ?? 'Bộ thẻ');
  // Website hiện thao tác phụ khi rê chuột; điện thoại không có hover nên gom sau nút "Chỉnh sửa".
  const [editMode, setEditMode] = useState(false);

  if (deck.isLoading) return <Skeleton className="h-64 rounded-card" aria-busy="true" />;
  if (deck.isError) {
    return isNotFoundError(deck.error) ? (
      <>
        <BackLink href="/decks" label="Thẻ" className="mb-6" />
        <EmptyState title="Không tìm thấy bộ thẻ" />
      </>
    ) : (
      <ErrorState
        title="Không tải được bộ thẻ"
        description={errorText(deck.error, 'Vui lòng thử lại.')}
        detail={errorDetail(deck.error)}
        onRetry={() => void deck.refetch()}
      />
    );
  }

  const { deck: summary, cards } = deck.data!;
  return (
    <>
      <BackLink href="/decks" label="Thẻ" className="mb-4" />
      <DeckHeader deck={summary} />

      <div className="mt-8 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-fg-muted">{cardCountLabel(summary.cardCount)}</h2>
        {cards.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-11 md:hidden"
            aria-pressed={editMode}
            onClick={() => setEditMode((v) => !v)}
          >
            {editMode ? 'Xong' : 'Quản lý'}
          </Button>
        )}
      </div>

      <AddCardForm deckId={deckId} />

      {cards.length > 0 && (
        <ul className="mt-6 grid gap-3">
          {cards.map((card) => (
            <li key={card.id} className="min-w-0">
              <CardRow card={card} deckId={deckId} editMode={editMode} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function DeckHeader({ deck }: { deck: DeckSummary }) {
  const router = useRouter();
  const patch = usePatchDeck(deck.id);
  const remove = useDeleteDeck(deck.id);
  const courses = useCourseOptions();
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(deck.title);
  const [titleError, setTitleError] = useState<string>();
  const [confirming, setConfirming] = useState(false);

  async function rename(e: FormEvent) {
    e.preventDefault();
    const parsed = patchDeckSchema.safeParse({ title });
    if (!parsed.success) {
      setTitleError(parsed.error.issues[0]?.message);
      document.getElementById('deck-title')?.focus();
      return;
    }
    setTitleError(undefined);
    try {
      await patch.mutateAsync(parsed.data);
      setRenaming(false);
    } catch {
      /* hiện qua `patch.error` */
    }
  }

  async function confirmDelete() {
    try {
      await remove.mutateAsync();
      router.replace('/decks');
    } catch {
      /* hiện qua `remove.error` */
    }
  }

  return (
    <header>
      {renaming ? (
        <form onSubmit={rename} noValidate className="max-w-xl space-y-3">
          <Field label="Tên bộ thẻ" htmlFor="deck-title" error={titleError}>
            <Input
              id="deck-title"
              maxLength={100}
              invalid={Boolean(titleError)}
              aria-describedby={titleError ? 'deck-title-error' : undefined}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          {patch.isError && (
            <InlineError>{errorText(patch.error, 'Không đổi được tên, vui lòng thử lại.')}</InlineError>
          )}
          <div className="flex gap-2">
            <Button type="submit" size="sm" className="max-md:h-11" loading={patch.isPending}>
              Lưu
            </Button>
            <Button
              size="sm" className="max-md:h-11"
              variant="secondary"
              onClick={() => {
                setRenaming(false);
                setTitle(deck.title);
                setTitleError(undefined);
              }}
            >
              Huỷ
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <h1 className="min-w-0 truncate font-display text-[1.75rem] font-semibold leading-tight sm:text-[2rem]">
            <UserText>{deck.title}</UserText>
          </h1>
          <Button
            variant="ghost"
            size="sm" className="max-md:h-11"
            aria-label="Đổi tên bộ thẻ"
            onClick={() => {
              setTitle(deck.title);
              setRenaming(true);
            }}
          >
            <Icon name="edit" size={15} />
            Đổi tên
          </Button>
        </div>
      )}

      <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
        {deckStats(deck).map((s) => (
          <div key={s.key} className="flex items-baseline gap-2">
            <dt className="text-sm text-fg-subtle">{s.label}</dt>
            <dd className="text-lg font-semibold tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>

      <Field label="Khóa học" htmlFor="deck-course" className="mt-4 max-w-sm">
        <Select
          id="deck-course"
          value={deck.courseId ?? ''}
          disabled={patch.isPending}
          onChange={(e) => patch.mutate({ courseId: e.target.value || null })}
        >
          <option value="">Không gắn khóa học</option>
          {courses.data?.courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </Select>
      </Field>

      <div className="mt-6 border-t border-line pt-4">
        {confirming ? (
          <div role="alert" className="max-w-xl text-sm">
            <p className="font-medium">
              Xoá bộ thẻ &quot;<UserText>{deck.title}</UserText>&quot;?
            </p>
            <p className="mt-1 text-fg-subtle">
              Các thẻ và lịch ôn trong bộ sẽ mất, không khôi phục được.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm" className="max-md:h-11"
                variant="danger"
                loading={remove.isPending}
                onClick={() => void confirmDelete()}
              >
                Xác nhận xoá
              </Button>
              <Button size="sm" className="max-md:h-11" variant="secondary" onClick={() => setConfirming(false)}>
                Huỷ
              </Button>
            </div>
          </div>
        ) : (
          <Button size="sm" className="max-md:h-11" variant="ghost" onClick={() => setConfirming(true)}>
            <Icon name="trash" size={15} />
            Xoá bộ thẻ
          </Button>
        )}
        {remove.isError && (
          <InlineError className="mt-3">
            {errorText(remove.error, 'Không xoá được bộ thẻ, vui lòng thử lại.')}
          </InlineError>
        )}
      </div>
    </header>
  );
}

const CARD_FIELDS = ['front', 'back'] as const;
type CardField = (typeof CARD_FIELDS)[number];

function AddCardForm({ deckId }: { deckId: string }) {
  const create = useCreateCard(deckId);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [errors, setErrors] = useState<Partial<Record<CardField, string>>>({});

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = createFlashcardSchema.safeParse({ front, back });
    if (!parsed.success) {
      const next = fieldErrorsFrom(parsed.error, CARD_FIELDS);
      setErrors(next);
      focusFirstError(CARD_FIELDS, next);
      return;
    }
    setErrors({});
    try {
      await create.mutateAsync(parsed.data);
      setFront('');
      setBack('');
      document.getElementById('front')?.focus();
    } catch {
      /* hiện qua `create.error` */
    }
  }

  return (
    <Card className="mt-3">
      <form onSubmit={onSubmit} noValidate className="grid gap-4 md:grid-cols-2">
        <Field label="Mặt trước" htmlFor="front" error={errors.front}>
          <Textarea
            id="front"
            rows={3}
            maxLength={500}
            invalid={Boolean(errors.front)}
            aria-describedby={errors.front ? 'front-error' : undefined}
            value={front}
            onChange={(e) => setFront(e.target.value)}
          />
        </Field>
        <Field label="Mặt sau" htmlFor="back" error={errors.back}>
          <Textarea
            id="back"
            rows={3}
            maxLength={1000}
            invalid={Boolean(errors.back)}
            aria-describedby={errors.back ? 'back-error' : undefined}
            value={back}
            onChange={(e) => setBack(e.target.value)}
          />
        </Field>
        {create.isError && (
          <InlineError className="md:col-span-2">
            {errorText(create.error, 'Không thêm được thẻ, vui lòng thử lại.')}
          </InlineError>
        )}
        <div className="md:col-span-2">
          <Button type="submit" loading={create.isPending}>
            <Icon name="plus" size={16} />
            {create.isPending ? 'Đang thêm…' : 'Thêm thẻ'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function CardRow({
  card,
  deckId,
  editMode,
}: {
  card: Flashcard;
  deckId: string;
  editMode: boolean;
}) {
  const patch = usePatchCard();
  const remove = useDeleteCard();
  const decks = useDecks();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [front, setFront] = useState(card.front);
  const [back, setBack] = useState(card.back);
  const [targetDeck, setTargetDeck] = useState(deckId);
  const [errors, setErrors] = useState<Partial<Record<CardField, string>>>({});

  async function save(e: FormEvent) {
    e.preventDefault();
    const parsed = createFlashcardSchema.safeParse({ front, back });
    if (!parsed.success) {
      setErrors(fieldErrorsFrom(parsed.error, CARD_FIELDS));
      return;
    }
    setErrors({});
    try {
      await patch.mutateAsync({
        cardId: card.id,
        ...parsed.data,
        ...(targetDeck !== deckId ? { deckId: targetDeck } : {}),
      });
      setEditing(false);
    } catch {
      /* hiện qua `patch.error` */
    }
  }

  if (editing) {
    return (
      <Card>
        <form onSubmit={save} noValidate className="grid gap-4 md:grid-cols-2">
          <Field label="Mặt trước" htmlFor={`front-${card.id}`} error={errors.front}>
            <Textarea
              id={`front-${card.id}`}
              rows={3}
              maxLength={500}
              invalid={Boolean(errors.front)}
              value={front}
              onChange={(e) => setFront(e.target.value)}
            />
          </Field>
          <Field label="Mặt sau" htmlFor={`back-${card.id}`} error={errors.back}>
            <Textarea
              id={`back-${card.id}`}
              rows={3}
              maxLength={1000}
              invalid={Boolean(errors.back)}
              value={back}
              onChange={(e) => setBack(e.target.value)}
            />
          </Field>
          <Field label="Chuyển sang bộ" htmlFor={`deck-${card.id}`} className="md:col-span-2 md:max-w-sm">
            <Select
              id={`deck-${card.id}`}
              value={targetDeck}
              onChange={(e) => setTargetDeck(e.target.value)}
            >
              {decks.data?.decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </Select>
          </Field>
          {patch.isError && (
            <InlineError className="md:col-span-2">
              {errorText(patch.error, 'Không lưu được thẻ, vui lòng thử lại.')}
            </InlineError>
          )}
          <div className="flex gap-2 md:col-span-2">
            <Button type="submit" size="sm" className="max-md:h-11" loading={patch.isPending}>
              Lưu
            </Button>
            <Button size="sm" className="max-md:h-11" variant="secondary" onClick={() => setEditing(false)}>
              Huỷ
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  return (
    <Card className="group grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-start">
      <p className="line-clamp-3 min-w-0 font-medium">
        <UserText>{card.front}</UserText>
      </p>
      <p className="line-clamp-3 min-w-0 text-fg-muted">
        <UserText>{card.back}</UserText>
      </p>
      <div
        className={cn(
          'flex flex-wrap items-center gap-1',
          // Website: hiện khi rê chuột hoặc focus. Điện thoại: chỉ khi bật "Chỉnh sửa".
          editMode ? 'flex' : 'hidden md:flex md:opacity-0',
          'md:transition-opacity md:group-hover:opacity-100 md:group-focus-within:opacity-100',
        )}
      >
        {confirming ? (
          <>
            <Button
              size="sm" className="max-md:h-11"
              variant="danger"
              loading={remove.isPending}
              onClick={() => remove.mutate(card.id)}
            >
              Xác nhận xoá
            </Button>
            <Button size="sm" className="max-md:h-11" variant="secondary" onClick={() => setConfirming(false)}>
              Huỷ
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" className="max-md:h-11" variant="ghost" onClick={() => setEditing(true)}>
              <Icon name="edit" size={15} />
              Sửa
            </Button>
            <Button size="sm" className="max-md:h-11" variant="ghost" onClick={() => setConfirming(true)}>
              <Icon name="trash" size={15} />
              Xoá
            </Button>
          </>
        )}
      </div>
      {remove.isError && (
        <InlineError className="md:col-span-3">
          {errorText(remove.error, 'Không xoá được thẻ, vui lòng thử lại.')}
        </InlineError>
      )}
    </Card>
  );
}
