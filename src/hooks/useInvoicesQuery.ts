/**
 * useInvoicesQuery — React Query hooks for the Billing Invoices module.
 *
 * On create: also invalidates products (stock was deducted).
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoicesService } from "../services/invoices";
import type { Invoice } from "../lib/billing-data";
import type { DbProduct } from "../services/products";

// ── Query keys ─────────────────────────────────────────────────────

export const invoiceKeys = {
  all: ["invoices"] as const,
  byBusiness: (businessId: string) => ["invoices", businessId] as const,
};

// ── Fetch ──────────────────────────────────────────────────────────

export function useInvoices(businessId: string | null) {
  return useQuery({
    queryKey: businessId ? invoiceKeys.byBusiness(businessId) : invoiceKeys.all,
    queryFn: () => invoicesService.getAll(businessId!),
    enabled: !!businessId,
    staleTime: 1000 * 30, // 30 s
  });
}

// ── Mutations ──────────────────────────────────────────────────────

export function useCreateInvoice(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      invoice,
      dbProducts,
      skipMovements,
    }: {
      invoice: Invoice;
      dbProducts?: DbProduct[];
      skipMovements?: boolean;
    }) => invoicesService.create(invoice, businessId!, dbProducts ?? [], skipMovements ?? false),
    onSuccess: () => {
      if (businessId) {
        qc.invalidateQueries({ queryKey: invoiceKeys.byBusiness(businessId) });
        qc.invalidateQueries({ queryKey: ["reports", businessId] });
        // Stock was deducted — refresh products
        qc.invalidateQueries({ queryKey: ["products", businessId] });
        qc.invalidateQueries({ queryKey: ["inventory_movements", businessId] });
      }
    },
  });
}

export function useUpdateInvoice(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, invoice }: { id: string; invoice: Invoice }) =>
      invoicesService.update(id, invoice, businessId!),
    onSuccess: () => {
      if (businessId) {
        qc.invalidateQueries({ queryKey: invoiceKeys.byBusiness(businessId) });
        qc.invalidateQueries({ queryKey: ["reports", businessId] });
      }
    },
  });
}

export function useDeleteInvoice(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoicesService.delete(id),
    onSuccess: () => {
      if (businessId) {
        qc.invalidateQueries({ queryKey: invoiceKeys.byBusiness(businessId) });
        qc.invalidateQueries({ queryKey: ["reports", businessId] });
      }
    },
  });
}
