import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AcceptFlashcardDraftsInput,
  AcceptFlashcardDraftsResult,
  AiJobDetail,
  CourseSummary,
  CreateDeckInput,
  CreateFlashcardInput,
  DeckDetailResponse,
  DeckListResponse,
  DeckSummary,
  DocumentList,
  DueFlashcardsResponse,
  Flashcard,
  FlashcardDraftList,
  FlashcardReviewResult,
  GenerateFlashcardsInput,
  LessonSummary,
  PatchFlashcardDraftInput,
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
 * Thẻ đến hạn cho phiên ôn: một bộ, hoặc mọi bộ khi `deckId = null` (Ôn hôm nay). Phiên chụp danh sách
 * lúc mở, nên không tự hỏi lại khi quay lại tab và không giữ cache sau khi rời màn: lần ôn sau luôn
 * lấy danh sách mới.
 */
export function useDueCards(deckId: string | null) {
  return useQuery({
    queryKey: [...DECKS, deckId ?? 'all', 'due'],
    queryFn: () =>
      apiFetch<DueFlashcardsResponse>(
        deckId ? `/api/v1/decks/${deckId}/due?limit=50` : '/api/v1/flashcards/due?limit=50',
      ),
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });
}

/** Số thẻ đến hạn của mọi bộ cho điều hướng và dashboard; làm tươi mỗi phút và khi quay lại tab. */
export function useDueCount() {
  return useQuery({
    queryKey: [...DECKS, 'due-count'],
    queryFn: () => apiFetch<DueFlashcardsResponse>('/api/v1/flashcards/due?limit=1'),
    select: (d) => d.dueCount,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
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
    // Số đếm (danh sách bộ, điều hướng) làm tươi ngay; danh sách thẻ đang ôn thì không đụng tới.
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: [...DECKS, 'due-count'] });
      return client.invalidateQueries({ queryKey: DECKS, refetchType: 'none' });
    },
  });
}

// ── Sinh thẻ bằng AI và duyệt Thẻ nháp ────────────────────────────────────────────────────────
// Nguồn (bài học, tài liệu) lấy qua endpoint của khóa học; không import feature courses/learning
// (ranh giới feature), nên khóa cache riêng.
export function useCourseLessons(courseId: string) {
  return useQuery({
    queryKey: ['flashcard-source', 'lessons', courseId],
    queryFn: () => apiFetch<{ lessons: LessonSummary[] }>(`/api/v1/courses/${courseId}/lessons`),
    enabled: Boolean(courseId),
  });
}

export function useCourseDocuments(courseId: string) {
  return useQuery({
    queryKey: ['flashcard-source', 'documents', courseId],
    queryFn: () => apiFetch<{ documents: DocumentList[] }>(`/api/v1/courses/${courseId}/documents`),
    enabled: Boolean(courseId),
  });
}

export function useGenerateFlashcards(courseId: string) {
  return useMutation({
    mutationFn: (input: GenerateFlashcardsInput) =>
      apiFetch<AiJobDetail>(`/api/v1/ai/courses/${courseId}/generate-flashcards`, {
        method: 'POST',
        body: input,
      }),
  });
}

const ACTIVE = new Set(['QUEUED', 'RUNNING']);

/** Theo dõi job sinh thẻ: hỏi lại mỗi 1,5 giây khi còn chạy, dừng khi đã xong. */
export function useFlashcardJob(jobId: string | null) {
  return useQuery({
    queryKey: ['ai', 'flashcard-job', jobId],
    queryFn: () => apiFetch<AiJobDetail>(`/api/v1/ai/jobs/${jobId}`),
    enabled: jobId !== null,
    refetchInterval: (query) => (ACTIVE.has(query.state.data?.status ?? '') ? 1500 : false),
  });
}

export function useCancelFlashcardJob(jobId: string | null) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<AiJobDetail>(`/api/v1/ai/jobs/${jobId}/cancel`, { method: 'POST' }),
    onSuccess: (data) => client.setQueryData(['ai', 'flashcard-job', jobId], data),
  });
}

export function useDrafts(aiJobId?: string) {
  return useQuery({
    queryKey: [...DECKS, 'drafts', aiJobId ?? 'all'],
    queryFn: () =>
      apiFetch<FlashcardDraftList>(
        aiJobId ? `/api/v1/flashcards/drafts?aiJobId=${aiJobId}` : '/api/v1/flashcards/drafts',
      ),
  });
}

export function usePatchDraft() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: PatchFlashcardDraftInput & { id: string }) =>
      apiFetch(`/api/v1/flashcards/drafts/${id}`, { method: 'PATCH', body: input }),
    onSuccess: () => client.invalidateQueries({ queryKey: [...DECKS, 'drafts'] }),
  });
}

export function useDeleteDraft() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/v1/flashcards/drafts/${id}`, { method: 'DELETE' }),
    onSuccess: () => client.invalidateQueries({ queryKey: [...DECKS, 'drafts'] }),
  });
}

export function useAcceptDrafts() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: AcceptFlashcardDraftsInput) =>
      apiFetch<AcceptFlashcardDraftsResult>('/api/v1/flashcards/drafts/accept', {
        method: 'POST',
        body: input,
      }),
    // Thẻ mới đến hạn ngay: số đếm của bộ và điều hướng đổi theo.
    onSuccess: () => client.invalidateQueries({ queryKey: DECKS }),
  });
}
