import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CourseDetail,
  CourseSummary,
  CreateCourseInput,
  DocumentList,
} from '@learn/api-contracts';
import { apiFetch } from '@/lib/api-client';
import { refreshUsage } from '@/lib/query-refresh';
import { documentsRefetchInterval } from './document-polling';

export function useCourses() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: () => apiFetch<{ courses: CourseSummary[] }>('/api/v1/workspace'),
  });
}

export function useCourse(courseId: string) {
  return useQuery({
    queryKey: ['courses', courseId],
    queryFn: () => apiFetch<CourseDetail>(`/api/v1/courses/${courseId}`),
    enabled: Boolean(courseId),
  });
}

export function useCourseDocuments(courseId: string) {
  return useQuery({
    queryKey: ['courses', courseId, 'documents'],
    queryFn: () => apiFetch<{ documents: DocumentList[] }>(`/api/v1/courses/${courseId}/documents`),
    enabled: Boolean(courseId),
    // Upload xong tài liệu mới chỉ UPLOADED; worker trích xuất bất đồng bộ. Không hỏi lại thì
    // nút "Sinh bài học" (cần EXTRACTED) xám tới khi F5.
    refetchInterval: (query) => documentsRefetchInterval(query.state.data),
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCourseInput) =>
      apiFetch<CourseDetail>('/api/v1/courses', { method: 'POST', body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      void refreshUsage(queryClient);
    },
  });
}
