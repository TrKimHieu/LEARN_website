/** Mục "Tài liệu" mở sẵn khi người dùng cần thấy nó: chưa có tài liệu, đang tải lên, hoặc vừa lỗi. */
export function docsStartOpen(s: { docCount: number; uploading: boolean; uploadError: boolean }) {
  return s.docCount === 0 || s.uploading || s.uploadError;
}
