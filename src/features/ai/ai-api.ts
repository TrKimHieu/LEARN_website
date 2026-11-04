import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AiJobSummary, GenerateLessonsInput } from '@learn/api-contracts';
import { apiFetch } from '@/lib/api-client';
import { refreshCourseData, refreshUsage } from '@/lib/query-refresh';
import { findActiveGenerateJob, isActiveJobStatus } from './ai-job-active';

const activeJobKey = (courseId: string) => ['ai', 'jobs', 'active', courseId];

export function useGenerateLessons(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GenerateLessonsInput = {}) =>
      apiFetch<AiJobSummary>(`/api/v1/ai/courses/${courseId}/generate-lessons`, {
        method: 'POST',
        body: input,
      }),
    onSuccess: (job) => {
      queryClient.setQueryData(activeJobKey(courseId), job);
      queryClient.invalidateQueries({ queryKey: ['courses', courseId, 'lessons'] });
      void refreshUsage(queryClient);
    },
  });
}

/**
 * Job đang chạy của khóa học, lấy từ server vì state của trang mất khi F5 hoặc chuyển trang.
 * Chỉ đọc lúc mở trang: nếu đọc lại khi đang theo dõi, job vừa xong sẽ rời danh sách và panel tiến
 * độ biến mất trước khi kịp báo kết quả. Job xong lúc người dùng ở trang khác thì làm mới ở đây.
 */
export function useActiveAiJob(courseId: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: activeJobKey(courseId),
    queryFn: async () => {
      const { jobs } = await apiFetch<{ jobs: AiJobSummary[] }>(
        `/api/v1/ai/jobs?courseId=${courseId}`,
      );
      const active = findActiveGenerateJob(jobs);
      if (!active && queryClient.getQueryData(activeJobKey(courseId))) {
        void refreshCourseData(queryClient);
      }
      return active;
    },
    enabled: Boolean(courseId),
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });
}

/** Người dùng rời panel tiến độ: bỏ theo dõi và lấy lại dữ liệu mà job đã làm thay đổi. */
export function useFinishAiJob(courseId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.setQueryData(activeJobKey(courseId), null);
    return refreshCourseData(queryClient);
  };
}

/** Theo dõi 1 AIJob — poll 2s trong lúc QUEUED/RUNNING, dừng poll khi đã xong (HANDBOOK §7.4 fallback). */
export function useAiJob(jobId: string | null) {
  return useQuery({
    queryKey: ['ai', 'jobs', jobId],
    queryFn: () => apiFetch<AiJobSummary>(`/api/v1/ai/jobs/${jobId}`),
    enabled: jobId !== null,
    refetchInterval: (query) => (isActiveJobStatus(query.state.data?.status) ? 2000 : false),
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
