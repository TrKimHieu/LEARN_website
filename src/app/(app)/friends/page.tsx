'use client';

import { FriendsView } from '@/features/friends/friends-view';
import { usePageTitle } from '@/lib/use-page-title';

/** Bạn học (spec 2026-11-20): mã mời, lời mời, xếp hạng XP tuần trong nhóm bạn. */
export default function FriendsPage() {
  usePageTitle('Bạn học');
  return <FriendsView />;
}
