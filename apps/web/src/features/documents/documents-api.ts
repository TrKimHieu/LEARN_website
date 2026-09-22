import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UploadUrlResponse } from '@learn/contracts';
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
      const checksumSha256 = await sha256Hex(file);
      const { documentId, uploadUrl } = await apiFetch<UploadUrlResponse>(
        `/api/v1/courses/${courseId}/documents/upload-url`,
        {
          method: 'POST',
          body: {
            filename: file.name,
            mimeType: file.type || 'application/octet-stream',
            sizeBytes: file.size,
            checksumSha256,
          },
        },
      );

      const putRes = await fetch(uploadUrl, { method: 'PUT', body: file });
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
