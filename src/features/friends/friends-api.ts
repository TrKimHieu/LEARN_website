import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  FriendsOverview,
  InviteFriendInput,
  InviteFriendResult,
  Leaderboard,
} from '@learn/api-contracts';
import { ApiClientError, apiFetch } from '@/lib/api-client';

/** Bạn học (spec 2026-11-20). Máy chủ cũ hoặc tắt `FRIENDS_ENABLED` trả 404. */
export const isFriendsUnavailable = (err: unknown) =>
  err instanceof ApiClientError && err.status === 404;

const KEY = ['friends'] as const;
// 404 (máy chủ chưa có bạn học) không cần thử lại.
const retry = (count: number, err: unknown) => !isFriendsUnavailable(err) && count < 2;

export function useFriends() {
  return useQuery({
    queryKey: [...KEY, 'overview'],
    queryFn: () => apiFetch<FriendsOverview>('/api/v1/friends'),
    retry,
  });
}

export function useLeaderboard() {
  return useQuery({
    queryKey: [...KEY, 'leaderboard'],
    queryFn: () => apiFetch<Leaderboard>('/api/v1/friends/leaderboard'),
    retry,
  });
}

function useFriendsMutation<TInput, TResult>(run: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export const useInviteFriend = () =>
  useFriendsMutation((input: InviteFriendInput) =>
    apiFetch<InviteFriendResult>('/api/v1/friends/invite', { method: 'POST', body: input }),
  );

export const useRotateCode = () =>
  useFriendsMutation(() =>
    apiFetch<{ myCode: string }>('/api/v1/friends/code/rotate', { method: 'POST' }),
  );

export const useAcceptRequest = () =>
  useFriendsMutation((id: string) =>
    apiFetch(`/api/v1/friends/requests/${id}/accept`, { method: 'POST' }),
  );

/** Từ chối lời mời đến hoặc huỷ lời mời đã gửi. */
export const useDropRequest = () =>
  useFriendsMutation((id: string) =>
    apiFetch(`/api/v1/friends/requests/${id}`, { method: 'DELETE' }),
  );

export const useRemoveFriend = () =>
  useFriendsMutation((userId: string) =>
    apiFetch(`/api/v1/friends/${userId}`, { method: 'DELETE' }),
  );

export const useLeaderboardHidden = () =>
  useFriendsMutation((leaderboardHidden: boolean) =>
    apiFetch<{ leaderboardHidden: boolean }>('/api/v1/friends/settings', {
      method: 'PATCH',
      body: { leaderboardHidden },
    }),
  );
