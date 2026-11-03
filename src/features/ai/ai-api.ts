import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AiJobSummary, GenerateLessonsInput } from '@learn/api-contracts';
import { apiFetch } from '@/lib/api-client';

const ACTIVE_STATUSES = new Set(['QUEUED', 'RUNNING']);

export function useGenerateLessons(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GenerateLessonsInput = {}) =>
      apiFetch<AiJobSummary>(`/api/v1/ai/courses/${courseId}/generate-lessons`, {
        method: 'POST',
        body: input,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', courseId, 'lessons'] });
    },
  });
}

/** Theo dõi 1 AIJob — poll 2s trong lúc QUEUED/RUNNING, dừng poll khi đã xong (HANDBOOK §7.4 fallback). */
export function useAiJob(jobId: string | null) {
  return useQuery({
    queryKey: ['ai', 'jobs', jobId],
    queryFn: () => apiFetch<AiJobSummary>(`/api/v1/ai/jobs/${jobId}`),
    enabled: jobId !== null,
    refetchInterval: (query) =>
      ACTIVE_STATUSES.has(query.state.data?.status ?? '') ? 2000 : false,
  });
}

export function useCancelAiJob(jobId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<AiJobSummary>(`/api/v1/ai/jobs/${jobId}/cancel`, { method: 'POST' }),
    onSuccess: (data) => {
      queryClient.setQueryData(['ai', 'jobs', jobId], data);
    },
  });
}
