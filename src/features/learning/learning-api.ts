import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  LessonSource,
  LessonSummary,
  LessonRead,
  ExerciseRead,
  SubmitExerciseInput,
  SubmissionResult,
  ProgressOverview,
  ProgressCourse,
  HistoryPage,
  PatchLessonInput,
} from '@learn/api-contracts';
import { apiFetch } from '@/lib/api-client';

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

/** Đoạn tài liệu gốc của bài — chỉ tải khi người học mở khối "Nguồn" (`enabled`). */
export function useLessonSources(courseId: string, lessonId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['courses', courseId, 'lessons', lessonId, 'sources'],
    queryFn: () =>
      apiFetch<{ sources: LessonSource[] }>(
        `/api/v1/courses/${courseId}/lessons/${lessonId}/sources`,
      ),
    enabled: enabled && Boolean(courseId && lessonId),
    staleTime: 5 * 60_000, // chunk không đổi sau khi trích xuất
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

/** `exerciseId` rỗng = bài tập đầu tiên của bài học. */
export function useExercise(lessonId: string, exerciseId = '') {
  return useQuery({
    queryKey: ['lessons', lessonId, 'exercise', exerciseId || 'first'],
    queryFn: () =>
      apiFetch<ExerciseRead>(
        `/api/v1/lessons/${lessonId}/exercise${exerciseId ? `?exerciseId=${encodeURIComponent(exerciseId)}` : ''}`,
      ),
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

/** Trang đầu của lịch sử — cho khối "Hoạt động gần đây". */
export function useProgressHistory(limit: number) {
  return useQuery({
    queryKey: ['progress', 'history', 'first', limit],
    queryFn: () => apiFetch<HistoryPage>(`/api/v1/progress/history?limit=${limit}`),
  });
}

/**
 * Lịch sử phân trang cursor (FR-PROGRESS-06). "Xem thêm" nối trang kế vào cuối, không tải lại
 * những dòng đã có như cách cũ (tăng `limit` rồi kéo lại từ đầu).
 */
export function useProgressHistoryPages(pageSize: number) {
  return useInfiniteQuery({
    queryKey: ['progress', 'history', 'pages', pageSize],
    initialPageParam: '',
    queryFn: ({ pageParam }) =>
      apiFetch<HistoryPage>(
        `/api/v1/progress/history?limit=${pageSize}${pageParam ? `&cursor=${encodeURIComponent(pageParam)}` : ''}`,
      ),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}
