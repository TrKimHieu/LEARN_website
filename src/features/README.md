# features/ — module nghiệp vụ của web

Mỗi thư mục là một mảng nghiệp vụ: gọi API, giữ state, và UI **chỉ dùng cho mảng đó**.

| Thư mục     | Mảng                                                     |
| ----------- | -------------------------------------------------------- |
| `auth`      | Đăng nhập/đăng ký, phiên làm việc, bảo vệ route          |
| `courses`   | Khoá học (hook gọi API)                                  |
| `documents` | Tải tài liệu lên (xin URL → PUT S3 → xác nhận)           |
| `learning`  | Bài học, bài tập, nộp bài                                |
| `ai`        | Theo dõi AI Job: tiến độ, huỷ, thành công một phần       |
| `settings`  | Gói đăng ký và hạn mức                                   |
| `admin`     | Quản trị                                                 |
| `shell`     | Khung ứng dụng: điều hướng, menu người dùng, thương hiệu |

Quy ước tên: `*-api.ts` = React Query hook · `*-view.tsx` = nguyên một màn · `*-context.tsx` = React context.

Quy tắc (ESLint chặn): feature **không import feature khác** (ngoại lệ có lý do: `shell` đọc `auth`, `settings`)
và **không import `app/`**. Cần dùng chung giữa hai feature → đưa lên `components/` hoặc `lib/`.
