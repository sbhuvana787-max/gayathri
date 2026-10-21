import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  DollarSign,
  Clock,
  TrendingDown,
  Bell,
  CreditCard,
  X,
  CheckCircle,
} from "lucide-react";
import { fmtINR, fmtDate, Receivable, PaymentMethod } from "@/lib/finance-data";
import { useFinanceModel } from "@/hooks/useFinanceModel";
import { useFinanceData } from "@/hooks/useFinanceData";
import type { FinanceAccount } from "@/services/finance";
import {
  SectionCard,
  StatTile,
  StatusPill,
  SearchInput,
  FilterSelect,
  TableWrapper,
  Th,
  Td,
  PrimaryButton,
  SecondaryButton,
  EmptyState,
  Pagination,
} from "@/components/finance/shared";

const TODAY = new Date().toISOString().slice(0, 10);
const PAGE_SIZE = 10;

function daysDiff(dateStr: string): number {
  const due = new Date(dateStr + "T00:00:00");
  const today = new Date(TODAY + "T00:00:00");
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function AgingBucket({
  label,
  amount,
  count,
  color,
  bg,
}: {
  label: string;
  amount: number;
  count: number;
  color: string;
  bg: string;
}) {
  return (
    <div className={`rounded-2xl border ${bg} p-5`}>
      <p className={`text-xs font-semibold uppercase tracking-wide ${color}`}>{label}</p>
      <p className={`mt-2 text-2xl font-bold ${color}`}>{fmtINR(amount)}</p>
      <p className={`mt-1 text-sm ${color} opacity-80`}>
        {count} invoice{count !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

interface RecordPaymentDialogProps {
  receivable: Receivable;
  accounts: FinanceAccount[];
  onClose: () => void;
  onRecord: (
    id: string,
    amount: number,
    date: string,
    method: PaymentMethod,
    accountId: string,
  ) => void;
}

function RecordPaymentDialog({
  receivable,
  accounts,
  onClose,
  onRecord,
}: RecordPaymentDialogProps) {
  const [amount, setAmount] = useState(receivable.outstandingAmount.toString());
  const [date, setDate] = useState(TODAY);
  const [method, setMethod] = useState<PaymentMethod>("Bank Transfer");
  const [accountId, setAccountId] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return;
    onRecord(receivable.id, parsed, date, method, accountId);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Record Payment</h2>
            <p className="text-xs text-muted-foreground">
              {receivable.customer} — {receivable.invoiceNo}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100 text-slate-500">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Invoice Total</span>
              <span className="font-semibold">{fmtINR(receivable.totalAmount)}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-muted-foreground">Already Paid</span>
              <span className="font-semibold text-emerald-600">
                {fmtINR(receivable.paidAmount)}
              </span>
            </div>
            <div className="flex justify-between mt-1 border-t border-slate-200 pt-1">
              <span className="text-muted-foreground font-medium">Outstanding</span>
              <span className="font-bold text-red-600">{fmtINR(receivable.outstandingAmount)}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Amount Received (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={1}
              max={receivable.outstandingAmount}
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Payment Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Payment Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
            >
              {(["Cash", "UPI", "Bank Transfer", "Cheque", "Card"] as PaymentMethod[]).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Deposit account</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="">Unassigned</option>
              {accounts
                .filter((a) => a.is_active)
                .map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.bank_name} · {account.account_number_masked}
                  </option>
                ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <SecondaryButton onClick={onClose} className="flex-1">
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" icon={CheckCircle} className="flex-1">
              Record Payment
            </PrimaryButton>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export function ReceivablesTab() {
  const { model, isLoading, isError, error } = useFinanceModel();
  const finance = useFinanceData();
  const entries = model.receivables;
  const [operationError, setOperationError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [payDialog, setPayDialog] = useState<Receivable | null>(null);

  const totalOutstanding = entries
    .filter((r) => r.status !== "Paid")
    .reduce((s, r) => s + r.outstandingAmount, 0);
  const totalOverdue = entries
    .filter((r) => r.status === "Overdue")
    .reduce((s, r) => s + r.outstandingAmount, 0);
  const pendingCount = entries.filter(
    (r) => r.status === "Pending" || r.status === "Partial",
  ).length;
  const overdueCount = entries.filter((r) => r.status === "Overdue").length;

  // Aging buckets
  const currentBucket = entries.filter((r) => r.status !== "Paid" && daysDiff(r.dueDate) >= 0);
  const overdue130 = entries.filter(
    (r) => r.status !== "Paid" && daysDiff(r.dueDate) < 0 && daysDiff(r.dueDate) >= -30,
  );
  const overdue30plus = entries.filter((r) => r.status !== "Paid" && daysDiff(r.dueDate) < -30);

  const filtered = entries.filter((r) => {
    const matchSearch =
      r.customer.toLowerCase().includes(search.toLowerCase()) ||
      r.invoiceNo.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleRecordPayment(
    id: string,
    amount: number,
    date: string,
    method: PaymentMethod,
    accountId: string,
  ) {
    const invoice = entries.find((item) => item.id === id);
    if (!invoice || amount > invoice.outstandingAmount) {
      setOperationError("Payment amount exceeds this invoice's outstanding balance.");
      return;
    }
    setOperationError("");
    try {
      const mode = (
        {
          Cash: "cash",
          UPI: "upi",
          "Bank Transfer": "bank-transfer",
          Cheque: "cheque",
          Card: "card",
        } as const
      )[method as Exclude<PaymentMethod, "Other">];
      await finance.recordInvoicePayment.mutateAsync({
        invoiceId: invoice.id,
        amount,
        mode,
        date,
        bankAccountId: accountId || null,
      });
      setPayDialog(null);
    } catch (e) {
      setOperationError((e as Error).message || "Unable to record the payment.");
    }
  }

  if (isLoading)
    return (
      <p className="rounded-xl border bg-white p-6 text-sm text-muted-foreground">
        Loading receivables…
      </p>
    );
  if (isError)
    return (
      <p
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700"
      >
        Unable to load receivables: {(error as Error).message}
      </p>
    );

  return (
    <div className="space-y-6">
      {operationError && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {operationError}
        </p>
      )}
      {/* Overdue Banner */}
      {totalOverdue > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4"
        >
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {overdueCount} overdue invoice{overdueCount !== 1 ? "s" : ""} — Action Required
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Total overdue amount: <span className="font-bold">{fmtINR(totalOverdue)}</span>. Send
              reminders or record payments to clear overdue balances.
            </p>
          </div>
        </motion.div>
      )}

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Total Outstanding"
          value={fmtINR(totalOutstanding)}
          icon={DollarSign}
          bg="bg-blue-50"
          iconColor="text-blue-600"
          index={0}
        />
        <StatTile
          label="Overdue Amount"
          value={fmtINR(totalOverdue)}
          icon={AlertTriangle}
          bg="bg-red-50"
          iconColor="text-red-600"
          index={1}
        />
        <StatTile
          label="Pending Invoices"
          value={pendingCount.toString()}
          sub="Awaiting payment"
          icon={Clock}
          bg="bg-amber-50"
          iconColor="text-amber-600"
          index={2}
        />
        <StatTile
          label="Overdue Count"
          value={overdueCount.toString()}
          sub="Past due date"
          icon={TrendingDown}
          bg="bg-rose-50"
          iconColor="text-rose-600"
          index={3}
        />
      </div>

      {/* Aging Buckets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AgingBucket
          label="Current (Not Yet Due)"
          amount={currentBucket.reduce((s, r) => s + r.outstandingAmount, 0)}
          count={currentBucket.length}
          color="text-emerald-700"
          bg="border-emerald-200 bg-emerald-50"
        />
        <AgingBucket
          label="1–30 Days Overdue"
          amount={overdue130.reduce((s, r) => s + r.outstandingAmount, 0)}
          count={overdue130.length}
          color="text-amber-700"
          bg="border-amber-200 bg-amber-50"
        />
        <AgingBucket
          label="30+ Days Overdue"
          amount={overdue30plus.reduce((s, r) => s + r.outstandingAmount, 0)}
          count={overdue30plus.length}
          color="text-red-700"
          bg="border-red-200 bg-red-50"
        />
      </div>

      {/* Main Table */}
      <SectionCard
        title="Customer Invoices"
        subtitle={`${filtered.length} invoice${filtered.length !== 1 ? "s" : ""}`}
        action={
          <div className="flex items-center gap-2">
            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="Search customer / invoice…"
              className="w-56"
            />
            <FilterSelect
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
              options={[
                { value: "All", label: "All Status" },
                { value: "Pending", label: "Pending" },
                { value: "Overdue", label: "Overdue" },
                { value: "Partial", label: "Partial" },
                { value: "Paid", label: "Paid" },
              ]}
            />
          </div>
        }
        noPadding
      >
        {paginated.length === 0 ? (
          <EmptyState
            icon={DollarSign}
            title="No invoices found"
            subtitle="Try adjusting your search or filter."
          />
        ) : (
          <TableWrapper>
            <thead>
              <tr>
                <Th>Invoice #</Th>
                <Th>Customer</Th>
                <Th>Invoice Date</Th>
                <Th>Due Date</Th>
                <Th right>Total</Th>
                <Th right>Paid</Th>
                <Th right>Outstanding</Th>
                <Th>Status</Th>
                <Th>Days</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((r) => {
                const diff = daysDiff(r.dueDate);
                const isOverdue = diff < 0 && r.status !== "Paid";
                return (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <Td>
                      <span className="font-mono text-xs font-medium text-slate-600">
                        {r.invoiceNo}
                      </span>
                    </Td>
                    <Td>
                      <div>
                        <p className="text-sm font-medium text-foreground">{r.customer}</p>
                        <p className="text-xs text-muted-foreground">{r.email}</p>
                      </div>
                    </Td>
                    <Td>
                      <span className="text-sm text-muted-foreground">
                        {fmtDate(r.invoiceDate)}
                      </span>
                    </Td>
                    <Td>
                      <span className="text-sm text-muted-foreground">{fmtDate(r.dueDate)}</span>
                    </Td>
                    <Td right>
                      <span className="text-sm font-medium">{fmtINR(r.totalAmount)}</span>
                    </Td>
                    <Td right>
                      <span className="text-sm text-emerald-600">{fmtINR(r.paidAmount)}</span>
                    </Td>
                    <Td right>
                      <span
                        className={`text-sm font-bold ${isOverdue ? "text-red-600" : r.outstandingAmount > 0 ? "text-slate-800" : "text-emerald-600"}`}
                      >
                        {fmtINR(r.outstandingAmount)}
                      </span>
                    </Td>
                    <Td>
                      <StatusPill status={r.status} />
                    </Td>
                    <Td>
                      {r.status === "Paid" ? (
                        <span className="text-xs text-emerald-600 font-medium">Cleared</span>
                      ) : isOverdue ? (
                        <span className="text-xs font-semibold text-red-600">
                          {Math.abs(diff)} days overdue
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-blue-600">
                          Due in {diff} day{diff !== 1 ? "s" : ""}
                        </span>
                      )}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <a
                          href={
                            r.email
                              ? `mailto:${encodeURIComponent(r.email)}?subject=${encodeURIComponent(`Payment reminder · ${r.invoiceNo}`)}&body=${encodeURIComponent(`Hello ${r.customer},\n\nThis is a reminder that invoice ${r.invoiceNo} has an outstanding balance of ${fmtINR(r.outstandingAmount)}. Please let us know if you have any questions.`)}`
                              : undefined
                          }
                          aria-disabled={!r.email}
                          className={`inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors ${r.email ? "hover:bg-slate-50" : "pointer-events-none opacity-50"}`}
                        >
                          <Bell className="h-3 w-3" />
                          Email Reminder
                        </a>
                        {r.status !== "Paid" && (
                          <button
                            onClick={() => setPayDialog(r)}
                            className="inline-flex items-center gap-1 rounded-lg bg-[image:var(--gradient-brand)] px-2.5 py-1.5 text-xs font-semibold text-white hover:shadow-sm transition-all"
                          >
                            <CreditCard className="h-3 w-3" />
                            Pay
                          </button>
                        )}
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrapper>
        )}
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </SectionCard>

      {/* Record Payment Dialog */}
      {payDialog && (
        <RecordPaymentDialog
          receivable={payDialog}
          accounts={finance.data?.accounts ?? []}
          onClose={() => setPayDialog(null)}
          onRecord={handleRecordPayment}
        />
      )}
    </div>
  );
}
