'use client';

import { TodayView } from '@/features/home/today-view';
import { usePageTitle } from '@/lib/use-page-title';

/** Học — vào là biết hôm nay học gì (spec learning-first UI 4.2). */
export default function DashboardPage() {
  usePageTitle('Học');
  return (
    <>
      <h1 className="sr-only">Học</h1>
      <TodayView />
    </>
  );
}
