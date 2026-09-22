import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PlanPublic, SubscriptionResponse, CheckoutUrlResponse } from '@learn/contracts';
import { apiFetch } from '@/lib/api-client';

export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: () => apiFetch<PlanPublic[]>('/api/v1/plans'),
  });
}

export function useSubscription() {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: () => apiFetch<SubscriptionResponse>('/api/v1/subscription'),
  });
}

export function useCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (planCode: string) =>
      apiFetch<CheckoutUrlResponse>('/api/v1/subscription/checkout', {
        method: 'POST',
        body: { planCode },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch('/api/v1/subscription/cancel', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
  });
}
