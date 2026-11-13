"use client";

import { useEffect, useState } from "react";
import {
  BackLink,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  ErrorState,
  InlineError,
  ProgressBar,
  Skeleton,
  UserText,
} from "@/components/ui";
import { absoluteTime } from "@/lib/format";
import { errorDetail, errorText } from "@/lib/api-client";
import { usePageTitle } from "@/lib/use-page-title";
import { useDueCards, useSubmitReview } from "./flashcards-api";
import {
  GRADES,
  choose,
  confirmPending,
  currentCard,
  isFinished,
  progressLabel,
  reveal,
  startSession,
  type Grade,
  type PendingGrade,
  type SessionState,
} from "./review-session";

export function ReviewView({ deckId }: { deckId: string }) {
  usePageTitle("Ôn tập");
  const due = useDueCards(deckId);
  const submit = useSubmitReview();
  const [session, setSession] = useState<SessionState | null>(null);

  // Chụp danh sách thẻ một lần khi dữ liệu về (hoặc sau "Ôn tiếp"); từ đó phiên tự đi.
  useEffect(() => {
    if (due.data && session === null) setSession(startSession(due.data.cards));
  }, [due.data, session]);

  const back = (
    <BackLink href={`/decks/${deckId}`} label="Bộ thẻ" className="mb-6" />
  );

  if (due.isError) {
    return (
      <>
        {back}
        <ErrorState
          title="Không tải được thẻ cần ôn"
          description={errorText(due.error, "Vui lòng thử lại.")}
          detail={errorDetail(due.error)}
          onRetry={() => void due.refetch()}
        />
      </>
    );
  }
  if (due.isLoading || !due.data || !session) {
    return (
      <>
        {back}
        <Skeleton className="h-64 rounded-card" aria-busy="true" />
      </>
    );
  }

  const data = due.data;

  if (data.cards.length === 0) {
    return (
      <>
        {back}
        <EmptyState
          title="Chưa có thẻ đến hạn"
          description={
            data.nextDueAt
              ? `Thẻ kế tiếp đến hạn lúc ${absoluteTime(data.nextDueAt)}.`
              : undefined
          }
          action={{ label: "Về bộ thẻ", onClick: () => history.back() }}
        />
      </>
    );
  }

  if (isFinished(session)) {
    const remaining = Math.max(0, data.dueCount - session.reviewed);
    return (
      <>
        {back}
        <Card className="max-w-xl">
          <h1 className="font-display text-2xl font-semibold">
            Xong {session.reviewed} thẻ
          </h1>
          {remaining > 0 && (
            <p className="mt-2 text-fg-muted">Còn {remaining} thẻ đến hạn.</p>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            {remaining > 0 && (
              <Button
                onClick={() => {
                  setSession(null);
                  void due.refetch();
                }}
              >
                Ôn tiếp
              </Button>
            )}
            <ButtonLink href={`/decks/${deckId}`} variant="secondary">
              Về bộ thẻ
            </ButtonLink>
          </div>
        </Card>
      </>
    );
  }

  const card = currentCard(session)!;

  function send(pending: PendingGrade) {
    submit.mutate(
      {
        cardId: pending.cardId,
        grade: pending.grade,
        reviewedAt: pending.reviewedAt,
        key: pending.key,
      },
      { onSuccess: () => setSession((s) => (s ? confirmPending(s) : s)) },
    );
  }

  function onGrade(grade: Grade) {
    const next = choose(session!, grade, new Date(), () => crypto.randomUUID());
    setSession(next);
    if (next.pending && next.pending !== session!.pending) send(next.pending);
  }

  return (
    <>
      {back}
      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm font-semibold tabular-nums text-fg-muted">
          {progressLabel(session)}
        </span>
        <ProgressBar
          size="xs"
          value={session.index}
          max={session.cards.length}
          label={`Đã ôn ${session.index} trên ${session.cards.length} thẻ`}
          className="flex-1"
        />
      </div>

      <Card className="mx-auto flex max-w-2xl flex-col gap-6">
        <p className="min-h-24 whitespace-pre-wrap text-xl font-medium leading-relaxed">
          <UserText full>{card.front}</UserText>
        </p>

        {session.revealed ? (
          <>
            <p className="whitespace-pre-wrap border-t border-line pt-5 text-lg leading-relaxed text-fg-muted">
              <UserText full>{card.back}</UserText>
            </p>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {GRADES.map(({ grade, label }) => (
                <Button
                  key={grade}
                  variant={
                    session.pending?.grade === grade ? "primary" : "secondary"
                  }
                  className="h-11"
                  disabled={
                    session.pending !== null && session.pending.grade !== grade
                  }
                  loading={submit.isPending && session.pending?.grade === grade}
                  onClick={() => onGrade(grade)}
                >
                  {label}
                </Button>
              ))}
            </div>
            {submit.isError && session.pending && (
              <div className="flex flex-wrap items-center gap-3">
                <InlineError className="flex-1">
                  {errorText(
                    submit.error,
                    "Chưa gửi được Mức nhớ, vui lòng thử lại.",
                  )}
                </InlineError>
                <Button
                  variant="secondary"
                  onClick={() => send(session.pending!)}
                >
                  Thử lại
                </Button>
              </div>
            )}
          </>
        ) : (
          <Button
            className="h-11 self-start"
            onClick={() => setSession((s) => (s ? reveal(s) : s))}
          >
            Lật thẻ
          </Button>
        )}
      </Card>
    </>
  );
}
