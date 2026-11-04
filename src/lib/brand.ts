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
