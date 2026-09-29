/**
 * Design token LEARN — spec §14.2 (sửa 2026-09-28, ADR 015): **đơn sắc**, chỉ các tông từ
 * trắng tới đen, xám trung tính không hue ở giữa.
 *
 * **Nguồn sự thật là `packages/config/tailwind/theme.css`.** Khối này là bản sao cho mã
 * TypeScript nào cần giá trị màu ngoài Tailwind. Sửa một bên thì phải sửa bên kia.
 *
 * Không còn `feedbackColors` (xanh/đỏ/vàng): từ ADR 015 trạng thái đúng/sai/cảnh báo được
 * phân biệt bằng icon, chữ và độ đậm của viền, không bằng màu.
 */
export const colors = {
  white: '#ffffff',
  black: '#000000',
  mono: {
    50: '#fafafa',
    100: '#f2f2f2',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#808080',
    600: '#666666',
    700: '#404040',
    800: '#262626',
    900: '#161616',
    950: '#0e0e0e',
  },
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
