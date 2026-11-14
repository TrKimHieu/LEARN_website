'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { createDeckSchema, type DeckSummary } from '@learn/api-contracts';
import {
  Button,
  ButtonLink,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Icon,
  InlineError,
  Input,
  PageHeader,
  Select,
  Skeleton,
  UserText,
} from '@/components/ui';
import { errorDetail, errorText } from '@/lib/api-client';
import { fieldErrorsFrom, focusFirstError } from '@/lib/form-errors';
import { usePageTitle } from '@/lib/use-page-title';
import { cardCountLabel, deckStats } from './deck-stats';
import { useCourseOptions, useCreateDeck, useDecks, useDueCount } from './flashcards-api';

export function DecksView() {
  usePageTitle('Thẻ');
  const { data, isLoading, isError, error, refetch, isRefetching } = useDecks();
  const [creating, setCreating] = useState(false);
  const { data: dueCount } = useDueCount();

  return (
    <>
      <PageHeader
        title="Thẻ"
        action={
          !creating && (
            <>
              {dueCount ? (
                <ButtonLink href="/review" variant="secondary" className="max-md:h-11">
                  <Icon name="play" size={16} />
                  Ôn hôm nay ({dueCount})
                </ButtonLink>
              ) : null}
              <Button onClick={() => setCreating(true)}>
                <Icon name="plus" size={16} />
                Tạo bộ thẻ
              </Button>
            </>
          )
        }
      />

      {creating && <CreateDeckForm onDone={() => setCreating(false)} />}

      {isLoading && (
        <ul
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          aria-busy="true"
          aria-label="Đang tải bộ thẻ"
        >
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Skeleton className="h-36 rounded-card" />
            </li>
          ))}
        </ul>
      )}

      {isError && (
        <ErrorState
          title="Không tải được danh sách bộ thẻ"
          description={errorText(error, 'Vui lòng thử lại.')}
          detail={errorDetail(error)}
          onRetry={() => {
            if (!isRefetching) void refetch();
          }}
        />
      )}

      {data && data.decks.length === 0 && !creating && (
        <EmptyState
          title="Chưa có bộ thẻ nào"
          action={{ label: 'Tạo bộ thẻ', onClick: () => setCreating(true) }}
        />
      )}

      {data && data.decks.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.decks.map((deck) => (
            <li key={deck.id} className="min-w-0">
              <DeckCard deck={deck} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function DeckCard({ deck }: { deck: DeckSummary }) {
  return (
    <Card interactive className="group relative flex h-full flex-col gap-4">
      <div className="min-w-0">
        <h2 className="font-display text-lg font-semibold leading-snug">
          <Link
            href={`/decks/${deck.id}`}
            className="block truncate rounded-sm outline-none after:absolute after:inset-0 after:rounded-[inherit] focus-visible:after:outline-2 focus-visible:after:outline-offset-2"
          >
            <UserText>{deck.title}</UserText>
          </Link>
        </h2>
        <p className="mt-1 text-sm text-fg-subtle">{cardCountLabel(deck.cardCount)}</p>
      </div>
      <dl className="mt-auto grid grid-cols-3 gap-2">
        {deckStats(deck).map((s) => (
          <div key={s.key} className="min-w-0">
            <dt className="truncate text-xs text-fg-subtle">{s.label}</dt>
            <dd className="text-lg font-semibold tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

const FIELDS = ['title'] as const;

function CreateDeckForm({ onDone }: { onDone: () => void }) {
  const create = useCreateDeck();
  const courses = useCourseOptions();
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [fieldError, setFieldError] = useState<Partial<Record<(typeof FIELDS)[number], string>>>(
    {},
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFieldError({});
    const parsed = createDeckSchema.safeParse({ title, courseId: courseId || null });
    if (!parsed.success) {
      const errors = fieldErrorsFrom(parsed.error, FIELDS);
      setFieldError(errors);
      focusFirstError(FIELDS, errors);
      return;
    }
    try {
      await create.mutateAsync(parsed.data);
      onDone();
    } catch {
      /* lỗi hiện qua `create.error` bên dưới */
    }
  }

  return (
    <Card className="mb-6 max-w-xl">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field label="Tên bộ thẻ" htmlFor="title" error={fieldError.title}>
          <Input
            id="title"
            maxLength={100}
            invalid={Boolean(fieldError.title)}
            aria-describedby={fieldError.title ? 'title-error' : undefined}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>
        <Field label="Khóa học" htmlFor="courseId">
          <Select id="courseId" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            <option value="">Không gắn khóa học</option>
            {courses.data?.courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </Select>
        </Field>
        {create.isError && (
          <InlineError>{errorText(create.error, 'Không tạo được bộ thẻ, vui lòng thử lại.')}</InlineError>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" loading={create.isPending}>
            {create.isPending ? 'Đang tạo…' : 'Tạo bộ thẻ'}
          </Button>
          <Button variant="secondary" onClick={onDone}>
            Huỷ
          </Button>
        </div>
      </form>
    </Card>
  );
}
