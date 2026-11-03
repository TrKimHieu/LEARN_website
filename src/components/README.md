# components/ — UI dùng chung

Không biết gì về nghiệp vụ, không gọi API. ESLint chặn import từ `features/` và `app/`.

- `ui/` — primitive giao diện: Button, Card, Badge, Form (Field/Input/…), Table, Progress, Skeleton,
  StatCard, PageHeader, Icon, và `states.tsx` (Loading/Empty/Error/Partial — đủ 5 trạng thái theo AGENTS.md).
  Import qua `@/components/ui`. Xem mẫu sống ở `/dev/ui`.
- `shared/` — khối ghép sẵn dùng nhiều nơi: Mascot, Markdown (render an toàn + mục lục), CourseCover,
  QuotaNotice, ThemeToggle, và nền trang trí (GrainWaves, wave-scenes, decor).
  `shared/mascot/CircleAvatar.tsx` là mã vendor từ Blob Studio — **không sửa tay** (ADR 006).

Thêm component: thuần giao diện → `ui/`; ghép từ nhiều primitive → `shared/`; có nghiệp vụ → `features/`.
Màu, bo góc, bóng lấy từ token Tailwind (`packages/config/tailwind/theme.css`), không hard-code.
