import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Receipt,
  Clock,
  CheckCircle,
  CreditCard,
  Eye,
  X,
  Calendar,
} from "lucide-react";
import { fmtINR, fmtDate, Payable, PaymentMethod } from "@/lib/finance-data";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useFinanceModel } from "@/hooks/useFinanceModel";
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

interface RecordPaymentDialogProps {
  payable: Payable;
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

function RecordPaymentDialog({ payable, accounts, onClose, onRecord }: RecordPaymentDialogProps) {
  const [amount, setAmount] = useState(payable.outstandingAmount.toString());
  const [date, setDate] = useState(TODAY);
  const [method, setMethod] = useState<PaymentMethod>("Bank Transfer");
  const [accountId, setAccountId] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return;
    onRecord(payable.id, parsed, date, method, accountId);
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
              {payable.supplier} — {payable.billNo}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100 text-slate-500">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bill Total</span>
              <span className="font-semibold">{fmtINR(payable.totalAmount)}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-muted-foreground">Already Paid</span>
              <span className="font-semibold text-emerald-600">{fmtINR(payable.paidAmount)}</span>
            </div>
            <div className="flex justify-between mt-1 border-t border-slate-200 pt-1">
              <span className="text-muted-foreground font-medium">Outstanding</span>
              <span className="font-bold text-red-600">{fmtINR(payable.outstandingAmount)}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Amount Paying (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={1}
              max={payable.outstandingAmount}
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
            <label className="text-xs font-medium text-muted-foreground">Paid from account</label>
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

export function PayablesTab() {
  const { model, isLoading, isError, error } = useFinanceModel();
  const { data, recordBillPayment } = useFinanceData();
  const entries = model.payables;
  const [operationError, setOperationError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [payDialog, setPayDialog] = useState<Payable | null>(null);
  const [viewBill, setViewBill] = useState<Payable | null>(null);

  const totalOutstanding = entries
    .filter((p) => p.status !== "Paid")
    .reduce((s, p) => s + p.outstandingAmount, 0);
  const totalOverdue = entries
    .filter((p) => p.status === "Overdue")
    .reduce((s, p) => s + p.outstandingAmount, 0);
  const overdueCount = entries.filter((p) => p.status === "Overdue").length;

  // Upcoming: due within 7 days and not paid
  const upcoming7 = entries
    .filter((p) => {
      if (p.status === "Paid") return false;
      const diff = daysDiff(p.dueDate);
      return diff >= 0 && diff <= 7;
    })
    .sort((a, b) => daysDiff(a.dueDate) - daysDiff(b.dueDate));

  const upcoming7Amount = upcoming7.reduce((s, p) => s + p.outstandingAmount, 0);

  // Paid this month (July 2025)
  const monthKey = new Date().toISOString().slice(0, 7);
  const paidThisMonth = (data?.billPayments ?? [])
    .filter((p) => p.payment_date.startsWith(monthKey))
    .reduce((s, p) => s + p.amount, 0);

  const filtered = entries.filter((p) => {
    const matchSearch =
      p.supplier.toLowerCase().includes(search.toLowerCase()) ||
      p.billNo.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || p.status === statusFilter;
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
    const bill = entries.find((p) => p.id === id);
    if (!bill || amount > bill.outstandingAmount) {
      setOperationError("Payment amount exceeds the bill's outstanding balance.");
      return;
    }
    const dbMethod = (
      {
        Cash: "cash",
        UPI: "upi",
        "Bank Transfer": "bank-transfer",
        Cheque: "cheque",
        Card: "card",
        Other: "other",
      } as const
    )[method];
    setOperationError("");
    try {
      await recordBillPayment.mutateAsync({
        billId: id,
        amount,
        date,
        method: dbMethod,
        bankAccountId: accountId || null,
      });
      setPayDialog(null);
    } catch (e) {
      setOperationError((e as Error).message || "Unable to record supplier payment.");
    }
  }

  if (isLoading)
    return (
      <p className="rounded-xl border bg-white p-6 text-sm text-muted-foreground">
        Loading payables…
      </p>
    );
  if (isError)
    return (
      <p
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700"
      >
        Unable to load payables: {(error as Error).message}
      </p>
    );

  function daysBadge(p: Payable) {
    const diff = daysDiff(p.dueDate);
    if (p.status === "Paid")
      return <span className="text-xs text-emerald-600 font-medium">Cleared</span>;
    if (diff < 0)
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
          {Math.abs(diff)}d overdue
        </span>
      );
    if (diff <= 7)
      return (
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
          Due in {diff}d
        </span>
      );
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
        Due in {diff}d
      </span>
    );
  }

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
          className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4"
        >
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">
              {overdueCount} overdue bill{overdueCount !== 1 ? "s" : ""} — Immediate Payment
              Required
            </p>
            <p className="text-xs text-red-700 mt-0.5">
              Total overdue: <span className="font-bold">{fmtINR(totalOverdue)}</span>. Late
              payments may incur penalties.
            </p>
          </div>
        </motion.div>
      )}

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Total Outstanding"
          value={fmtINR(totalOutstanding)}
          icon={Receipt}
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
          label="Due Next 7 Days"
          value={fmtINR(upcoming7Amount)}
          sub={`${upcoming7.length} bill${upcoming7.length !== 1 ? "s" : ""}`}
          icon={Clock}
          bg="bg-amber-50"
          iconColor="text-amber-600"
          index={2}
        />
        <StatTile
          label="Paid This Month"
          value={fmtINR(paidThisMonth)}
          sub={new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
          icon={CheckCircle}
          bg="bg-emerald-50"
          iconColor="text-emerald-600"
          index={3}
        />
      </div>

      {/* Upcoming Payments Section */}
      {upcoming7.length > 0 && (
        <SectionCard
          title="Upcoming Payments"
          subtitle="Due within the next 7 days — act now to avoid late fees"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcoming7.map((p, i) => {
              const diff = daysDiff(p.dueDate);
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-slate-200 bg-white p-4 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{p.supplier}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{p.billNo}</p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${diff === 0 ? "bg-red-100 text-red-700" : diff <= 3 ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}
                    >
                      {diff === 0 ? "Due Today" : `${diff}d left`}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-foreground">
                        {fmtINR(p.outstandingAmount)}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        {fmtDate(p.dueDate)}
                      </p>
                    </div>
                    <button
                      onClick={() => setPayDialog(p)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[image:var(--gradient-brand)] px-3 py-1.5 text-xs font-semibold text-white hover:shadow-md transition-all"
                    >
                      <CreditCard className="h-3 w-3" />
                      Pay Now
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* Main Table */}
      <SectionCard
        title="Supplier Bills"
        subtitle={`${filtered.length} bill${filtered.length !== 1 ? "s" : ""}`}
        action={
          <div className="flex items-center gap-2">
            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="Search supplier / bill…"
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
                { value: "Upcoming", label: "Upcoming" },
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
            icon={Receipt}
            title="No bills found"
            subtitle="Try adjusting your search or filter."
          />
        ) : (
          <TableWrapper>
            <thead>
              <tr>
                <Th>Bill #</Th>
                <Th>Supplier</Th>
                <Th>Bill Date</Th>
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
              {paginated.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <Td>
                    <span className="font-mono text-xs font-medium text-slate-600">{p.billNo}</span>
                  </Td>
                  <Td>
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.supplier}</p>
                      <p className="text-xs text-muted-foreground">{p.contactPhone}</p>
                    </div>
                  </Td>
                  <Td>
                    <span className="text-sm text-muted-foreground">{fmtDate(p.billDate)}</span>
                  </Td>
                  <Td>
                    <span className="text-sm text-muted-foreground">{fmtDate(p.dueDate)}</span>
                  </Td>
                  <Td right>
                    <span className="text-sm font-medium">{fmtINR(p.totalAmount)}</span>
                  </Td>
                  <Td right>
                    <span className="text-sm text-emerald-600">{fmtINR(p.paidAmount)}</span>
                  </Td>
                  <Td right>
                    <span
                      className={`text-sm font-bold ${p.status === "Overdue" ? "text-red-600" : p.outstandingAmount > 0 ? "text-slate-800" : "text-emerald-600"}`}
                    >
                      {fmtINR(p.outstandingAmount)}
                    </span>
                  </Td>
                  <Td>
                    <StatusPill status={p.status} />
                  </Td>
                  <Td>{daysBadge(p)}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewBill(p)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </button>
                      {p.status !== "Paid" && (
                        <button
                          onClick={() => setPayDialog(p)}
                          className="inline-flex items-center gap-1 rounded-lg bg-[image:var(--gradient-brand)] px-2.5 py-1.5 text-xs font-semibold text-white hover:shadow-sm transition-all"
                        >
                          <CreditCard className="h-3 w-3" />
                          Pay
                        </button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        )}
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </SectionCard>

      {/* Record Payment Dialog */}
      {payDialog && (
        <RecordPaymentDialog
          payable={payDialog}
          accounts={data?.accounts ?? []}
          onClose={() => setPayDialog(null)}
          onRecord={handleRecordPayment}
        />
      )}
      {viewBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold">Supplier Bill {viewBill.billNo}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{viewBill.supplier}</p>
              </div>
              <button
                aria-label="Close bill details"
                onClick={() => setViewBill(null)}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              {[
                ["Bill date", fmtDate(viewBill.billDate)],
                ["Due date", fmtDate(viewBill.dueDate)],
                ["Total", fmtINR(viewBill.totalAmount)],
                ["Paid", fmtINR(viewBill.paidAmount)],
                ["Outstanding", fmtINR(viewBill.outstandingAmount)],
                ["Status", viewBill.status],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-1 font-medium">{value}</p>
                </div>
              ))}
            </div>
            <h3 className="mt-5 text-sm font-semibold">Recorded payments</h3>
            <div className="mt-2 max-h-48 overflow-auto divide-y">
              {(data?.billPayments ?? [])
                .filter((payment) => payment.purchase_bill_id === viewBill.id)
                .map((payment) => (
                  <div key={payment.id} className="flex justify-between py-2 text-sm">
                    <span>
                      {fmtDate(payment.payment_date)} · {payment.payment_method}
                    </span>
                    <span className="font-medium">{fmtINR(payment.amount)}</span>
                  </div>
                ))}
              {!(data?.billPayments ?? []).some(
                (payment) => payment.purchase_bill_id === viewBill.id,
              ) && <p className="py-3 text-sm text-muted-foreground">No payments recorded yet.</p>}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <SecondaryButton onClick={() => setViewBill(null)}>Close</SecondaryButton>
              {viewBill.outstandingAmount > 0 && (
                <PrimaryButton
                  onClick={() => {
                    setPayDialog(viewBill);
                    setViewBill(null);
                  }}
                >
                  Record Payment
                </PrimaryButton>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
