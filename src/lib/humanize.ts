/**
 * Lưới an toàn cho luật "không đổ enum thô của API ra màn hình"
 * (`docs/UI-GUIDE.md` §10).
 *
 * Mọi chỗ hiện trạng thái đều có bảng dịch riêng, nhưng bảng nào cũng cần một
 * nhánh `?? …` cho mã mà backend thêm sau. Nhánh đó trước đây là chính cái mã,
 * nên chỉ cần API sinh thêm một trạng thái là `PAST_DUE` lọt thẳng ra giao
 * diện tiếng Việt. Hàm này giữ cho trường hợp xấu nhất vẫn đọc được.
 */
export function humanizeCode(code: string) {
  const words = code.toLowerCase().replace(/_/g, ' ').trim();
  if (words.length === 0) return code;
  return words.charAt(0).toUpperCase() + words.slice(1);
}
