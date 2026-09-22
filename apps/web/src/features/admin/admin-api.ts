import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AdminUser,
  AdminCourse,
  AdminSubscription,
  AdminAiJobList,
  AdminAiJobDetail,
  AuditLogEntry,
  AiCostMetrics,
} from '@learn/contracts';
import { apiFetch } from '@/lib/api-client';

interface AdminMetrics {
  generatedAt: string;
  totals: {
    users: number;
    usersToday: number;
    courses: number;
    documents: number;
    aiJobs: number;
    aiJobsToday: number;
    submissions: number;
    totalCostUsd: number;
  };
  dailyCosts: AiCostMetrics;
}

export function useAdminMetrics() {
  return useQuery({
    queryKey: ['admin', 'metrics'],
    queryFn: () => apiFetch<AdminMetrics>('/api/v1/admin/metrics'),
  });
}

export function useAdminUsers(q?: string) {
  return useQuery({
    queryKey: ['admin', 'users', q ?? ''],
    queryFn: () =>
      apiFetch<{ users: AdminUser[] }>(
        `/api/v1/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}`,
      ),
  });
}

export function useAdminCourses(q?: string) {
  return useQuery({
    queryKey: ['admin', 'courses', q ?? ''],
    queryFn: () =>
      apiFetch<{ courses: AdminCourse[] }>(
        `/api/v1/admin/courses${q ? `?q=${encodeURIComponent(q)}` : ''}`,
      ),
  });
}

export function useAdminSubscriptions() {
  return useQuery({
    queryKey: ['admin', 'subscriptions'],
    queryFn: () => apiFetch<{ subscriptions: AdminSubscription[] }>('/api/v1/admin/subscriptions'),
  });
}

export function useAdminAiJobs(status?: string) {
  return useQuery({
    queryKey: ['admin', 'ai-jobs', status ?? ''],
    queryFn: () =>
      apiFetch<{ jobs: AdminAiJobList[] }>(
        `/api/v1/admin/ai-jobs${status ? `?status=${status}` : ''}`,
      ),
  });
}

export function useAdminAiJobDetail(jobId: string) {
  return useQuery({
    queryKey: ['admin', 'ai-jobs', jobId],
    queryFn: () => apiFetch<AdminAiJobDetail>(`/api/v1/admin/ai-jobs/${jobId}`),
  });
}

export function useAiJobAuditLog(jobId: string) {
  return useQuery({
    queryKey: ['admin', 'ai-jobs', jobId, 'audit-log'],
    queryFn: () =>
      apiFetch<{ entries: AuditLogEntry[] }>(`/api/v1/admin/ai-jobs/${jobId}/audit-log`),
  });
}

export function useRetryAiJob(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<AdminAiJobList>(`/api/v1/admin/ai-jobs/${jobId}/retry`, { method: 'POST' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'ai-jobs'] });
    },
  });
}
