// ── Credit Notes Tab ──────────────────────────────────────────────
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  FileX,
  ReceiptText,
  TrendingDown,
  RefreshCcw,
  Eye,
  Pencil,
  Trash2,
  Printer,
  Mail,
  Copy,
  Ban,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  fmtINR,
  fmtDate,
  type CreditNote,
  type CreditNoteItem,
  type CreditNoteStatus,
} from "@/lib/billing-data";
import {
  SectionCard,
  StatTile,
  SearchInput,
  Select,
  Pagination,
  PrimaryButton,
  SecondaryButton,
  EmptyState,
  BillingStatusPill,
  ModalShell,
} from "@/components/billing/shared";
import { useBusiness } from "@/contexts/BusinessContext";
import { useInvoices } from "@/hooks/useInvoicesQuery";
import { useCustomers } from "@/hooks/useCustomersQuery";
import { useProducts } from "@/hooks/useProductsQuery";
import {
  useCreditNotes,
  useCreateCreditNote,
  useUpdateCreditNote,
  useDeleteCreditNote,
  useVoidCreditNote,
  useDuplicateCreditNote,
} from "@/hooks/useCreditNotesQuery";
import { computeCNTotals } from "@/services/creditNotes";

// ── Constants ──────────────────────────────────────────────────────

const PAGE_SIZE = 8;

type InvoiceForCreditNoteForm = {
  id: string;
  invoiceNumber: string;
  customerId: string;
  items: CreditNoteItem[];
};

const EMPTY_ITEM = (): CreditNoteItem => ({
  productId: "",
  productName: "",
  quantity: 1,
  unitPrice: 0,
  discountPercent: 0,
  gstPercent: 18,
});

// ── Types ──────────────────────────────────────────────────────────

interface CNFormState {
  invoiceId: string;
  customerId: string;
  creditNoteDate: string;
  reason: string;
  notes: string;
  items: CreditNoteItem[];
  status: CreditNoteStatus;
}

const emptyForm = (): CNFormState => ({
  invoiceId: "",
  customerId: "",
  creditNoteDate: new Date().toISOString().slice(0, 10),
  reason: "",
  notes: "",
  items: [EMPTY_ITEM()],
  status: "draft",
});

// ── Line Item Row ──────────────────────────────────────────────────

