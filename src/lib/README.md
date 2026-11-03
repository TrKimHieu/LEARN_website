# lib/ — hạ tầng của web

Tầng thấp nhất: ESLint chặn import từ `components/`, `features/`, `app/`.

| File                       | Dùng để                                                                  |
| -------------------------- | ------------------------------------------------------------------------ |
| `api-client.ts`            | `apiFetch`: token chỉ giữ trong bộ nhớ, tự refresh, ném `ApiClientError` |
| `query-provider.tsx`       | React Query (staleTime 30s)                                              |
| `theme.tsx`                | Chế độ sáng/tối                                                          |
| `motion.tsx`               | Hiệu ứng chuyển động dùng chung                                          |
| `celebrate.ts`             | Pháo giấy khi qua bài tập                                                |
| `cn.ts`                    | Nối className + khử xung đột Tailwind                                    |
| `format.ts`, `humanize.ts` | Hiển thị thời gian; đổi enum của API thành chữ người đọc                 |
| `form-errors.ts`           | Từ lỗi Zod → biết ô nào sai để đánh dấu và focus                         |
| `url-state.ts`             | State lưu trên query string                                              |
| `env.ts`                   | Biến môi trường phía web                                                 |
