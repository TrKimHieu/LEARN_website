import type { IconName } from '@/components/ui/icon';

export type NavItem = { href: string; label: string; icon: IconName };

export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/dashboard', label: 'Tổng quan', icon: 'home' },
  { href: '/courses', label: 'Khóa học', icon: 'layers' },
  { href: '/progress', label: 'Tiến trình', icon: 'trend' },
  { href: '/settings', label: 'Cài đặt', icon: 'settings' },
];

export const ADMIN_ITEM: NavItem = { href: '/admin', label: 'Quản trị', icon: 'shield' };

export function navItemsFor(role: string | undefined): readonly NavItem[] {
  return role === 'ADMIN' ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS;
}

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
