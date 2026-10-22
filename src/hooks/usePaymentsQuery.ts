/**
 * usePaymentsQuery — React Query hooks for the Billing Payments module.
 *
 * On create/delete/refund/void: also invalidates invoices (balance changed).
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentsService } from "../services/payments";
import type { PaymentMode } from "../lib/billing-data";

// ── Query keys ─────────────────────────────────────────────────────

export const paymentKeys = {
  all: ["payments"] as const,
  byBusiness: (businessId: string) => ["payments", businessId] as const,
};

// ── Fetch ──────────────────────────────────────────────────────────

export function usePayments(businessId: string | null) {
  return useQuery({
    queryKey: businessId ? paymentKeys.byBusiness(businessId) : paymentKeys.all,
    queryFn: () => paymentsService.getAll(businessId!),
    enabled: !!businessId,
    staleTime: 1000 * 30,
  });
}

// ── Create ─────────────────────────────────────────────────────────

export function useCreatePayment(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      invoiceId: string;
      customerId: string;
      amount: number;
      mode: PaymentMode;
      date: string;
      transactionRef?: string;
      notes?: string;
      currency?: string;
    }) => paymentsService.create(input, businessId!),
    onSuccess: () => {
      if (businessId) {
        qc.invalidateQueries({ queryKey: paymentKeys.byBusiness(businessId) });
        qc.invalidateQueries({ queryKey: ["invoices", businessId] });
        qc.invalidateQueries({ queryKey: ["reports", businessId] });
      }
    },
  });
}

// ── Update ─────────────────────────────────────────────────────────

export function useUpdatePayment(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: { mode?: PaymentMode; date?: string; transactionRef?: string; notes?: string };
    }) => paymentsService.update(id, input),
    onSuccess: () => {
      if (businessId) {
        qc.invalidateQueries({ queryKey: paymentKeys.byBusiness(businessId) });
        qc.invalidateQueries({ queryKey: ["reports", businessId] });
      }
    },
  });
}

// ── Delete ─────────────────────────────────────────────────────────

export function useDeletePayment(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => {
      if (!businessId) throw new Error("Business context is required.");
      return paymentsService.delete(id, businessId);
    },
    onSuccess: () => {
      if (businessId) {
        qc.invalidateQueries({ queryKey: paymentKeys.byBusiness(businessId) });
        qc.invalidateQueries({ queryKey: ["invoices", businessId] });
        qc.invalidateQueries({ queryKey: ["reports", businessId] });
      }
    },
  });
}

// ── Refund ─────────────────────────────────────────────────────────

export function useRefundPayment(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => {
      if (!businessId) throw new Error("Business context is required.");
      return paymentsService.refund(id, businessId);
    },
    onSuccess: () => {
      if (businessId) {
        qc.invalidateQueries({ queryKey: paymentKeys.byBusiness(businessId) });
        qc.invalidateQueries({ queryKey: ["invoices", businessId] });
        qc.invalidateQueries({ queryKey: ["reports", businessId] });
      }
    },
  });
}

// ── Void ───────────────────────────────────────────────────────────

export function useVoidPayment(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => {
      if (!businessId) throw new Error("Business context is required.");
      return paymentsService.void(id, businessId);
    },
    onSuccess: () => {
      if (businessId) {
        qc.invalidateQueries({ queryKey: paymentKeys.byBusiness(businessId) });
        qc.invalidateQueries({ queryKey: ["invoices", businessId] });
        qc.invalidateQueries({ queryKey: ["reports", businessId] });
      }
    },
  });
}
