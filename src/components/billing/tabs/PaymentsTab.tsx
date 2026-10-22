// ── Payments Tab ──────────────────────────────────────────────────
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  IndianRupee,
  Clock,
  RefreshCcw,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Plus,
  BarChart2,
  Percent,
  XCircle,
  Download,
  Pencil,
  Trash2,
  Eye,
  Loader2,
  RotateCcw,
  Ban,
} from "lucide-react";
import { toast } from "sonner";
import {
  fmtINR,
  fmtDate,
  paymentModeLabels,
  type PaymentTxn,
  type PaymentTxnStatus,
  type PaymentMode,
} from "@/lib/billing-data";
import {
  SectionCard,
  StatTile,
  SearchInput,
  Select,
  Pagination,
  EmptyState,
  BillingStatusPill,
  PaymentModeBadge,
  ModalShell,
  PrimaryButton,
} from "@/components/billing/shared";
import { useBusiness } from "@/contexts/BusinessContext";
import { useCustomers } from "@/hooks/useCustomersQuery";
import { useInvoices } from "@/hooks/useInvoicesQuery";
import {
  usePayments,
  useCreatePayment,
  useUpdatePayment,
  useDeletePayment,
  useRefundPayment,
  useVoidPayment,
} from "@/hooks/usePaymentsQuery";
import type { Customer } from "@/services/customers";
import type { Invoice } from "@/lib/billing-data";

const PAGE_SIZE = 8;

// ── Sub-tab type ───────────────────────────────────────────────────
type SubTab = "all" | "pending" | "received" | "refunded" | "timeline";

// ── All payment modes ──────────────────────────────────────────────
const ALL_MODES: PaymentMode[] = [
  "cash",
  "upi",
  "card",
  "bank-transfer",
  "neft",
  "rtgs",
  "credit",
  "wallet",
  "cheque",
];

// ── Status helpers ────────────────────────────────────────────────
function statusIcon(status: PaymentTxnStatus) {
  if (status === "received" || status === "completed") return <CheckCircle2 className="h-4 w-4" />;
  if (status === "refunded") return <RefreshCcw className="h-4 w-4" />;
  if (status === "cancelled" || status === "voided") return <XCircle className="h-4 w-4" />;
  return <AlertCircle className="h-4 w-4" />;
}

function statusBg(status: PaymentTxnStatus) {
  if (status === "received" || status === "completed") return "bg-emerald-50 text-emerald-600";
  if (status === "refunded") return "bg-cyan-50 text-cyan-600";
  if (status === "cancelled" || status === "voided") return "bg-slate-100 text-slate-500";
  return "bg-amber-50 text-amber-600";
}

// ── Grand total helper (from UI Invoice type) ──────────────────────
function invoiceOutstanding(inv: Invoice): number {
  const grandTotal = inv.items.reduce((s, item) => {
    const line = item.quantity * item.unitPrice * (1 - item.discountPercent / 100);
    return s + line * (1 + item.gstPercent / 100);
  }, 0);
  return Math.max(0, grandTotal - inv.amountPaid);
}

function invoiceGrandTotalCalc(inv: Invoice): number {
  return inv.items.reduce((s, item) => {
    const line = item.quantity * item.unitPrice * (1 - item.discountPercent / 100);
    return s + line * (1 + item.gstPercent / 100);
  }, 0);
}

