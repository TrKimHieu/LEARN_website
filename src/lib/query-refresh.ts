import type { QueryClient } from '@tanstack/react-query';

/** Hạn mức đã dùng, đọc từ `GET /subscription`. */
export function refreshUsage(client: QueryClient) {
  return client.invalidateQueries({ queryKey: ['subscription'] });
}

/**
 * Sau khi nội dung khóa học đổi: khóa `['courses']` phủ cả danh sách, chi tiết, tài liệu và bài học;
 * tổng quan và hạn mức tính từ cùng dữ liệu đó.
 */
export function refreshCourseData(client: QueryClient) {
  return Promise.all([
    client.invalidateQueries({ queryKey: ['courses'] }),
    client.invalidateQueries({ queryKey: ['progress'] }),
    refreshUsage(client),
  ]);
}
