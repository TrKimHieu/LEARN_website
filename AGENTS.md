# AGENTS.md — Quy tắc làm việc cho mọi session

> README cho AI agent và con người. File này là **điểm vào bắt buộc** của mọi phiên làm việc
> trong repo này. Đọc hết trước khi đụng code.

## Trước khi làm bất cứ gì

Đọc theo đúng thứ tự:

1. `AGENTS.md` (file này)
2. `docs/progress/STATE.md` — bộ nhớ chính: đang ở đâu, việc kế tiếp là gì
3. `docs/progress/CHECKLIST.md` — checklist master (phản chiếu HANDBOOK §20)
4. `docs/REQUIREMENTS.md` **nếu có nghi ngờ một tính năng có nằm trong yêu cầu không, hoặc
   trạng thái của nó là gì** — bảng FR/NFR có ID, nhãn (Có trong MVP/Đang phát triển/Đã lên kế
   hoạch/Mở rộng tương lai), đối chiếu trực tiếp route thật; cập nhật file này khi trạng thái
   một FR/NFR đổi thật sự (không chỉ khi bắt đầu làm)
5. Phần liên quan của `docs/HANDBOOK.md` cho việc đang làm
6. `learnflow-ai-portfolio-agent-spec.md` nếu có nghi ngờ ràng buộc `[SPEC]`
7. `docs/UI-GUIDE.md` **nếu phiên này đụng tới giao diện** — token, thư viện, bảng mẫu `/dev/ui`,
   những bẫy đã dính và checklist trước khi đóng thay đổi

## Cấm / Bắt buộc

- **Cấm** tự ý đổi ràng buộc mang nhãn `[SPEC]` trong HANDBOOK. Muốn đổi phải sửa spec trước.
- Thay đổi quyết định `[QĐ]` phải viết ADR vào `docs/adr/` kèm lý do.
- **Cấm** trình bày tính năng chưa làm như đã làm. Dùng đúng 4 nhãn: `Có trong MVP` · `Đang phát triển` · `Đã lên kế hoạch` · `Mở rộng tương lai`.
- **Cấm** log/commit secret. `.env` không bao giờ được commit.
- Đáp án đúng (`correctAnswer`, `isCorrect`) **không bao giờ** rời server trước khi nộp bài.
- Mọi input ngoài hệ thống đi qua Zod. TypeScript `strict: true`, không dùng `any`.
- Truy vấn dữ liệu phải lọc quyền sở hữu ở **tầng repository** (chống IDOR).
- Một màn hình có dữ liệu phải xử lý đủ 5 trạng thái: Loading · Empty · Error · Partial · Success.

## Kết thúc mỗi phiên (BẮT BUỘC — để session sau tiếp tục được)

Cập nhật 3 file sau, không được bỏ qua:

1. `docs/progress/STATE.md` — mốc hiện tại, việc dang dở, blocker, next-action cụ thể
2. `docs/progress/CHECKLIST.md` — đánh dấu mục đã xong (chỉ khi tiêu chí thật sự đạt)
3. `docs/progress/session-log.md` — thêm dòng nhật ký (ngày · việc làm · kết quả test · quyết định)

Nếu session bị đóng giữa chừng, session mới chỉ cần đọc 3 file này là biết chính xác làm tiếp gì.

## Lệnh hữu ích

```bash
npm run dev              # web :3000 · api :4000 · worker (cần docker: postgres/redis/minio)
npm run dev:web          # chỉ web — đủ để sửa giao diện, KHÔNG cần docker
node scripts/capture-ui.mjs   # chụp /dev/ui ra docs/screenshots/ui/ (xem docs/UI-GUIDE.md)
npm run typecheck        # tsc --noEmit toàn workspace
npm run test             # unit (vitest, không cần docker)
docker compose -f infra/docker-compose.yml up -d   # hạ tầng dev
```
