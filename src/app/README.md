# app/ — route của Next.js

Mỗi `page.tsx` là một URL; thư mục `(app)` / `(auth)` là **nhóm route** (không xuất hiện trên URL).
Trang ở đây chỉ nên **ghép** thành phần từ `features/` và `components/`, không chứa nghiệp vụ.

- `(auth)/` — đăng nhập, đăng ký, quên/đặt lại mật khẩu (chưa cần đăng nhập)
- `(app)/` — mọi màn sau đăng nhập (`layout.tsx` bọc `ProtectedRoute` + `AppShell`); `admin/` chỉ ADMIN
- `dev/` — bảng mẫu component `/dev/ui` và màn lỗi `/dev/error`, chỉ để dev xem
- `layout.tsx` — khung gốc và các provider; `error.tsx`, `not-found.tsx` — màn lỗi / 404

Quy tắc import: `app/` được import mọi thứ bên dưới, nhưng **không ai được import `app/`**.
Danh sách đầy đủ từng route: [`docs/STRUCTURE.md`](../../../../docs/STRUCTURE.md) §3.1.
