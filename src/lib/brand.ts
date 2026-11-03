/**
 * Design token LEARN — spec §14.2 (sửa 2026-10-12, ADR 018): **lam học thuật** — navy sâu →
 * coban → periwinkle, cộng ba sắc phản hồi trầm.
 *
 * **Nguồn sự thật là `packages/config/tailwind/theme.css`.** Khối này là bản sao cho mã
 * TypeScript nào cần giá trị màu ngoài Tailwind. Sửa một bên thì phải sửa bên kia.
 */
export const colors = {
  white: '#ffffff',
  black: '#000000',
  lam: {
    50: '#f6f8fd',
    100: '#eef2fb',
    200: '#d6e0f7',
    300: '#b5c6f0',
    400: '#8aa4e6',
    500: '#5b7fdb',
    600: '#3a5fd0',
    700: '#2c49b0',
    800: '#213887',
    900: '#18286a',
    950: '#0e1745',
  },
} as const;

/** Phản hồi — luôn đi kèm icon + chữ, màu chỉ là tín hiệu thứ hai (ADR 018). */
export const feedbackColors = {
  ok: '#16704f',
  bad: '#b0202d',
  warn: '#855600',
} as const;

export const BRAND = {
  name: 'LEARN',
  tagline: 'Turn your documents into interactive learning.',
  taglineVi: 'Biến tài liệu của bạn thành bài học tương tác.',
} as const;

/** 4 nhãn trạng thái tính năng — spec §15, dùng thống nhất mọi nơi. */
export const FEATURE_LABELS = [
  'Có trong MVP',
  'Đang phát triển',
  'Đã lên kế hoạch',
  'Mở rộng tương lai',
] as const;
export type FeatureLabel = (typeof FEATURE_LABELS)[number];
