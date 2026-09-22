import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * Nối className có điều kiện **và** khử xung đột Tailwind.
 *
 * Trước đây hàm này chỉ `join(' ')`, nên `className` truyền từ ngoài vào không
 * ghi đè được lớp mặc định của primitive — `<Button className="bg-white">` vẫn
 * ra nền sky vì cả hai lớp cùng tồn tại và thứ tự trong file CSS mới là thứ
 * quyết định. `tailwind-merge` giữ lại lớp đứng sau trong cùng nhóm, đúng với
 * kỳ vọng của mọi call site.
 *
 * Token riêng của LEARN (`packages/config/tailwind/theme.css`) không nằm trong
 * thang mặc định của Tailwind nên phải khai báo thêm, nếu không `rounded-card`
 * và `rounded-2xl` sẽ bị coi là hai nhóm khác nhau và cùng tồn tại.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      rounded: [{ rounded: ['control', 'card', 'panel', 'pill'] }],
      shadow: [{ shadow: ['card', 'raised', 'overlay'] }],
    },
  },
});

export function cn(...parts: ClassValue[]): string {
  return twMerge(clsx(parts));
}
