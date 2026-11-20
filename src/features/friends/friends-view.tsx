'use client';

import { useState } from 'react';
import type { Friend, FriendRequest, Leaderboard } from '@learn/api-contracts';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Icon,
  IconButton,
  InlineError,
  Input,
  LoadingState,
  PageHeader,
  SectionTitle,
  Skeleton,
  UserText,
  cn,
} from '@/components/ui';
import { errorDetail, errorText } from '@/lib/api-client';
import {
  isFriendsUnavailable,
  useAcceptRequest,
  useDropRequest,
  useFriends,
  useInviteFriend,
  useLeaderboard,
  useRemoveFriend,
  useRotateCode,
} from './friends-api';
import { parseInvite } from './invite';

export function FriendsView() {
  const friends = useFriends();
  const board = useLeaderboard();
  const header = <PageHeader title="Bạn học" backLink={{ href: '/dashboard', label: 'Học' }} />;

  if (isFriendsUnavailable(friends.error)) {
    return (
      <div>
        {header}
        <EmptyState title="Chưa dùng được bạn học" description="Máy chủ hiện tại chưa bật tính năng này." />
      </div>
    );
  }
  if (friends.isError) {
    return (
      <div>
        {header}
        <ErrorState
          title="Không tải được bạn học"
          description={errorText(friends.error, 'Vui lòng thử lại.')}
          detail={errorDetail(friends.error)}
          onRetry={() => void friends.refetch()}
        />
      </div>
    );
  }
  if (!friends.data) {
    return (
      <div>
        {header}
        <LoadingState rows={3} label="Đang tải bạn học" />
      </div>
    );
  }

  const data = friends.data;
  return (
    <div>
      {header}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="space-y-6">
          <InviteCard myCode={data.myCode} />
          {data.incoming.length > 0 && (
            <section aria-labelledby="incoming-title">
              <SectionTitle id="incoming-title">Lời mời kết bạn</SectionTitle>
              <RequestList requests={data.incoming} incoming />
            </section>
          )}
          {data.outgoing.length > 0 && (
            <section aria-labelledby="outgoing-title">
              <SectionTitle id="outgoing-title">Đã gửi lời mời</SectionTitle>
              <RequestList requests={data.outgoing} incoming={false} />
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section aria-labelledby="board-title">
            <SectionTitle id="board-title">Xếp hạng tuần này</SectionTitle>
            <p className="-mt-2 mb-3 text-sm text-fg-subtle">XP từ thứ Hai. Trần 100 XP mỗi ngày.</p>
            {data.leaderboardHidden && (
              <p className="mb-3 flex items-center gap-2 text-sm text-fg-muted">
                <Icon name="eye-off" size={15} />
                Bạn đang ẩn khỏi bảng của bạn bè. Đổi trong Cài đặt.
              </p>
            )}
            {board.isLoading && <Skeleton className="h-48 rounded-card" />}
            {board.isError && (
              <ErrorState
                title="Không tải được bảng xếp hạng"
                description={errorText(board.error, 'Vui lòng thử lại.')}
                onRetry={() => void board.refetch()}
              />
            )}
            {board.data && <BoardTable board={board.data} />}
          </section>

          {data.friends.length > 0 && (
            <section aria-labelledby="friends-title">
              <SectionTitle id="friends-title">Bạn bè ({data.friends.length})</SectionTitle>
              <FriendList friends={data.friends} />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function InviteCard({ myCode }: { myCode: string }) {
  const invite = useInviteFriend();
  const rotate = useRotateCode();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string>();
  const [copied, setCopied] = useState(false);
  const [confirmRotate, setConfirmRotate] = useState(false);

  function send(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseInvite(value);
    if ('error' in parsed) return setError(parsed.error);
    setError(undefined);
    invite.mutate(parsed.input, { onSuccess: () => setValue('') });
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(myCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Trình duyệt chặn clipboard: mã vẫn chọn và chép tay được.
    }
  }

  return (
    <Card>
      <p className="text-sm text-fg-subtle">Mã mời của bạn</p>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <p className="font-mono text-2xl font-semibold tracking-[0.25em] text-fg select-all">{myCode}</p>
        <Button variant="secondary" size="sm" onClick={() => void copy()}>
          <Icon name={copied ? 'check' : 'file'} size={15} />
          {copied ? 'Đã chép' : 'Chép mã'}
        </Button>
        {!confirmRotate ? (
          <Button variant="ghost" size="sm" onClick={() => setConfirmRotate(true)}>
            Đổi mã
          </Button>
        ) : (
          <span className="flex items-center gap-2 text-sm">
            <span className="font-medium text-fg">Mã cũ sẽ hết dùng được.</span>
            <Button
              size="sm"
              variant="danger"
              loading={rotate.isPending}
              onClick={() => rotate.mutate(undefined, { onSettled: () => setConfirmRotate(false) })}
            >
              Đổi mã
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmRotate(false)}>
              Giữ mã
            </Button>
          </span>
        )}
      </div>

      <form onSubmit={send} className="mt-5 border-t border-line pt-5" noValidate>
        <Field
          label="Thêm bạn"
          htmlFor="invite"
          error={error ?? (invite.isError ? errorText(invite.error, 'Không gửi được lời mời.') : undefined)}
        >
          <div className="flex gap-2">
            <Input
              id="invite"
              placeholder="Mã mời hoặc email"
              autoComplete="off"
              spellCheck={false}
              value={value}
              invalid={Boolean(error) || invite.isError}
              onChange={(e) => {
                setValue(e.target.value);
                setError(undefined);
                invite.reset();
              }}
              className="flex-1"
            />
            <Button type="submit" loading={invite.isPending} disabled={!value.trim()}>
              Gửi lời mời
            </Button>
          </div>
        </Field>
        {invite.data && (
          <p role="status" className="mt-3 flex items-center gap-2 text-sm text-fg-muted">
            <Icon name="check" size={15} className="text-ok" />
            {invite.data.message}
          </p>
        )}
      </form>
    </Card>
  );
}

function RequestList({ requests, incoming }: { requests: FriendRequest[]; incoming: boolean }) {
  const accept = useAcceptRequest();
  const drop = useDropRequest();
  const busy = accept.isPending || drop.isPending;
  const failed = accept.error ?? drop.error;
  return (
    <>
      <Card padded={false}>
        <ul className="divide-y divide-line">
          {requests.map((r) => (
            <li key={r.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">
                <UserText>{r.displayName}</UserText>
              </span>
              {incoming && (
                <Button
                  size="sm"
                  disabled={busy}
                  aria-label={`Chấp nhận lời mời của ${r.displayName}`}
                  onClick={() => accept.mutate(r.id)}
                >
                  Chấp nhận
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                aria-label={`${incoming ? 'Từ chối lời mời của' : 'Huỷ lời mời gửi'} ${r.displayName}`}
                onClick={() => drop.mutate(r.id)}
              >
                {incoming ? 'Từ chối' : 'Huỷ'}
              </Button>
            </li>
          ))}
        </ul>
      </Card>
      {failed && <InlineError className="mt-2">{errorText(failed, 'Không thực hiện được.')}</InlineError>}
    </>
  );
}

function BoardTable({ board }: { board: Leaderboard }) {
  return (
    <>
      <Card padded={false}>
        <ol className="divide-y divide-line">
          {board.entries.map((e) => (
            <li
              key={e.userId}
              className={cn('flex items-center gap-3 px-4 py-3 sm:px-5', e.me && 'bg-accent-soft/40')}
            >
              <span className="w-6 text-center text-sm font-semibold tabular-nums text-fg-muted">
                {e.rank}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-fg">
                <UserText>{e.displayName}</UserText>
              </span>
              {e.me && <Badge tone="neutral">Bạn</Badge>}
              <span className="text-sm font-semibold tabular-nums text-fg">{e.xp} XP</span>
            </li>
          ))}
        </ol>
      </Card>
      {board.entries.length === 1 && (
        <p className="mt-3 text-sm text-fg-subtle">Gửi mã mời cho bạn bè để cùng xếp hạng.</p>
      )}
    </>
  );
}

function FriendList({ friends }: { friends: Friend[] }) {
  const remove = useRemoveFriend();
  const [confirming, setConfirming] = useState<string | null>(null);
  return (
    <Card padded={false}>
      <ul className="divide-y divide-line">
        {friends.map((f) => (
          <li key={f.userId} className="flex items-center gap-3 px-4 py-3 sm:px-5">
            <span className="min-w-0 flex-1 truncate text-sm text-fg">
              <UserText>{f.displayName}</UserText>
            </span>
            {confirming === f.userId ? (
              <>
                <Button
                  size="sm"
                  variant="danger"
                  loading={remove.isPending}
                  onClick={() => remove.mutate(f.userId, { onSettled: () => setConfirming(null) })}
                >
                  Xoá bạn
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirming(null)}>
                  Giữ
                </Button>
              </>
            ) : (
              <>
                <span className="text-xs tabular-nums text-fg-subtle">
                  {f.xpThisWeek === null ? 'Ẩn XP' : `${f.xpThisWeek} XP tuần`}
                </span>
                <IconButton
                  icon="x"
                  label={`Xoá ${f.displayName} khỏi bạn học`}
                  size="sm"
                  onClick={() => setConfirming(f.userId)}
                />
              </>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
