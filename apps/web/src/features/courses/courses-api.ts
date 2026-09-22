import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CourseDetail,
  CourseSummary,
  CreateCourseInput,
  DocumentList,
} from '@learn/contracts';
import { apiFetch } from '@/lib/api-client';

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
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCourseInput) =>
      apiFetch<CourseDetail>('/api/v1/courses', { method: 'POST', body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}
