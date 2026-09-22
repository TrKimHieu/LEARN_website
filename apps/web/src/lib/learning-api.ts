import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  LessonSummary,
  LessonRead,
  ExerciseRead,
  SubmitExerciseInput,
  SubmissionResult,
  ProgressOverview,
  ProgressCourse,
  HistoryItem,
  PatchLessonInput,
} from '@learn/contracts';
import { apiFetch } from './api-client';

export function useLessons(courseId: string) {
  return useQuery({
    queryKey: ['courses', courseId, 'lessons'],
    queryFn: () => apiFetch<{ lessons: LessonSummary[] }>(`/api/v1/courses/${courseId}/lessons`),
    enabled: Boolean(courseId),
  });
}

export function useLesson(courseId: string, lessonId: string) {
  return useQuery({
    queryKey: ['courses', courseId, 'lessons', lessonId],
    queryFn: () => apiFetch<LessonRead>(`/api/v1/courses/${courseId}/lessons/${lessonId}`),
    enabled: Boolean(courseId && lessonId),
  });
}

export function useStartLesson(courseId: string, lessonId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch(`/api/v1/courses/${courseId}/lessons/${lessonId}/start`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', courseId, 'lessons'] });
    },
  });
}

/** Sửa nội dung Lesson — user story C-01 (HANDBOOK §2.2). */
export function usePatchLesson(courseId: string, lessonId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PatchLessonInput) =>
      apiFetch<LessonRead>(`/api/v1/courses/${courseId}/lessons/${lessonId}`, {
        method: 'PATCH',
        body: input,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(['courses', courseId, 'lessons', lessonId], data);
      queryClient.invalidateQueries({ queryKey: ['courses', courseId, 'lessons'] });
    },
  });
}

/** Sắp xếp lại thứ tự Lesson — user story C-02. */
export function useReorderLessons(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (lessonIds: string[]) =>
      apiFetch<{ lessons: LessonSummary[] }>(`/api/v1/courses/${courseId}/lessons/reorder`, {
        method: 'PATCH',
        body: { lessonIds },
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(['courses', courseId, 'lessons'], data);
    },
  });
}

/** Xoá Lesson — HANDBOOK §7.2 `DELETE /lessons/:id`. */
export function useDeleteLesson(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (lessonId: string) =>
      apiFetch(`/api/v1/courses/${courseId}/lessons/${lessonId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', courseId, 'lessons'] });
    },
  });
}

export function useExercise(lessonId: string) {
  return useQuery({
    queryKey: ['lessons', lessonId, 'exercise'],
    queryFn: () => apiFetch<ExerciseRead>(`/api/v1/lessons/${lessonId}/exercise`),
    enabled: Boolean(lessonId),
    retry: false, // 404 hợp lệ khi lesson chưa có exercise — không cần thử lại
  });
}

export function useSubmitExercise(courseId: string, lessonId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitExerciseInput) =>
      apiFetch<SubmissionResult>(`/api/v1/lessons/${lessonId}/exercise/submit`, {
        method: 'POST',
        body: input,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', lessonId, 'exercise'] });
      queryClient.invalidateQueries({ queryKey: ['courses', courseId, 'lessons'] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}

export function useProgressOverview() {
  return useQuery({
    queryKey: ['progress', 'overview'],
    queryFn: () => apiFetch<ProgressOverview>('/api/v1/progress/overview'),
  });
}

export function useProgressCourses() {
  return useQuery({
    queryKey: ['progress', 'courses'],
    queryFn: () => apiFetch<{ courses: ProgressCourse[] }>('/api/v1/progress/courses'),
  });
}

export function useProgressHistory(limit: number) {
  return useQuery({
    queryKey: ['progress', 'history', limit],
    queryFn: () => apiFetch<{ items: HistoryItem[] }>(`/api/v1/progress/history?limit=${limit}`),
  });
}
