/**
 * Design token LEARN — spec §14.2. Không tím, không đổi giá trị.
 *
 * **Nguồn sự thật là `packages/config/tailwind/theme.css`.** Khối này là bản sao
 * cho mã TypeScript nào cần giá trị màu ngoài Tailwind. Sửa một bên thì phải sửa
 * bên kia — từng có lần lệch (`sky.700`/`warning.700` sửa trong `theme.css` cho
 * đạt tương phản AA nhưng ở đây vẫn giữ giá trị cũ); đã đối chiếu lại và hai file
 * hiện khớp nhau (2026-09-22).
 */
export const colors = {
  navy: {
    900: '#0b1220',
    800: '#0f1720',
    700: '#16202e',
    600: '#1f2c3f',
    500: '#2b3b52',
  },
  sky: {
    50: '#eaf8fe',
    100: '#d3f0fd',
    300: '#a9e2fa',
    400: '#7fd3f7',
    500: '#5EC8F5',
    600: '#2ba9e0',
    700: '#116f97',
  },
  surface: {
    100: '#F4FBFF',
    200: '#E9F4FB',
    300: '#d8e9f4',
    400: '#bcd9ea',
  },
  ink: {
    900: '#0f1720',
    700: '#334155',
    500: '#64748b',
    300: '#94a3b8',
  },
} as const;

/**
 * Màu phản hồi chức năng — KHÔNG phải màu thương hiệu (§14.2 chỉ quy định
 * navy/xám/sky). Chỉ dùng cho đúng/sai, cảnh báo, lỗi; luôn kèm icon để
 * không phụ thuộc riêng vào màu. Bậc 700 đạt AA với chữ trắng.
 */
export const feedbackColors = {
  success: { 50: '#e8f8f1', 100: '#cdefe1', 500: '#15a97a', 700: '#0e7a58' },
  danger: { 50: '#fdecec', 100: '#fbd8d8', 500: '#e04848', 700: '#b02a2a' },
  warning: { 50: '#fef5e7', 100: '#fce8c7', 500: '#e0a33a', 700: '#81570e' },
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
