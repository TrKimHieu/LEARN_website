const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

// `APP_URL` đã tồn tại trong .env.example — API dùng nó cho CORS/link email, và
// đây chính là "URL công khai của web app" mà sitemap/robots/OG cần, nên dùng
// lại thay vì thêm một biến trùng nghĩa. Đọc trực tiếp `process.env` (không cần
// tiền tố `NEXT_PUBLIC_`) vì mọi nơi dùng `env.siteUrl` đều chạy phía server
// (sitemap.ts, robots.ts, metadata của layout) — không có nơi nào ở client.
//
// Chưa có domain thật — dự án chưa deploy công khai (xem README). Mặc định về
// localhost thay vì bịa một domain, đúng tinh thần AGENTS.md "cấm trình bày
// tính năng chưa làm như đã làm".
const siteUrl = process.env.APP_URL ?? 'http://localhost:3000';

export const env = {
  apiUrl: apiUrl.replace(/\/$/, ''),
  siteUrl: siteUrl.replace(/\/$/, ''),
} as const;
