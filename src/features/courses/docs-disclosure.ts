/**
 * Mục "Tài liệu" mở sẵn khi người dùng cần thấy nó: chưa có tài liệu, đang tải lên, hoặc vừa lỗi.
 * Trong lúc danh sách còn đang tải thì giữ đóng, để khóa đã có tài liệu không mở ra rồi gập lại.
 */
export function docsStartOpen(s: {
  docCount: number;
  loading: boolean;
  uploading: boolean;
  uploadError: boolean;
}) {
  return (!s.loading && s.docCount === 0) || s.uploading || s.uploadError;
}