// ── Export helpers ────────────────────────────────────────────────
function exportCSV(rows: PaymentTxn[], filename = "payments.csv") {
  const headers = [
    "Payment #",
    "Invoice",
    "Customer",
    "Amount",
    "Mode",
    "Status",
    "Date",
    "Ref",
    "Notes",
  ];
  const lines = [
    headers.join(","),
    ...rows.map((p) =>
      [
        p.paymentNumber,
        p.invoiceNumber ?? p.invoiceId,
        `"${p.customerName ?? p.customerId}"`,
        p.amount,
        paymentModeLabels[p.mode] ?? p.mode,
        p.status,
        p.date,
        p.transactionRef ?? "",
        `"${p.notes}"`,
      ].join(","),
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportExcel(rows: PaymentTxn[]) {
  const headers = [
    "Payment #",
    "Invoice",
    "Customer",
    "Amount",
    "Mode",
    "Status",
    "Date",
    "Ref",
    "Notes",
  ];
  const lines = [
    headers.join("\t"),
    ...rows.map((p) =>
      [
        p.paymentNumber,
        p.invoiceNumber ?? p.invoiceId,
        p.customerName ?? p.customerId,
        p.amount,
        paymentModeLabels[p.mode] ?? p.mode,
        p.status,
        p.date,
        p.transactionRef ?? "",
        p.notes,
      ].join("\t"),
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "payments.xls";
  a.click();
  URL.revokeObjectURL(url);
}

// ── Payment Table ──────────────────────────────────────────────────
function PaymentTable({
  rows,
  page,
  totalPages,
  onPageChange,
  emptyTitle,
  emptySubtitle,
  onRefund,
  onVoid,
  onDelete,
  onEdit,
  onPreview,
  isMutating,
}: {
  rows: PaymentTxn[];
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  emptyTitle: string;
  emptySubtitle?: string;
  onRefund: (p: PaymentTxn) => void;
  onVoid: (p: PaymentTxn) => void;
  onDelete: (p: PaymentTxn) => void;
  onEdit: (p: PaymentTxn) => void;
  onPreview: (p: PaymentTxn) => void;
  isMutating: boolean;
}) {
  const paginated = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const btnCls =
    "flex h-7 w-7 items-center justify-center rounded-lg transition-colors disabled:opacity-40";

  if (rows.length === 0) {
    return <EmptyState icon={CreditCard} title={emptyTitle} subtitle={emptySubtitle} />;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                Payment #
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Invoice
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Customer
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Mode
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Date / Time
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((pay, i) => {
              const canRefundVoid = pay.status === "received" || pay.status === "completed";
              return (
                <motion.tr
                  key={pay.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.25 }}
                  className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors"
                >
                  <td className="px-6 py-3 text-sm font-mono font-medium text-foreground whitespace-nowrap">
                    {pay.paymentNumber}
                  </td>
                  <td className="px-4 py-3 text-sm text-blue-600 whitespace-nowrap">
                    {pay.invoiceNumber ?? pay.invoiceId}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-foreground whitespace-nowrap">
                      {pay.customerName ?? pay.customerId}
                    </p>
                    {pay.customerCity && (
                      <p className="text-xs text-muted-foreground">{pay.customerCity}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-foreground whitespace-nowrap">
                    {fmtINR(pay.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <PaymentModeBadge mode={pay.mode as PaymentMode} />
                  </td>
                  <td className="px-4 py-3">
                    <BillingStatusPill status={pay.status} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="text-sm text-foreground">{fmtDate(pay.date)}</p>
                    <p className="text-xs text-muted-foreground">{pay.time}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onPreview(pay)}
                        className={`${btnCls} text-slate-400 hover:bg-slate-100 hover:text-slate-600`}
                        title="Preview"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onEdit(pay)}
                        className={`${btnCls} text-slate-400 hover:bg-slate-100 hover:text-slate-600`}
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {canRefundVoid && (
                        <>
                          <button
                            onClick={() => onRefund(pay)}
                            disabled={isMutating}
                            className={`${btnCls} text-cyan-500 hover:bg-cyan-50`}
                            title="Refund"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => onVoid(pay)}
                            disabled={isMutating}
                            className={`${btnCls} text-orange-500 hover:bg-orange-50`}
                            title="Void"
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => onDelete(pay)}
                        disabled={isMutating}
                        className={`${btnCls} text-slate-400 hover:bg-red-50 hover:text-red-600`}
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} onChange={onPageChange} />
    </>
  );
}

// ── Transaction Timeline ───────────────────────────────────────────
function TransactionTimeline({ payments }: { payments: PaymentTxn[] }) {
  const sorted = [...payments].sort((a, b) => {
    const da = new Date(`${a.date}T00:00:00`).getTime();
    const db = new Date(`${b.date}T00:00:00`).getTime();
    return db !== da ? db - da : a.time > b.time ? -1 : 1;
  });

  if (sorted.length === 0) {
    return <EmptyState icon={Clock} title="No transactions yet" />;
  }

  return (
    <div className="space-y-0">
      {sorted.map((pay, i) => {
        const isLast = i === sorted.length - 1;
        return (
          <motion.div
            key={pay.id}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04, duration: 0.28 }}
            className="flex items-start gap-4"
          >
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${statusBg(pay.status)}`}
              >
                {statusIcon(pay.status)}
              </div>
              {!isLast && (
                <div className="mt-1 w-px flex-1 bg-slate-200" style={{ minHeight: 24 }} />
              )}
            </div>
            <div className="flex-1 min-w-0 pb-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {pay.paymentNumber}
                    {pay.notes && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        · {pay.notes}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {pay.invoiceNumber ?? pay.invoiceId} · {pay.customerName ?? pay.customerId}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-foreground">{fmtINR(pay.amount)}</p>
                  <p className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {fmtDate(pay.date)} {pay.time}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <BillingStatusPill status={pay.status} />
                <PaymentModeBadge mode={pay.mode as PaymentMode} />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Record Payment Modal ───────────────────────────────────────────
function RecordPaymentModal({
  open,
  onClose,
  onRecord,
  dbCustomers,
  dbInvoices,
  isSaving,
}: {
  open: boolean;
  onClose: () => void;
  onRecord: (input: {
    invoiceId: string;
    customerId: string;
    amount: number;
    mode: PaymentMode;
    date: string;
    transactionRef?: string;
    notes?: string;
    currency?: string;
  }) => void;
  dbCustomers: Customer[];
  dbInvoices: Invoice[];
  isSaving: boolean;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [customerId, setCustomerId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<PaymentMode>("cash");
  const [date, setDate] = useState(today);
  const [ref, setRef] = useState("");
  const [notes, setNotes] = useState("");
  const [currency, setCurrency] = useState("INR");

  // Filter invoices: for selected customer, show only unpaid/partial
  const customerInvoices = useMemo(
    () =>
      customerId
        ? dbInvoices.filter(
            (inv) =>
              inv.customerId === customerId &&
              (inv.paymentStatus === "pending" || inv.paymentStatus === "partial"),
          )
        : [],
    [customerId, dbInvoices],
  );

  const outstanding = invoiceId
    ? (() => {
        const inv = dbInvoices.find((i) => i.id === invoiceId);
        return inv ? invoiceOutstanding(inv) : 0;
      })()
    : 0;

  function validate(): string | null {
    if (!customerId) return "Please select a customer.";
    if (!invoiceId) return "Please select an invoice.";
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) return "Amount must be greater than zero.";
    if (amt > outstanding + 0.01)
      return `Amount cannot exceed outstanding balance of ${fmtINR(outstanding)}.`;
    return null;
  }

  function handleSubmit() {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    onRecord({
      invoiceId,
      customerId,
      amount: parseFloat(amount),
      mode,
      date,
      transactionRef: ref || undefined,
      notes: notes || undefined,
      currency,
    });
  }

  function reset() {
    setCustomerId("");
    setInvoiceId("");
    setAmount("");
    setMode("cash");
    setDate(today);
    setRef("");
    setNotes("");
    setCurrency("INR");
  }

  // Reset when modal opens
  useMemo(() => {
    if (open) reset();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const labelCls = "block text-xs font-semibold text-slate-600 mb-1";
  const inputCls =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-electric)] focus:border-transparent transition";

  return (
    <ModalShell open={open} onClose={onClose} title="Record Payment">
      <div className="space-y-4">
        {/* Customer */}
        <div>
          <label className={labelCls}>Customer *</label>
          <select
            className={inputCls}
            value={customerId}
            onChange={(e) => {
              setCustomerId(e.target.value);
              setInvoiceId("");
              setAmount("");
            }}
          >
            <option value="">Select customer…</option>
            {dbCustomers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Invoice */}
        <div>
          <label className={labelCls}>Invoice *</label>
          <select
            className={inputCls}
            value={invoiceId}
            onChange={(e) => {
              setInvoiceId(e.target.value);
              const inv = dbInvoices.find((i) => i.id === e.target.value);
              if (inv) setAmount(String(Math.round(invoiceOutstanding(inv))));
            }}
            disabled={!customerId}
          >
            <option value="">{customerId ? "Select invoice…" : "Select a customer first"}</option>
            {customerInvoices.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {inv.invoiceNumber} — Outstanding: {fmtINR(Math.round(invoiceOutstanding(inv)))}
              </option>
            ))}
          </select>
          {invoiceId && outstanding > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              Outstanding balance:{" "}
              <span className="font-semibold text-foreground">
                {fmtINR(Math.round(outstanding))}
              </span>
            </p>
          )}
          {invoiceId && outstanding === 0 && (
            <p className="mt-1 text-xs text-amber-600">This invoice is fully paid.</p>
          )}
        </div>

        {/* Amount + Mode row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Amount (₹) *</label>
            <input
              type="number"
              className={inputCls}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              min={0}
              max={outstanding}
            />
          </div>
          <div>
            <label className={labelCls}>Payment Mode *</label>
            <select
              className={inputCls}
              value={mode}
              onChange={(e) => setMode(e.target.value as PaymentMode)}
            >
              {ALL_MODES.map((m) => (
                <option key={m} value={m}>
                  {paymentModeLabels[m]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date + Ref row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Payment Date *</label>
            <input
              type="date"
              className={inputCls}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Transaction Reference</label>
            <input
              type="text"
              className={inputCls}
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>

        {/* Currency + Notes */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Currency</label>
            <select
              className={inputCls}
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="INR">INR — ₹</option>
              <option value="USD">USD — $</option>
              <option value="EUR">EUR — €</option>
              <option value="GBP">GBP — £</option>
              <option value="AED">AED — د.إ</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <input
              type="text"
              className={inputCls}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes…"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-[image:var(--gradient-brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Record Payment"
            )}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ── Edit Payment Modal ─────────────────────────────────────────────
function EditPaymentModal({
  open,
  onClose,
  payment,
  onSave,
  isSaving,
}: {
  open: boolean;
  onClose: () => void;
  payment: PaymentTxn;
  onSave: (input: {
    mode: PaymentMode;
    date: string;
    transactionRef?: string;
    notes?: string;
  }) => void;
  isSaving: boolean;
}) {
  const [mode, setMode] = useState<PaymentMode>(payment.mode);
  const [date, setDate] = useState(payment.date);
  const [ref, setRef] = useState(payment.transactionRef ?? "");
  const [notes, setNotes] = useState(payment.notes);

  const labelCls = "block text-xs font-semibold text-slate-600 mb-1";
  const inputCls =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-electric)] focus:border-transparent transition";

  return (
    <ModalShell open={open} onClose={onClose} title="Edit Payment">
      <div className="space-y-4">
        <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
          <p className="font-semibold text-foreground">{payment.paymentNumber}</p>
          <p className="text-xs text-muted-foreground">
            {payment.invoiceNumber ?? payment.invoiceId} ·{" "}
            {payment.customerName ?? payment.customerId} · {fmtINR(payment.amount)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Payment Mode</label>
            <select
              className={inputCls}
              value={mode}
              onChange={(e) => setMode(e.target.value as PaymentMode)}
            >
              {ALL_MODES.map((m) => (
                <option key={m} value={m}>
                  {paymentModeLabels[m]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Payment Date</label>
            <input
              type="date"
              className={inputCls}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Transaction Reference</label>
          <input
            type="text"
            className={inputCls}
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            placeholder="Optional"
          />
        </div>

        <div>
          <label className={labelCls}>Notes</label>
          <textarea
            className={`${inputCls} resize-none`}
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes…"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              onSave({ mode, date, transactionRef: ref || undefined, notes: notes || undefined })
            }
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-[image:var(--gradient-brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ── Preview Modal ──────────────────────────────────────────────────
function PreviewModal({
  open,
  onClose,
  payment,
}: {
  open: boolean;
  onClose: () => void;
  payment: PaymentTxn;
}) {
  const labelCls = "text-xs text-muted-foreground";
  const valueCls = "text-sm font-semibold text-foreground";
  const row = (label: string, value: string | undefined) =>
    value ? (
      <div key={label}>
        <p className={labelCls}>{label}</p>
        <p className={valueCls}>{value}</p>
      </div>
    ) : null;

  return (
    <ModalShell open={open} onClose={onClose} title="Payment Details">
      <div className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 rounded-xl bg-slate-50 p-4">
          {row("Payment Number", payment.paymentNumber)}
          {row("Invoice", payment.invoiceNumber ?? payment.invoiceId)}
          {row("Customer", payment.customerName ?? payment.customerId)}
          {row("Amount", fmtINR(payment.amount))}
          {row("Currency", payment.currency ?? "INR")}
          {row("Mode", paymentModeLabels[payment.mode] ?? payment.mode)}
          {row("Date", fmtDate(payment.date))}
          {row("Time", payment.time)}
          <div>
            <p className={labelCls}>Status</p>
            <BillingStatusPill status={payment.status} />
          </div>
          {row("Reference", payment.transactionRef)}
          {row("Notes", payment.notes || undefined)}
        </div>
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ── Payment Method Analytics Card ─────────────────────────────────
function PaymentMethodBreakdown({ payments }: { payments: PaymentTxn[] }) {
  const breakdown = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    for (const p of payments) {
      if (!map[p.mode]) map[p.mode] = { count: 0, total: 0 };
      map[p.mode].count += 1;
      map[p.mode].total += p.amount;
    }
    return Object.entries(map)
      .map(([mode, data]) => ({ mode: mode as PaymentMode, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [payments]);

  const maxTotal = breakdown.reduce((m, b) => Math.max(m, b.total), 0);
  if (breakdown.length === 0) return null;

  return (
    <SectionCard>
      <div className="mb-4 flex items-center gap-2">
        <BarChart2 className="h-4 w-4 text-violet-500" />
        <h3 className="text-sm font-semibold text-foreground">Payment Method Breakdown</h3>
        <span className="ml-auto text-xs text-muted-foreground">
          {payments.length} transactions
        </span>
      </div>
      <div className="space-y-3">
        {breakdown.map((b) => {
          const pct = maxTotal > 0 ? (b.total / maxTotal) * 100 : 0;
          return (
            <div key={b.mode} className="flex items-center gap-3">
              <div className="w-28 shrink-0">
                <PaymentModeBadge mode={b.mode} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">
                    {b.count} txn{b.count !== 1 ? "s" : ""}
                  </span>
                  <span className="text-xs font-semibold text-foreground">{fmtINR(b.total)}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-[image:var(--gradient-brand)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

// ── Loading skeleton ───────────────────────────────────────────────
function TableSkeleton() {
  return (
    <div className="space-y-3 p-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-12 w-full animate-pulse rounded-xl bg-slate-100" />
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────
export function PaymentsTab() {
  const { business } = useBusiness();
  const businessId = business?.id ?? null;

  const paymentsQuery = usePayments(businessId);
  const { data: dbCustomers = [] } = useCustomers(businessId);
  const invoicesQuery = useInvoices(businessId);
  const dbInvoices = invoicesQuery.data ?? [];

  const createMutation = useCreatePayment(businessId);
  const updateMutation = useUpdatePayment(businessId);
  const deleteMutation = useDeletePayment(businessId);
  const refundMutation = useRefundPayment(businessId);
  const voidMutation = useVoidPayment(businessId);

  const payments = useMemo(() => paymentsQuery.data ?? [], [paymentsQuery.data]);

  // ── UI state ──────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("all");
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("all");
  const [page, setPage] = useState(1);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [editTarget, setEditTarget] = useState<PaymentTxn | null>(null);
  const [previewTarget, setPreviewTarget] = useState<PaymentTxn | null>(null);

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    refundMutation.isPending ||
    voidMutation.isPending;

  // ── Stats ─────────────────────────────────────────────────────
  const receivedPayments = payments.filter(
    (p) => p.status === "received" || p.status === "completed",
  );
  const totalReceived = receivedPayments.reduce((s, p) => s + p.amount, 0);
  const receivedCount = receivedPayments.length;
  const totalPending = payments
    .filter((p) => p.status === "pending")
    .reduce((s, p) => s + p.amount, 0);
  const totalRefunded = payments
    .filter((p) => p.status === "refunded")
    .reduce((s, p) => s + p.amount, 0);
  const totalCount = payments.length;
  const avgPayment = receivedCount > 0 ? totalReceived / receivedCount : 0;
  const collectionDenominator = totalReceived + totalPending;
  const collectionPct =
    collectionDenominator > 0 ? ((totalReceived / collectionDenominator) * 100).toFixed(0) : "0";

  // ── Filter ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return payments.filter((p) => {
      const matchSearch =
        p.paymentNumber.toLowerCase().includes(q) ||
        (p.invoiceNumber ?? "").toLowerCase().includes(q) ||
        (p.customerName ?? "").toLowerCase().includes(q) ||
        (p.transactionRef ?? "").toLowerCase().includes(q) ||
        p.notes.toLowerCase().includes(q);
      const matchMode = modeFilter === "all" || p.mode === modeFilter;
      return matchSearch && matchMode;
    });
  }, [payments, search, modeFilter]);

  const byStatus = (status: PaymentTxnStatus) => filtered.filter((p) => p.status === status);
  const pendingRows = byStatus("pending");
  const receivedRows = [...byStatus("received"), ...byStatus("completed")];
  const refundedRows = byStatus("refunded");

  const allTotalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pendingTotalPages = Math.max(1, Math.ceil(pendingRows.length / PAGE_SIZE));
  const receivedTotalPages = Math.max(1, Math.ceil(receivedRows.length / PAGE_SIZE));
  const refundedTotalPages = Math.max(1, Math.ceil(refundedRows.length / PAGE_SIZE));

  const subTabs: { id: SubTab; label: string; count?: number }[] = [
    { id: "all", label: "Payment History", count: payments.length },
    { id: "pending", label: "Pending", count: pendingRows.length },
    { id: "received", label: "Received", count: receivedRows.length },
    { id: "refunded", label: "Refunds", count: refundedRows.length },
    { id: "timeline", label: "Transaction Timeline" },
  ];

  const exportRows =
    activeSubTab === "pending"
      ? pendingRows
      : activeSubTab === "received"
        ? receivedRows
        : activeSubTab === "refunded"
          ? refundedRows
          : filtered;

  // ── Handlers ──────────────────────────────────────────────────
  const handleRecord = (input: Parameters<typeof createMutation.mutate>[0]) => {
    createMutation.mutate(input, {
      onSuccess: () => {
        toast.success("Payment recorded successfully.");
        setShowRecordModal(false);
        setPage(1);
      },
      onError: (e: unknown) => toast.error((e as Error).message ?? "Failed to record payment."),
    });
  };

  const handleEdit = (input: {
    mode: PaymentMode;
    date: string;
    transactionRef?: string;
    notes?: string;
  }) => {
    if (!editTarget) return;
    updateMutation.mutate(
      { id: editTarget.id, input },
      {
        onSuccess: () => {
          toast.success("Payment updated.");
          setEditTarget(null);
        },
        onError: (e: unknown) => toast.error((e as Error).message ?? "Failed to update."),
      },
    );
  };

  const handleDelete = (pay: PaymentTxn) => {
    if (
      !window.confirm(`Delete payment ${pay.paymentNumber}? This will reverse the invoice balance.`)
    )
      return;
    deleteMutation.mutate(
      { id: pay.id },
      {
        onSuccess: () => toast.success("Payment deleted."),
        onError: (e: unknown) => toast.error((e as Error).message ?? "Failed to delete."),
      },
    );
  };

  const handleRefund = (pay: PaymentTxn) => {
    if (
      !window.confirm(
        `Refund payment ${pay.paymentNumber} of ${fmtINR(pay.amount)}? This will reduce the invoice's paid amount.`,
      )
    )
      return;
    refundMutation.mutate(
      { id: pay.id },
      {
        onSuccess: () => toast.success("Payment refunded."),
        onError: (e: unknown) => toast.error((e as Error).message ?? "Failed to refund."),
      },
    );
  };

  const handleVoid = (pay: PaymentTxn) => {
    if (
      !window.confirm(`Void payment ${pay.paymentNumber}? This will reverse the invoice balance.`)
    )
      return;
    voidMutation.mutate(
      { id: pay.id },
      {
        onSuccess: () => toast.success("Payment voided."),
        onError: (e: unknown) => toast.error((e as Error).message ?? "Failed to void."),
      },
    );
  };

  const tableProps = {
    onRefund: handleRefund,
    onVoid: handleVoid,
    onDelete: handleDelete,
    onEdit: setEditTarget,
    onPreview: setPreviewTarget,
    isMutating,
  };

  return (
    <div className="space-y-6">
      {/* Stat Strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile
          label="Total Received"
          value={fmtINR(totalReceived)}
          icon={CheckCircle2}
          bg="bg-emerald-50"
          iconColor="text-emerald-600"
          index={0}
        />
        <StatTile
          label="Pending"
          value={fmtINR(totalPending)}
          icon={Clock}
          bg="bg-amber-50"
          iconColor="text-amber-600"
          index={1}
        />
        <StatTile
          label="Refunded"
          value={fmtINR(totalRefunded)}
          icon={RefreshCcw}
          bg="bg-cyan-50"
          iconColor="text-cyan-600"
          index={2}
        />
        <StatTile
          label="Transactions"
          value={String(totalCount)}
          icon={IndianRupee}
          bg="bg-blue-50"
          iconColor="text-blue-600"
          index={3}
        />
        <StatTile
          label="Avg Payment"
          value={fmtINR(Math.round(avgPayment))}
          icon={BarChart2}
          bg="bg-purple-50"
          iconColor="text-purple-600"
          index={4}
        />
        <StatTile
          label="Collection %"
          value={`${collectionPct}%`}
          icon={Percent}
          bg="bg-sky-50"
          iconColor="text-sky-600"
          index={5}
        />
      </div>

      {/* Main Card */}
      <SectionCard noPadding>
        {/* Sub-tab header */}
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 px-6 py-3">
          {subTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id);
                setPage(1);
              }}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeSubTab === tab.id
                  ? "bg-[image:var(--gradient-brand)] text-white shadow-sm"
                  : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${activeSubTab === tab.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <PrimaryButton onClick={() => setShowRecordModal(true)} icon={Plus}>
              Record Payment
            </PrimaryButton>
          </div>
        </div>

        {/* Toolbar */}
        {activeSubTab !== "timeline" && (
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-6 py-3">
            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="Search payments…"
              className="w-48"
            />
            <Select
              value={modeFilter}
              onChange={(v) => {
                setModeFilter(v);
                setPage(1);
              }}
              options={[
                { value: "all", label: "All Modes" },
                { value: "cash", label: "Cash" },
                { value: "upi", label: "UPI" },
                { value: "card", label: "Card" },
                { value: "bank-transfer", label: "Bank Transfer" },
                { value: "neft", label: "NEFT" },
                { value: "rtgs", label: "RTGS" },
                { value: "cheque", label: "Cheque" },
                { value: "credit", label: "Credit" },
                { value: "wallet", label: "Wallet" },
              ]}
            />
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => exportCSV(exportRows)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </button>
              <button
                onClick={() => exportExcel(exportRows)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Export Excel
              </button>
            </div>
          </div>
        )}

        {/* Sub-tab content */}
        {paymentsQuery.isLoading ? (
          <TableSkeleton />
        ) : (
          <>
            {activeSubTab === "all" && (
              <PaymentTable
                rows={filtered}
                page={page}
                totalPages={allTotalPages}
                onPageChange={setPage}
                emptyTitle="No payments found"
                emptySubtitle="Try adjusting your search or mode filter."
                {...tableProps}
              />
            )}
            {activeSubTab === "pending" && (
              <PaymentTable
                rows={pendingRows}
                page={page}
                totalPages={pendingTotalPages}
                onPageChange={setPage}
                emptyTitle="No pending payments"
                emptySubtitle="All payments have been settled."
                {...tableProps}
              />
            )}
            {activeSubTab === "received" && (
              <PaymentTable
                rows={receivedRows}
                page={page}
                totalPages={receivedTotalPages}
                onPageChange={setPage}
                emptyTitle="No received payments"
                {...tableProps}
              />
            )}
            {activeSubTab === "refunded" && (
              <PaymentTable
                rows={refundedRows}
                page={page}
                totalPages={refundedTotalPages}
                onPageChange={setPage}
                emptyTitle="No refunds found"
                emptySubtitle="No refunded transactions recorded yet."
                {...tableProps}
              />
            )}
            {activeSubTab === "timeline" && (
              <div className="p-6">
                <p className="mb-6 text-xs text-muted-foreground">
                  All transactions sorted by date · most recent first
                </p>
                <TransactionTimeline payments={payments} />
              </div>
            )}
          </>
        )}
      </SectionCard>

      {/* Payment Method Breakdown */}
      <PaymentMethodBreakdown payments={payments} />

      {/* Modals */}
      <RecordPaymentModal
        open={showRecordModal}
        onClose={() => setShowRecordModal(false)}
        onRecord={handleRecord}
        dbCustomers={dbCustomers}
        dbInvoices={dbInvoices}
        isSaving={createMutation.isPending}
      />

      {editTarget && (
        <EditPaymentModal
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          payment={editTarget}
          onSave={handleEdit}
          isSaving={updateMutation.isPending}
        />
      )}

      {previewTarget && (
        <PreviewModal
          open={!!previewTarget}
          onClose={() => setPreviewTarget(null)}
          payment={previewTarget}
        />
      )}
    </div>
  );
}
