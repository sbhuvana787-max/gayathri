import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useBusiness } from "@/contexts/BusinessContext";
import { financeService } from "@/services/finance";

const financeKey = (businessId: string | null) => ["finance", businessId] as const;

export function useFinanceData() {
  const { business } = useBusiness();
  const businessId = business?.id ?? null;
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: financeKey(businessId),
    queryFn: () => financeService.getSnapshot(businessId!),
    enabled: !!businessId,
    staleTime: 30_000,
  });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: financeKey(businessId) });
  const createTransaction = useMutation({
    mutationFn: (input: Parameters<typeof financeService.createTransaction>[1]) =>
      financeService.createTransaction(businessId!, input),
    onSuccess: invalidate,
  });
  const updateTransaction = useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Parameters<typeof financeService.updateTransaction>[1];
    }) => financeService.updateTransaction(id, patch),
    onSuccess: invalidate,
  });
  const deleteTransaction = useMutation({
    mutationFn: financeService.deleteTransaction,
    onSuccess: invalidate,
  });
  const createAccount = useMutation({
    mutationFn: (input: Parameters<typeof financeService.createAccount>[1]) =>
      financeService.createAccount(businessId!, input),
    onSuccess: invalidate,
  });
  const saveSettings = useMutation({
    mutationFn: (settings: Parameters<typeof financeService.saveSettings>[1]) =>
      financeService.saveSettings(businessId!, settings),
    onSuccess: async () => {
      await invalidate();
      if (business?.owner_id)
        await queryClient.invalidateQueries({ queryKey: ["business", business.owner_id] });
    },
  });
  const recordBillPayment = useMutation({
    mutationFn: ({
      billId,
      amount,
      date,
      method,
      bankAccountId,
    }: {
      billId: string;
      amount: number;
      date: string;
      method: string;
      bankAccountId: string | null;
    }) =>
      financeService.recordBillPayment(
        businessId!,
        billId,
        amount,
        date,
        method,
        bankAccountId,
        business?.owner_name || "",
      ),
    onSuccess: invalidate,
  });
  const recordInvoicePayment = useMutation({
    mutationFn: ({
      invoiceId,
      amount,
      mode,
      date,
      bankAccountId,
    }: {
      invoiceId: string;
      amount: number;
      mode: string;
      date: string;
      bankAccountId: string | null;
    }) =>
      financeService.recordInvoicePayment(
        businessId!,
        invoiceId,
        amount,
        mode,
        date,
        bankAccountId,
      ),
    onSuccess: async () => {
      await invalidate();
      await queryClient.invalidateQueries({ queryKey: ["payments", businessId] });
      await queryClient.invalidateQueries({ queryKey: ["invoices", businessId] });
    },
  });
  const createTransfer = useMutation({
    mutationFn: ({
      fromAccountId,
      toAccountId,
      amount,
      date,
      reference,
      notes,
    }: {
      fromAccountId: string;
      toAccountId: string;
      amount: number;
      date: string;
      reference: string;
      notes: string;
    }) =>
      financeService.createTransfer(
        businessId!,
        fromAccountId,
        toAccountId,
        amount,
        date,
        reference,
        notes,
      ),
    onSuccess: invalidate,
  });
  return {
    ...query,
    business,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    createAccount,
    saveSettings,
    recordBillPayment,
    recordInvoicePayment,
    createTransfer,
  };
}
