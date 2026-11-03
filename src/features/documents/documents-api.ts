import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DOCUMENT_TYPES, mimeFromFilename, type UploadUrlResponse } from '@learn/api-contracts';
import { apiFetch } from '@/lib/api-client';

async function sha256Hex(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Xin URL upload → PUT thẳng lên S3/MinIO → xác nhận. HANDBOOK §7.2 (documents/upload-url, documents/:id/confirm). */
export function useUploadDocument(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      // MIME theo đuôi, không theo `file.type`: Chrome trên Windows để rỗng cho .md.
      // Kéo-thả bỏ qua thuộc tính `accept`, nên kiểm ở đây trước khi băm cả tệp.
      const mimeType = mimeFromFilename(file.name);
      if (!mimeType) {
        throw new Error(
          `Chưa hỗ trợ loại tệp này. Chỉ nhận ${DOCUMENT_TYPES.map((t) => t.label).join(', ')}.`,
        );
      }
      const checksumSha256 = await sha256Hex(file);
      const { documentId, uploadUrl } = await apiFetch<UploadUrlResponse>(
        `/api/v1/courses/${courseId}/documents/upload-url`,
        {
          method: 'POST',
          body: {
            filename: file.name,
            mimeType,
            sizeBytes: file.size,
            checksumSha256,
          },
        },
      );

      // Presigned URL được ký kèm Content-Type; gửi đúng giá trị đó, không để trình duyệt tự đặt.
      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': mimeType },
      });
      if (!putRes.ok) {
        throw new Error(`Tải file lên storage thất bại (${putRes.status}).`);
      }

      await apiFetch(`/api/v1/documents/${documentId}/confirm`, {
        method: 'POST',
        body: { sizeBytes: file.size },
      });
      return documentId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', courseId, 'documents'] });
    },
  });
}