function LineItemRow({
  item,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  item: CreditNoteItem;
  index: number;
  onChange: (idx: number, field: keyof CreditNoteItem, val: string | number) => void;
  onRemove: (idx: number) => void;
  canRemove: boolean;
}) {
  const lineBase = item.quantity * item.unitPrice * (1 - item.discountPercent / 100);
  const lineTotal = lineBase + lineBase * (item.gstPercent / 100);

  return (
    <tr className="border-b border-slate-100">
      <td className="py-2 pr-2">
        <input
          value={item.productName}
          onChange={(e) => onChange(index, "productName", e.target.value)}
          placeholder="Product name"
          className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
        />
      </td>
      <td className="py-2 pr-2 w-20">
        <input
          type="number"
          min="0.001"
          step="0.001"
          value={item.quantity}
          onChange={(e) => onChange(index, "quantity", parseFloat(e.target.value) || 0)}
          className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-right outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
        />
      </td>
      <td className="py-2 pr-2 w-24">
        <input
          type="number"
          min="0"
          step="0.01"
          value={item.unitPrice}
          onChange={(e) => onChange(index, "unitPrice", parseFloat(e.target.value) || 0)}
          className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-right outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
        />
      </td>
      <td className="py-2 pr-2 w-16">
        <input
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={item.discountPercent}
          onChange={(e) => onChange(index, "discountPercent", parseFloat(e.target.value) || 0)}
          className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-right outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
        />
      </td>
      <td className="py-2 pr-2 w-16">
        <input
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={item.gstPercent}
          onChange={(e) => onChange(index, "gstPercent", parseFloat(e.target.value) || 0)}
          className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-right outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
        />
      </td>
      <td className="py-2 pr-2 w-24 text-right text-xs font-medium text-foreground">
        {fmtINR(lineTotal)}
      </td>
      <td className="py-2 w-8 text-center">
        {canRemove && (
          <button
            onClick={() => onRemove(index)}
            className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors mx-auto"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </td>
    </tr>
  );
}

// ── CN Form Modal ──────────────────────────────────────────────────

function CNFormModal({
  open,
  onClose,
  title,
  initial,
  onSave,
  invoices,
  customers,
  products,
  isSaving,
  editingStatus,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  initial?: CNFormState;
  onSave: (f: CNFormState) => void;
  invoices: InvoiceForCreditNoteForm[];
  customers: { id: string; name: string; city?: string | null }[];
  products: { id: string; name: string; selling_price: number; gst_percent?: number }[];
  isSaving: boolean;
  editingStatus?: CreditNoteStatus;
}) {
  const [form, setForm] = useState<CNFormState>(initial ?? emptyForm());

  const set = <K extends keyof CNFormState>(k: K, v: CNFormState[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleInvoiceChange = (id: string) => {
    const inv = invoices.find((i) => i.id === id);
    if (!inv) {
      setForm((p) => ({ ...p, invoiceId: id, customerId: "" }));
      return;
    }
    // Auto-fill customer and items from invoice
    setForm((p) => ({
      ...p,
      invoiceId: id,
      customerId: inv.customerId ?? "",
      items: inv.items.length > 0 ? inv.items : [EMPTY_ITEM()],
    }));
  };

  const handleItemChange = (
    idx: number,
    field: keyof CreditNoteItem,
    val: string | number
  ) => {
    setForm((p) => {
      const items = [...p.items];
      items[idx] = { ...items[idx], [field]: val };
      return { ...p, items };
    });
  };

  const handleAddItem = () =>
    setForm((p) => ({ ...p, items: [...p.items, EMPTY_ITEM()] }));

  const handleRemoveItem = (idx: number) =>
    setForm((p) => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));

  const handleSave = () => {
    if (!form.invoiceId && !form.customerId) {
      toast.error("Please select a linked invoice.");
      return;
    }
    if (!form.reason.trim()) {
      toast.error("Please provide a reason for the credit note.");
      return;
    }
    const invalidItem = form.items.find(
      (it) => !it.productName.trim() || it.quantity <= 0
    );
    if (invalidItem) {
      toast.error("All line items must have a product name and quantity > 0.");
      return;
    }
    onSave(form);
  };

  const totals = computeCNTotals(form.items);
  const customer = customers.find((c) => c.id === form.customerId);

  // Only allow status edit if editing an existing note
  const showStatusField = !!editingStatus;

  return (
    <ModalShell open={open} onClose={onClose} title={title}>
      <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">

        {/* Invoice */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Linked Invoice</label>
          <select
            value={form.invoiceId}
            onChange={(e) => handleInvoiceChange(e.target.value)}
            className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
          >
            <option value="">Select invoice…</option>
            {invoices.map((inv) => {
              const cust = customers.find((c) => c.id === inv.customerId);
              return (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber}
                  {cust ? ` — ${cust.name}` : ""}
                </option>
              );
            })}
          </select>
        </div>

        {/* Customer (auto-filled) */}
        {customer && (
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-xs text-muted-foreground">Customer</p>
            <p className="text-sm font-semibold text-foreground">{customer.name}</p>
            {customer.city && (
              <p className="text-xs text-muted-foreground">{customer.city}</p>
            )}
          </div>
        )}

        {/* Credit Note Date */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Credit Note Date</label>
          <input
            type="date"
            value={form.creditNoteDate}
            onChange={(e) => set("creditNoteDate", e.target.value)}
            className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
          />
        </div>

        {/* Reason */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Reason</label>
          <textarea
            rows={2}
            value={form.reason}
            onChange={(e) => set("reason", e.target.value)}
            placeholder="e.g. Products returned due to damage"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)] resize-none"
          />
        </div>

        {/* Line Items */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Products Returned</label>
            <button
              onClick={handleAddItem}
              className="text-xs text-[color:var(--brand-electric)] hover:underline font-medium"
            >
              + Add Item
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Product</th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-muted-foreground w-20">Qty</th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-muted-foreground w-24">Unit Price</th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-muted-foreground w-16">Disc %</th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-muted-foreground w-16">GST %</th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-muted-foreground w-24">Total</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="px-3">
                {form.items.map((item, idx) => (
                  <LineItemRow
                    key={idx}
                    item={item}
                    index={idx}
                    onChange={handleItemChange}
                    onRemove={handleRemoveItem}
                    canRemove={form.items.length > 1}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="space-y-1 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Subtotal (pre-tax)</span>
              <span>{fmtINR(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Discount</span>
              <span>−{fmtINR(totals.discountTotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Tax (GST)</span>
              <span>{fmtINR(totals.taxTotal)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-foreground border-t border-slate-200 mt-1 pt-1">
              <span>Grand Total</span>
              <span>{fmtINR(totals.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Notes</label>
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Optional internal notes…"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)] resize-none"
          />
        </div>

        {/* Status (edit mode only) */}
        {showStatusField && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Status</label>
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value as CreditNoteStatus)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
            >
              <option value="draft">Draft</option>
              <option value="issued">Issued</option>
              <option value="applied">Applied</option>
              <option value="voided">Voided</option>
            </select>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving…
              </span>
            ) : (
              "Save Credit Note"
            )}
          </PrimaryButton>
        </div>
      </div>
    </ModalShell>
  );
}

// ── Print helper ───────────────────────────────────────────────────

function printCreditNote(note: CreditNote, customerName: string, invoiceNumber: string) {
  const totals = computeCNTotals(note.items);
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`
    <html><head><title>${note.creditNoteNumber}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 32px; color: #111; }
      h1 { font-size: 22px; margin-bottom: 4px; }
      .meta { color: #666; font-size: 13px; margin-bottom: 24px; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      th { background: #f8fafc; padding: 8px 12px; text-align: left; font-size: 12px; border-bottom: 2px solid #e2e8f0; }
      td { padding: 8px 12px; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
      .right { text-align: right; }
      .totals { margin-top: 16px; text-align: right; }
      .totals p { margin: 2px 0; font-size: 13px; }
      .grand { font-size: 16px; font-weight: bold; margin-top: 8px; }
      .reason { margin-top: 20px; font-size: 13px; color: #444; }
    </style></head><body>
    <h1>Credit Note</h1>
    <div class="meta">
      <strong>${note.creditNoteNumber}</strong> &nbsp;|&nbsp;
      Date: ${fmtDate(note.creditNoteDate)} &nbsp;|&nbsp;
      Invoice: ${invoiceNumber} &nbsp;|&nbsp;
      Customer: ${customerName} &nbsp;|&nbsp;
      Status: ${note.status.charAt(0).toUpperCase() + note.status.slice(1)}
    </div>
    <table>
      <thead><tr>
        <th>Product</th><th class="right">Qty</th><th class="right">Unit Price</th>
        <th class="right">Disc %</th><th class="right">GST %</th><th class="right">Total</th>
      </tr></thead>
      <tbody>
        ${note.items.map((it) => {
          const base = it.quantity * it.unitPrice * (1 - it.discountPercent / 100);
          const total = base + base * (it.gstPercent / 100);
          return `<tr>
            <td>${it.productName}</td>
            <td class="right">${it.quantity}</td>
            <td class="right">₹${it.unitPrice.toLocaleString("en-IN")}</td>
            <td class="right">${it.discountPercent}%</td>
            <td class="right">${it.gstPercent}%</td>
            <td class="right">₹${total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          </tr>`;
        }).join("")}
      </tbody>
    </table>
    <div class="totals">
      <p>Subtotal: ₹${totals.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
      <p>Discount: −₹${totals.discountTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
      <p>Tax (GST): ₹${totals.taxTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
      <p class="grand">Grand Total: ₹${totals.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
    </div>
    ${note.reason ? `<div class="reason"><strong>Reason:</strong> ${note.reason}</div>` : ""}
    ${note.notes ? `<div class="reason"><strong>Notes:</strong> ${note.notes}</div>` : ""}
    </body></html>
  `);
  win.document.close();
  win.print();
}

// ── View Modal ─────────────────────────────────────────────────────

function ViewModal({
  note,
  onClose,
  customerName,
  invoiceNumber,
}: {
  note: CreditNote;
  onClose: () => void;
  customerName: string;
  invoiceNumber: string;
}) {
  const totals = computeCNTotals(note.items);
  return (
    <ModalShell open title={note.creditNoteNumber} onClose={onClose}>
      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-xs text-muted-foreground">Credit Note #</p>
            <p className="mt-0.5 text-sm font-mono font-semibold text-foreground">
              {note.creditNoteNumber}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-xs text-muted-foreground">Status</p>
            <div className="mt-1">
              <BillingStatusPill status={note.status} />
            </div>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-xs text-muted-foreground">Date</p>
            <p className="mt-0.5 text-sm text-foreground">{fmtDate(note.creditNoteDate)}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-xs text-muted-foreground">Linked Invoice</p>
            <p className="mt-0.5 text-sm font-medium text-blue-600">{invoiceNumber}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 col-span-2">
            <p className="text-xs text-muted-foreground">Customer</p>
            <p className="mt-0.5 text-sm font-medium text-foreground">{customerName}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 col-span-2">
            <p className="text-xs text-muted-foreground">Reason</p>
            <p className="mt-0.5 text-sm text-foreground">{note.reason || "—"}</p>
          </div>
        </div>

        {/* Line Items */}
        {note.items.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Products Returned</p>
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Product</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Qty</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Unit Price</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Disc %</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">GST %</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {note.items.map((item, i) => {
                    const base = item.quantity * item.unitPrice * (1 - item.discountPercent / 100);
                    const lineTotal = base + base * (item.gstPercent / 100);
                    return (
                      <tr key={i} className="border-b border-slate-50">
                        <td className="px-3 py-2 text-sm text-foreground">{item.productName}</td>
                        <td className="px-3 py-2 text-sm text-right text-foreground">{item.quantity}</td>
                        <td className="px-3 py-2 text-sm text-right text-foreground">{fmtINR(item.unitPrice)}</td>
                        <td className="px-3 py-2 text-sm text-right text-foreground">{item.discountPercent}%</td>
                        <td className="px-3 py-2 text-sm text-right text-foreground">{item.gstPercent}%</td>
                        <td className="px-3 py-2 text-sm text-right font-medium text-foreground">{fmtINR(lineTotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Totals */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Subtotal</span><span>{fmtINR(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Discount</span><span>−{fmtINR(totals.discountTotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Tax (GST)</span><span>{fmtINR(totals.taxTotal)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-foreground border-t border-slate-200 mt-1 pt-1">
            <span>Grand Total</span><span>{fmtINR(totals.grandTotal)}</span>
          </div>
        </div>

        {note.notes && (
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-xs text-muted-foreground">Notes</p>
            <p className="mt-0.5 text-sm text-foreground">{note.notes}</p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <SecondaryButton
            onClick={() => {
              const cn = note;
              printCreditNote(cn, customerName, invoiceNumber);
            }}
          >
            <Printer className="h-3.5 w-3.5 mr-1.5" />
            Print / PDF
          </SecondaryButton>
          <SecondaryButton onClick={onClose}>Close</SecondaryButton>
        </div>
      </div>
    </ModalShell>
  );
}

// ── Skeleton Row ───────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-slate-100 animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

// ── Main Tab ───────────────────────────────────────────────────────

export function CreditNotesTab() {
  const { business } = useBusiness();
  const businessId = business?.id ?? null;

  // ── Data queries ─────────────────────────────────────────────────
  const { data: creditNotes = [], isLoading } = useCreditNotes(businessId);
  const { data: dbInvoices = [] } = useInvoices(businessId);
  const { data: dbCustomers = [] } = useCustomers(businessId);
  const { data: dbProducts = [] } = useProducts(businessId);

  // ── Mutations ─────────────────────────────────────────────────────
  const createMutation = useCreateCreditNote(businessId);
  const updateMutation = useUpdateCreditNote(businessId);
  const deleteMutation = useDeleteCreditNote(businessId);
  const voidMutation = useVoidCreditNote(businessId);
  const duplicateMutation = useDuplicateCreditNote(businessId);

  // ── UI State ──────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CreditNote | null>(null);
  const [viewTarget, setViewTarget] = useState<CreditNote | null>(null);

  // ── Build lookup maps ─────────────────────────────────────────────
  const productNameMap = useMemo(
    () => new Map(dbProducts.map((p) => [p.id, p.name])),
    [dbProducts]
  );
  const productPriceMap = useMemo(
    () => new Map(dbProducts.map((p) => [p.id, p.selling_price ?? 0])),
    [dbProducts]
  );

  // Enrich invoices with CreditNoteItem shapes for auto-fill
  const invoicesForForm = useMemo(
    () =>
      dbInvoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerId: inv.customerId,
        items: inv.items.map((it) => ({
          productId: it.productId,
          productName: productNameMap.get(it.productId) ?? it.productId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          discountPercent: it.discountPercent,
          gstPercent: it.gstPercent,
        })) as CreditNoteItem[],
      })),
    [dbInvoices, productNameMap]
  );

  const customersForForm = useMemo(
    () =>
      dbCustomers.map((c) => ({ id: c.id, name: c.name, city: c.city })),
    [dbCustomers]
  );

  const productsForForm = useMemo(
    () =>
      dbProducts.map((p) => ({
        id: p.id,
        name: p.name,
        selling_price: p.selling_price ?? 0,
      })),
    [dbProducts]
  );

  // ── Helpers ───────────────────────────────────────────────────────
  const getCustomerName = (customerId: string) =>
    dbCustomers.find((c) => c.id === customerId)?.name ??
    customerId;

  const getInvoiceNumber = (invoiceId: string) =>
    dbInvoices.find((i) => i.id === invoiceId)?.invoiceNumber ??
    invoiceId;

  // ── Filtered + paginated ──────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return creditNotes.filter((n) => {
      const custName = getCustomerName(n.customerId).toLowerCase();
      const invNum = getInvoiceNumber(n.invoiceId).toLowerCase();
      const matchSearch =
        n.creditNoteNumber.toLowerCase().includes(q) ||
        invNum.includes(q) ||
        custName.includes(q) ||
        n.reason.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || n.status === statusFilter;
      return matchSearch && matchStatus;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creditNotes, search, statusFilter, dbCustomers, dbInvoices]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Stats ─────────────────────────────────────────────────────────
  const totalIssued = creditNotes.length;
  const totalAmount = creditNotes.reduce((s, n) => s + n.grandTotal, 0);
  const totalApplied = creditNotes
    .filter((n) => n.status === "applied")
    .reduce((s, n) => s + n.grandTotal, 0);
  const totalVoided = creditNotes
    .filter((n) => n.status === "voided")
    .reduce((s, n) => s + n.grandTotal, 0);

  // ── Handlers ──────────────────────────────────────────────────────
  const handleCreate = (f: CNFormState) => {
    createMutation.mutate(
      {
        creditNoteDate: f.creditNoteDate,
        invoiceId: f.invoiceId,
        customerId: f.customerId,
        reason: f.reason,
        notes: f.notes,
        items: f.items,
        status: "draft",
      },
      {
        onSuccess: () => {
          toast.success("Credit note created.");
          setCreateOpen(false);
          setPage(1);
        },
        onError: (err: Error) => toast.error(err.message),
      }
    );
  };

  const handleEdit = (f: CNFormState) => {
    if (!editTarget) return;
    updateMutation.mutate(
      {
        id: editTarget.id,
        previousStatus: editTarget.status,
        payload: {
          creditNoteDate: f.creditNoteDate,
          invoiceId: f.invoiceId,
          customerId: f.customerId,
          reason: f.reason,
          notes: f.notes,
          items: f.items,
          status: f.status,
        },
      },
      {
        onSuccess: () => {
          toast.success("Credit note updated.");
          setEditTarget(null);
        },
        onError: (err: Error) => toast.error(err.message),
      }
    );
  };

  const handleDelete = (note: CreditNote) => {
    if (note.status !== "draft") {
      toast.error("Only draft credit notes can be deleted.");
      return;
    }
    if (!window.confirm(`Delete ${note.creditNoteNumber}? This cannot be undone.`)) return;
    deleteMutation.mutate(note.id, {
      onSuccess: () => toast.success("Credit note deleted."),
      onError: (err: Error) => toast.error(err.message),
    });
  };

  const handleVoid = (note: CreditNote) => {
    if (note.status === "voided") return;
    if (!window.confirm(`Void ${note.creditNoteNumber}? This cannot be undone.`)) return;
    voidMutation.mutate(note.id, {
      onSuccess: () => toast.success("Credit note voided."),
      onError: (err: Error) => toast.error(err.message),
    });
  };

  const handleDuplicate = (note: CreditNote) => {
    duplicateMutation.mutate(note, {
      onSuccess: () => {
        toast.success("Credit note duplicated as draft.");
        setPage(1);
      },
      onError: (err: Error) => toast.error(err.message),
    });
  };

  const handleEmail = (note: CreditNote) => {
    const custName = getCustomerName(note.customerId);
    const invNum = getInvoiceNumber(note.invoiceId);
    const subject = encodeURIComponent(`Credit Note ${note.creditNoteNumber}`);
    const body = encodeURIComponent(
      `Dear ${custName},\n\nPlease find your Credit Note ${note.creditNoteNumber} dated ${fmtDate(note.creditNoteDate)} for Invoice ${invNum}.\n\nAmount: ₹${note.grandTotal.toLocaleString("en-IN")}\nReason: ${note.reason}\n\nRegards`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Stat Strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile
          label="Total Notes"
          value={String(totalIssued)}
          icon={ReceiptText}
          bg="bg-blue-50"
          iconColor="text-blue-600"
          index={0}
        />
        <StatTile
          label="Total Amount"
          value={fmtINR(totalAmount)}
          icon={TrendingDown}
          bg="bg-violet-50"
          iconColor="text-violet-600"
          index={1}
        />
        <StatTile
          label="Total Applied"
          value={fmtINR(totalApplied)}
          icon={RefreshCcw}
          bg="bg-cyan-50"
          iconColor="text-cyan-600"
          index={2}
        />
        <StatTile
          label="Total Voided"
          value={fmtINR(totalVoided)}
          icon={FileX}
          bg="bg-amber-50"
          iconColor="text-amber-600"
          index={3}
        />
      </div>

      {/* Table Card */}
      <SectionCard
        title="Credit Notes"
        subtitle={`${filtered.length} credit note${filtered.length !== 1 ? "s" : ""}`}
        noPadding
        action={
          <div className="flex items-center gap-2">
            <SearchInput
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
              placeholder="Search credit notes…"
              className="w-52"
            />
            <Select
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setPage(1); }}
              options={[
                { value: "all", label: "All Statuses" },
                { value: "draft", label: "Draft" },
                { value: "issued", label: "Issued" },
                { value: "applied", label: "Applied" },
                { value: "voided", label: "Voided" },
              ]}
            />
            <PrimaryButton icon={Plus} onClick={() => setCreateOpen(true)}>
              New Credit Note
            </PrimaryButton>
          </div>
        }
      >
        {isLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
              </tbody>
            </table>
          </div>
        ) : paginated.length === 0 ? (
          <EmptyState
            icon={FileX}
            title="No credit notes found"
            subtitle="Try adjusting your search or create a new credit note."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                      Credit Note #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                      Linked Invoice
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                      Date
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((note, i) => {
                    const custName = getCustomerName(note.customerId);
                    const invNum = getInvoiceNumber(note.invoiceId);
                    const isDraft = note.status === "draft";
                    const isVoided = note.status === "voided";
                    return (
                      <motion.tr
                        key={note.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.25 }}
                        className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="px-6 py-3 text-sm font-mono font-medium text-foreground whitespace-nowrap">
                          {note.creditNoteNumber}
                        </td>
                        <td className="px-4 py-3 text-sm text-blue-600 whitespace-nowrap">
                          {invNum}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-foreground whitespace-nowrap">
                            {custName}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                          {fmtDate(note.creditNoteDate)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-foreground whitespace-nowrap">
                          {fmtINR(note.grandTotal)}
                        </td>
                        <td className="px-4 py-3">
                          <BillingStatusPill status={note.status} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {/* View */}
                            <button
                              onClick={() => setViewTarget(note)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                              title="View"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            {/* Edit (draft only) */}
                            {isDraft && (
                              <button
                                onClick={() => setEditTarget(note)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                                title="Edit"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {/* Print */}
                            <button
                              onClick={() => printCreditNote(note, custName, invNum)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                              title="Print / Download PDF"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </button>
                            {/* Email */}
                            <button
                              onClick={() => handleEmail(note)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                              title="Email Credit Note"
                            >
                              <Mail className="h-3.5 w-3.5" />
                            </button>
                            {/* Duplicate */}
                            <button
                              onClick={() => handleDuplicate(note)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                              title="Duplicate"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            {/* Void (non-voided, non-draft) */}
                            {!isVoided && !isDraft && (
                              <button
                                onClick={() => handleVoid(note)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                                title="Void Credit Note"
                              >
                                <Ban className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {/* Delete (draft only) */}
                            {isDraft && (
                              <button
                                onClick={() => handleDelete(note)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                title="Delete Draft"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </SectionCard>

      {/* Create Modal */}
      <CNFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New Credit Note"
        invoices={invoicesForForm}
        customers={customersForForm}
        products={productsForForm}
        isSaving={isSaving}
        onSave={handleCreate}
      />

      {/* Edit Modal */}
      {editTarget && (
        <CNFormModal
          open
          onClose={() => setEditTarget(null)}
          title="Edit Credit Note"
          editingStatus={editTarget.status}
          initial={{
            invoiceId: editTarget.invoiceId,
            customerId: editTarget.customerId,
            creditNoteDate: editTarget.creditNoteDate,
            reason: editTarget.reason,
            notes: editTarget.notes,
            items: editTarget.items.length > 0 ? editTarget.items : [EMPTY_ITEM()],
            status: editTarget.status,
          }}
          invoices={invoicesForForm}
          customers={customersForForm}
          products={productsForForm}
          isSaving={isSaving}
          onSave={handleEdit}
        />
      )}

      {/* View Modal */}
      {viewTarget && (
        <ViewModal
          note={viewTarget}
          onClose={() => setViewTarget(null)}
          customerName={getCustomerName(viewTarget.customerId)}
          invoiceNumber={getInvoiceNumber(viewTarget.invoiceId)}
        />
      )}
    </div>
  );
}
