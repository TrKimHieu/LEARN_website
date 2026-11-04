import { useCallback, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DOCUMENT_TYPES, mimeFromFilename, type UploadUrlResponse } from '@learn/api-contracts';
import { apiFetch } from '@/lib/api-client';
import { UploadCancelledError, putWithProgress } from './upload-transfer';

export type UploadProgress =
  | { phase: 'preparing' | 'confirming'; percent: null }
  | { phase: 'uploading'; percent: number };

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
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const controller = useRef<AbortController | null>(null);

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      const abort = new AbortController();
      controller.current = abort;
      setProgress({ phase: 'preparing', percent: null });
      // MIME theo đuôi, không theo `file.type`: Chrome trên Windows để rỗng cho .md.
      // Kéo-thả bỏ qua thuộc tính `accept`, nên kiểm ở đây trước khi băm cả tệp.
      const mimeType = mimeFromFilename(file.name);
      if (!mimeType) {
        throw new Error(
          `Chưa hỗ trợ loại tệp này. Chỉ nhận ${DOCUMENT_TYPES.map((t) => t.label).join(', ')}.`,
        );
      }
      const checksumSha256 = await sha256Hex(file);
      if (abort.signal.aborted) throw new UploadCancelledError();
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

      try {
        setProgress({ phase: 'uploading', percent: 0 });
        await putWithProgress({
          url: uploadUrl,
          file,
          contentType: mimeType,
          signal: abort.signal,
          onProgress: (percent) => setProgress({ phase: 'uploading', percent }),
        });
      } catch (err) {
        // Chưa confirm nên hạn mức chưa bị trừ; dọn bản ghi dở. Lỗi dọn dẹp không che lỗi gốc.
        await apiFetch(`/api/v1/documents/${documentId}`, { method: 'DELETE' }).catch(() => null);
        throw err;
      }

      // Từ đây không hủy được nữa: server có thể đã trừ hạn mức và xếp job trích xuất.
      controller.current = null;
      setProgress({ phase: 'confirming', percent: null });
      await apiFetch(`/api/v1/documents/${documentId}/confirm`, {
        method: 'POST',
        body: { sizeBytes: file.size },
      });
      return documentId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', courseId, 'documents'] });
    },
    onSettled: () => {
      controller.current = null;
      setProgress(null);
    },
  });

  const cancel = useCallback(() => controller.current?.abort(), []);

  return { ...mutation, progress, cancel };
}
