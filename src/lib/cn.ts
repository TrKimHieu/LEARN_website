import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * Nối className có điều kiện **và** khử xung đột Tailwind — `className` truyền từ
 * ngoài vào ghi đè được lớp mặc định của primitive.
 *
 * Token riêng của LEARN (`packages/config/tailwind/theme.css`) không nằm trong thang
 * mặc định của Tailwind nên phải khai báo, nếu không `rounded-card` và `rounded-2xl`
 * bị coi là hai nhóm khác nhau và cùng tồn tại. Màu ngữ nghĩa (`bg-panel`,
 * `text-fg`…) thì tailwind-merge tự nhận ra là màu, không cần khai báo.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      rounded: [{ rounded: ['control', 'card', 'panel', 'pill'] }],
      shadow: [{ shadow: ['card', 'raised', 'overlay', 'glow'] }],
      'font-size': [{ text: ['2xs'] }],
    },
  },
});

export function cn(...parts: ClassValue[]): string {
  return twMerge(clsx(parts));
}
