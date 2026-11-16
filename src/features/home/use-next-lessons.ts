'use client';

import type { ProgressCourse } from '@learn/api-contracts';
import { useLessons } from '@/features/learning/learning-api';
import { pickNextLesson, rankCourse, type TodayInputs } from './today-plan';

/**
 * Bài kế tiếp của hai khóa chưa xong, khóa gần xong nhất trước (đẩy người học về đích).
 * Gọi `useLessons` đúng hai lần để thứ tự hook không đổi; khóa thiếu thì query bị tắt.
 */
export function useNextLessons(courses: ProgressCourse[]) {
  const open = courses
    .filter((c) => c.percent < 100)
    .sort((a, b) => rankCourse(a) - rankCourse(b) || b.percent - a.percent);
  const first = useLessons(open[0]?.courseId ?? '');
  const second = useLessons(open[1]?.courseId ?? '');

  const lessons: TodayInputs['nextLessons'] = [];
  [first, second].forEach((q, i) => {
    const course = open[i];
    const list = q.data?.lessons ?? [];
    const next = course && pickNextLesson(list);
    if (!course || !next) return;
    lessons.push({
      courseId: course.courseId,
      lessonId: next.lesson.id,
      title: next.lesson.title,
      courseTitle: course.courseTitle,
      index: next.index + 1,
      total: list.length,
    });
  });

  return { lessons, isLoading: first.isLoading || second.isLoading, openCount: open.length };
}
