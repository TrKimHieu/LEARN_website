import type { IconName } from '@/components/ui/icon';

export type NavItem = { href: string; label: string; icon: IconName };

export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/dashboard', label: 'Học', icon: 'home' },
  { href: '/courses', label: 'Khóa học', icon: 'layers' },
  { href: '/decks', label: 'Thẻ', icon: 'card' },
  { href: '/settings', label: 'Tôi', icon: 'settings' },
];

export const CREATE_ITEMS = [
  { href: '/courses/new', label: 'Khóa học từ tài liệu', icon: 'layers' },
  { href: '/decks?new=1', label: 'Bộ thẻ mới', icon: 'card' },
  { href: '/decks/generate', label: 'Sinh thẻ bằng AI', icon: 'sparkles' },
] as const satisfies readonly NavItem[];

export const ADMIN_ITEM: NavItem = { href: '/admin', label: 'Quản trị', icon: 'shield' };

export function navItemsFor(role: string | undefined): readonly NavItem[] {
  return role === 'ADMIN' ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS;
}

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
