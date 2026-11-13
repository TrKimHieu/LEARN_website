import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CourseSummary,
  CreateDeckInput,
  CreateFlashcardInput,
  DeckDetailResponse,
  DeckListResponse,
  DeckSummary,
  DueFlashcardsResponse,
  Flashcard,
  FlashcardReviewResult,
  PatchDeckInput,
  PatchFlashcardInput,
  SubmitFlashcardReviewInput,
} from '@learn/api-contracts';
import { apiFetch } from '@/lib/api-client';

/** Một khóa gốc `['decks']` phủ danh sách và chi tiết: đổi thẻ thì số đếm của bộ cũng đổi. */
const DECKS = ['decks'] as const;

export function useDecks() {
  return useQuery({
    queryKey: DECKS,
    queryFn: () => apiFetch<DeckListResponse>('/api/v1/decks'),
  });
}

export function useDeck(deckId: string) {
  return useQuery({
    queryKey: [...DECKS, deckId],
    queryFn: () => apiFetch<DeckDetailResponse>(`/api/v1/decks/${deckId}/cards`),
    enabled: Boolean(deckId),
  });
}

export function useCreateDeck() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDeckInput) =>
      apiFetch<DeckSummary>('/api/v1/decks', { method: 'POST', body: input }),
    onSuccess: () => client.invalidateQueries({ queryKey: DECKS }),
  });
}

export function usePatchDeck(deckId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: PatchDeckInput) =>
      apiFetch<DeckSummary>(`/api/v1/decks/${deckId}`, { method: 'PATCH', body: input }),
    onSuccess: () => client.invalidateQueries({ queryKey: DECKS }),
  });
}

export function useDeleteDeck(deckId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch(`/api/v1/decks/${deckId}`, { method: 'DELETE' }),
    onSuccess: () => {
      // Bỏ khỏi cache trước khi làm mới để không hỏi lại một bộ đã xóa.
      client.removeQueries({ queryKey: [...DECKS, deckId] });
      return client.invalidateQueries({ queryKey: DECKS });
    },
  });
}

export function useCreateCard(deckId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFlashcardInput) =>
      apiFetch<Flashcard>(`/api/v1/decks/${deckId}/cards`, { method: 'POST', body: input }),
    onSuccess: () => client.invalidateQueries({ queryKey: DECKS }),
  });
}

export function usePatchCard() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, ...input }: PatchFlashcardInput & { cardId: string }) =>
      apiFetch<Flashcard>(`/api/v1/cards/${cardId}`, { method: 'PATCH', body: input }),
    onSuccess: () => client.invalidateQueries({ queryKey: DECKS }),
  });
}

export function useDeleteCard() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (cardId: string) => apiFetch(`/api/v1/cards/${cardId}`, { method: 'DELETE' }),
    onSuccess: () => client.invalidateQueries({ queryKey: DECKS }),
  });
}

/**
 * Danh sách khóa học để gắn bộ thẻ. Khóa cache riêng (`['course-options']`) vì feature này
 * không được import feature courses (ranh giới feature).
 */
export function useCourseOptions() {
  return useQuery({
    queryKey: ['course-options'],
    queryFn: () => apiFetch<{ courses: CourseSummary[] }>('/api/v1/workspace'),
  });
}

/**
 * Thẻ đến hạn của một bộ cho phiên ôn. Phiên chụp danh sách lúc mở, nên không tự hỏi lại khi quay lại
 * tab và không giữ cache sau khi rời màn: lần ôn sau luôn lấy danh sách mới.
 */
export function useDueCards(deckId: string) {
  return useQuery({
    queryKey: [...DECKS, deckId, 'due'],
    queryFn: () => apiFetch<DueFlashcardsResponse>(`/api/v1/decks/${deckId}/due?limit=50`),
    enabled: Boolean(deckId),
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });
}

export function useSubmitReview() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      cardId,
      key,
      ...input
    }: SubmitFlashcardReviewInput & { cardId: string; key: string }) =>
      apiFetch<FlashcardReviewResult>(`/api/v1/cards/${cardId}/review`, {
        method: 'POST',
        body: input,
        headers: { 'Idempotency-Key': key },
      }),
    // Chỉ làm mới số đếm của danh sách bộ; không đụng danh sách thẻ đang ôn.
    onSuccess: () => client.invalidateQueries({ queryKey: DECKS, refetchType: 'none' }),
  });
}
