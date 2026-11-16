import { useMutation } from '@tanstack/react-query';
import type { SubmitFeedbackInput } from '@learn/api-contracts';
import { apiFetch } from '@/lib/api-client';

export function useSubmitFeedback() {
  return useMutation({
    mutationFn: (input: SubmitFeedbackInput) =>
      apiFetch<{ saved: number }>('/api/v1/feedback', { method: 'POST', body: input }),
  });
}
