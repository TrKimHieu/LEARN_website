'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { DUE_COUNT_KEY, useDueCount } from '@/features/flashcards/flashcards-api';
import {
  useProgressCourses,
  useProgressHistory,
  useProgressOverview,
} from '@/features/learning/learning-api';
import { TODAY_KEY, todayKey } from '@/lib/today-store';
import { seenStudyDayToKeep } from './mood';
import { buildTasks, parsePlan, planGate, reconcile, retriedToday, type SavedPlan } from './today-plan';
import { useNextLessons } from './use-next-lessons';

/** Lịch sử đủ dài để thấy bài chưa đạt mới nhất và lần đạt sau đó (nếu có). */
const HISTORY_LIMIT = 20;
/** Ngày học gần nhất trước hôm nay mà màn này đã thấy, để nhận ra lần quay lại sau khi nghỉ. */
const MOOD_KEY = 'learn.mood';

export function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage unavailable: the plan just isn't kept across visits
  }
}

/** Ngày hôm nay theo máy; kiểm lại mỗi phút khi tab đang mở để danh sách đổi khi qua ngày. */
function useToday() {
  const client = useQueryClient();
  const [day, setDay] = useState(() => todayKey());
  const dayRef = useRef(day);
  useEffect(() => {
    const check = () => {
      const now = todayKey();
      if (document.hidden || now === dayRef.current) return;
      dayRef.current = now;
      // Làm tươi trước khi đổi ngày: lần render với ngày mới đã thấy isFetching nên planGate chờ.
      void client.invalidateQueries({ queryKey: ['progress'] });
      void client.invalidateQueries({ queryKey: DUE_COUNT_KEY });
      setDay(now);
    };
    const timer = setInterval(check, 60_000);
    document.addEventListener('visibilitychange', check);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', check);
    };
  }, [client]);
  return day;
}

export interface TodayPlanState {
  gate: 'wait' | 'error' | 'ready';
  failed: { error: unknown } | undefined;
  /** Tải lại các nguồn vừa lỗi. */
  retry: () => void;
  plan: SavedPlan | null;
  day: string;
  overview: ReturnType<typeof useProgressOverview>;
  /** Lỗi đếm thẻ thì không tự đánh dấu xong việc ôn. */
  liveDue: number;
  previousSeen: string | null;
  /** Số khóa đang học dở (0 < tiến độ < 100). */
  studying: number;
}

/** "Việc hôm nay" (spec 4.2) dùng chung cho màn Học và popup nhắc học. */
export function useTodayPlan(): TodayPlanState {
  const day = useToday();
  const overview = useProgressOverview();
  const courses = useProgressCourses();
  const due = useDueCount();
  const history = useProgressHistory(HISTORY_LIMIT);
  const next = useNextLessons(courses.data?.courses ?? []);
  const [plan, setPlan] = useState<SavedPlan | null>(null);
  const [previousSeen, setPreviousSeen] = useState<string | null>(null);

  const sources = [overview, courses, due, history, ...next.queries];
  const gate = planGate(sources);
  const ready = gate === 'ready';
  const failed = sources.find((q) => q.isLoadingError);

  // Danh sách chốt lần đầu trong ngày; các lần sau chỉ đọc lại bản đã lưu.
  useEffect(() => {
    if (!ready) return;
    const saved = parsePlan(readStorage(TODAY_KEY));
    const items = history.data?.items ?? [];
    const fresh = buildTasks({ dueCount: due.data ?? 0, nextLessons: next.lessons, history: items });
    const current = reconcile(saved, fresh, day, retriedToday(items, day));
    if (current !== saved) writeStorage(TODAY_KEY, JSON.stringify(current));
    setPlan(current);
    // Chạy khi dữ liệu vừa đủ (cả sau mỗi lần làm tươi) hoặc qua ngày; trong ngày reconcile luôn
    // trả bản đã lưu, và màn hình vẫn giữ danh sách cũ khi đang làm tươi.
  }, [ready, day]);

  const lastStudyDay = overview.data?.lastStudyDay ?? null;
  useEffect(() => {
    if (!overview.data) return;
    setPreviousSeen(readStorage(MOOD_KEY));
    const keep = seenStudyDayToKeep(lastStudyDay, day);
    if (keep) writeStorage(MOOD_KEY, keep);
  }, [overview.data, lastStudyDay, day]);

  return {
    gate,
    failed,
    retry: () => sources.forEach((q) => q.isLoadingError && void q.refetch()),
    plan,
    day,
    overview,
    liveDue: due.data ?? 1,
    previousSeen,
    studying: next.studying,
  };
}
