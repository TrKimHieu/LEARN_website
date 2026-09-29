# ADR-009: Chạy AI worker bằng Gemini free tier, có model dự phòng cùng nhà cung cấp

Trạng thái: Đã chấp nhận · 2026-09-27 · Thay đổi một phần HANDBOOK §5.3 `[QĐ]`

## Bối cảnh

HANDBOOK §5.3 chọn Claude Sonnet 5 cho outline và lesson. Thực tế dự án chỉ có một API key Google AI
Studio ở free tier, và từ 2026-09-22 worker đã chạy `LLM_PROVIDER=google` — chưa có ADR ghi lại.

Ngày 2026-09-27 đã so sánh thật trên đúng pipeline (chunk → outline → lesson → validate 4 tầng) bằng
`apps/worker/src/scripts/compare-models.ts` với tài liệu mẫu `apps/worker/fixtures/sample-vi-http.md`:

| Model                   | Bài học qua 4 tầng | Lần thử / bài | Thời gian / lời gọi | Chi phí / job (giá trả phí) |
| ----------------------- | ------------------ | ------------- | ------------------- | --------------------------- |
| `gemini-3.1-flash-lite` | 2/2 (hai lần chạy) | 1             | ~3.7 s              | ~$0.004                     |
| `gemini-3.5-flash-lite` | 2/2                | 1             | ~13.8 s             | ~$0.005                     |
| `gemini-3.8-flash`      | không đo được      | —             | —                   | —                           |

`gemini-3.8-flash` (mới nhất) không dùng được ở free tier: hạn mức **5 request/phút và 20
request/ngày mỗi model**; một job cần ~5–15 lời gọi, nên chỉ được 1–3 job mỗi ngày. Quota ngày cạn
ngay trong lúc đo, nên chưa có số liệu chất lượng của nó.

Cũng trong lúc đo phát hiện prompt `lesson@1` chỉ liệt kê tên trường, không nêu giá trị enum —
model thật bịa `difficulty`/`type` và **100% bài học trượt tầng 1**. Đã sửa thành `lesson@2` (nhúng
JSON Schema sinh từ chính Zod schema); số liệu bảng trên là sau khi sửa.

## Quyết định

- Model chính `LLM_MODEL_GENERATION=gemini-3.1-flash-lite`: qua 4 tầng ngay lần đầu, nhanh nhất,
  rẻ nhất, và không sinh thought token.
- Thêm biến `LLM_MODEL_FALLBACK` (mới, tuỳ chọn) — `gemini-3.5-flash-lite`. Khi model chính trả
  429/503/529 sau khi adapter đã tự thử lại, `FallbackLlmProvider` gọi lại đúng prompt đó bằng model
  dự phòng. Không dùng lại `LLM_MODEL_FAST` vì §5.3 đã dành biến đó cho phân loại/gắn nhãn nhẹ.
- Model dự phòng phải cùng họ với provider; worker chặn ngay lúc khởi động nếu sai.
- Adapter Gemini chờ theo `RetryInfo` của API (trần 60 s) khi hết quota **phút**, nhưng ném ngay khi
  hết quota **ngày** — API vẫn trả `retryDelay` ~30 s trong trường hợp này dù chờ không có tác dụng.

Claude Sonnet 5 vẫn là lựa chọn §5.3 khi có key Anthropic: chỉ cần đổi `LLM_PROVIDER=anthropic`,
adapter đã có và cũng báo `LlmUnavailableError` cho 429/503/529.

## Hệ quả

**Tốt:** chạy được pipeline thật với chi phí $0. Model quá tải hoặc hết quota không còn làm hỏng cả
job, và `GenerationRun.model` ghi đúng model đã trả lời, nên chi phí vẫn tính đúng.

**Xấu:** mẫu đo nhỏ (một tài liệu, 2 bài/model). Free tier có thể dùng dữ liệu gửi lên để cải thiện
sản phẩm của Google, nên không hợp với tài liệu riêng tư của người dùng thật. Chất lượng của
`gemini-3.8-flash` chưa được đo.

**Sẽ xem lại khi:** bật billing (đo lại 3.8-flash — giá khuyến mãi $0.75/$3.75 tới 31/12/2026, sau đó
$1.50/$7.50), có key Anthropic, hoặc có người dùng thật tải tài liệu riêng tư lên.
