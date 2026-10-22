// ── Invoices Tab ──────────────────────────────────────────────────
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Plus,
  Eye,
  Pencil,
  Copy,
  Trash2,
  Download,
  Printer,
  IndianRupee,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Filter,
  Columns,
  BookMarked,
  Mail,
  SlidersHorizontal,
} from "lucide-react";
import {
  fmtINR,
  fmtDate,
  invoiceGrandTotal,
  computeDocumentTotals,
  type Invoice,
} from "@/lib/billing-data";
import { useBusiness } from "@/contexts/BusinessContext";
import {
  useInvoices,
  useCreateInvoice,
  useUpdateInvoice,
  useDeleteInvoice,
} from "@/hooks/useInvoicesQuery";
import { useCustomers } from "@/hooks/useCustomersQuery";
import { useProducts } from "@/hooks/useProductsQuery";
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
  Checkbox,
} from "@/components/billing/shared";
import { InvoiceBuilder } from "@/components/billing/tabs/InvoiceBuilder";
import { InvoiceDetailView } from "@/components/billing/tabs/InvoiceDetailView";
import { useCreatePayment } from "@/hooks/usePaymentsQuery";
import { toast } from "sonner";

// ── Constants ─────────────────────────────────────────────────────
const PAGE_SIZE = 10;

const SALESPERSON_OPTIONS = [
  "All Salespersons",
  "Arjun Mehta",
  "Divya Krishnan",
  "Rohan Verma",
  "Sneha Patel",
];

const OPTIONAL_COLUMNS = ["GSTIN", "Tax", "Due Date", "Payment Mode", "Salesperson"] as const;
type OptionalColumn = (typeof OPTIONAL_COLUMNS)[number];

// ── Saved Views ────────────────────────────────────────────────────
interface SavedView {
  name: string;
  filterStatus?: string;
  filterPayment?: string;
  dateFrom?: string;
  dateTo?: string;
}

const SAVED_VIEWS: SavedView[] = [
  { name: "All Invoices" },
  { name: "Overdue & Pending", filterStatus: "overdue" },
  { name: "This Month", dateFrom: "2026-07-01" },
];

// ── Helpers ───────────────────────────────────────────────────────
function nextInvoiceNumberLocal(invs: Invoice[]): string {
  const nums = invs.map((i) => parseInt(i.invoiceNumber.split("-").pop() ?? "0", 10));
  const next = Math.max(0, ...nums) + 1;
  return `INV-2026-${String(next).padStart(4, "0")}`;
}

function buildCSV(
  rows: Invoice[],
  resolveCustomer: (id: string) => { name: string; gstin: string } | undefined,
): string {
  const headers = [
    "Invoice Number",
    "Customer",
    "GSTIN",
    "Status",
    "Payment Status",
    "Amount",
    "Tax",
    "Created Date",
    "Due Date",
    "Amount Paid",
    "Balance",
  ];
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [
    headers.join(","),
    ...rows.map((inv) => {
      const cust = resolveCustomer(inv.customerId);
      const totals = computeDocumentTotals(inv.items, inv.isInterState);
      const tax = inv.isInterState ? totals.igst : totals.cgst + totals.sgst;
      const balance = totals.grandTotal - inv.amountPaid;
      return [
        inv.invoiceNumber,
        cust?.name ?? inv.customerId,
        cust?.gstin ?? "—",
        inv.status,
        inv.paymentStatus,
        totals.grandTotal,
        tax,
        inv.createdDate,
        inv.dueDate,
        inv.amountPaid,
        balance,
      ]
        .map(escape)
        .join(",");
    }),
  ];
  return lines.join("\n");
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Popover hook ──────────────────────────────────────────────────
function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);
  return { open, setOpen, ref };
}

// ── InvoicesTab ───────────────────────────────────────────────────
export function InvoicesTab() {
  // ── Business context & live data ───────────────────────────────
  const { business } = useBusiness();
  const businessId = business?.id ?? null;

  const invoicesQuery = useInvoices(businessId);
  const localInvoices: Invoice[] = invoicesQuery.data ?? [];

  const { data: dbCustomers = [] } = useCustomers(businessId);
  const { data: dbProducts = [] } = useProducts(businessId);

  // Resolve a customer ID → display info from DB
  const resolveCustomer = useCallback(
    (customerId: string) => {
      const found = dbCustomers.find((c) => c.id === customerId);
      if (found) {
        return {
          name: found.name,
          gstin: found.gst_number ?? "",
          contactPerson: found.contact_person ?? "",
        };
      }
      return undefined;
    },
    [dbCustomers],
  );

  // Mutations
  const createInvoiceMutation = useCreateInvoice(businessId);
  const updateInvoiceMutation = useUpdateInvoice(businessId);
  const deleteInvoiceMutation = useDeleteInvoice(businessId);
  const createPaymentMutation = useCreatePayment(businessId);

  // ── State ──────────────────────────────────────────────────────
  type ViewState = "list" | "create" | "edit" | "view";
  const [view, setView] = useState<ViewState>("list");
  const [activeInvoice, setActiveInvoice] = useState<Invoice | undefined>(undefined);

  // Filters / sort / pagination
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const [sortKey, setSortKey] = useState("date-desc");
  const [page, setPage] = useState(1);

  // Advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advDateFrom, setAdvDateFrom] = useState("");
  const [advDateTo, setAdvDateTo] = useState("");
  const [advAmountMin, setAdvAmountMin] = useState("");
  const [advAmountMax, setAdvAmountMax] = useState("");
  const [advSalesperson, setAdvSalesperson] = useState("All Salespersons");

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState<Set<OptionalColumn>>(
    new Set(OPTIONAL_COLUMNS),
  );

  // Saved views
  const [activeViewName, setActiveViewName] = useState("All Invoices");

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Popovers
  const columnsPopover = usePopover();
  const viewsPopover = usePopover();

  // ── Derived stats ──────────────────────────────────────────────
  const totalCount = localInvoices.length;
  const paidCount = localInvoices.filter((i) => i.status === "paid").length;
  const pendingCount = localInvoices.filter(
    (i) => i.status === "sent" || i.status === "draft" || i.status === "partial",
  ).length;
  const overdueCount = localInvoices.filter((i) => i.status === "overdue").length;
  const totalAmount = localInvoices.reduce((s, i) => s + invoiceGrandTotal(i), 0);
  const paidAmount = localInvoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + invoiceGrandTotal(i), 0);
  const pendingAmount = localInvoices
    .filter((i) => i.status === "sent" || i.status === "draft" || i.status === "partial")
    .reduce((s, i) => s + invoiceGrandTotal(i), 0);
  const overdueAmount = localInvoices
    .filter((i) => i.status === "overdue")
    .reduce((s, i) => s + invoiceGrandTotal(i), 0);

  // ── Advanced filter active count ───────────────────────────────
  const advFilterCount = [
    advDateFrom !== "",
    advDateTo !== "",
    advAmountMin !== "",
    advAmountMax !== "",
    advSalesperson !== "All Salespersons",
  ].filter(Boolean).length;

  // ── Filtered / sorted / paginated ─────────────────────────────
  const filtered = useMemo(() => {
    let rows = localInvoices;

    // Enhanced search: invoice number, customer name, GSTIN, amount, salesperson, referenceNumber
    const q = search.toLowerCase().trim();
    if (q) {
      const qNum = parseFloat(q.replace(/,/g, ""));
      rows = rows.filter((inv) => {
        const cust = resolveCustomer(inv.customerId);
        const totals = computeDocumentTotals(inv.items, inv.isInterState);
        const grandTotal = Math.round(totals.grandTotal);
        return (
          inv.invoiceNumber.toLowerCase().includes(q) ||
          (cust?.name ?? "").toLowerCase().includes(q) ||
          (cust?.gstin ?? "").toLowerCase().includes(q) ||
          (inv.salesperson ?? "").toLowerCase().includes(q) ||
          (inv.referenceNumber ?? "").toLowerCase().includes(q) ||
          (!isNaN(qNum) && Math.round(qNum) === grandTotal)
        );
      });
    }

    // Status filter
    if (filterStatus !== "all") {
      rows = rows.filter((inv) => inv.status === filterStatus);
    }

    // Payment filter
    if (filterPayment !== "all") {
      rows = rows.filter((inv) => inv.paymentStatus === filterPayment);
    }

    // Advanced: date range
    if (advDateFrom) {
      rows = rows.filter((inv) => inv.createdDate >= advDateFrom);
    }
    if (advDateTo) {
      rows = rows.filter((inv) => inv.createdDate <= advDateTo);
    }

    // Advanced: amount range
    if (advAmountMin !== "") {
      const min = parseFloat(advAmountMin);
      if (!isNaN(min)) {
        rows = rows.filter((inv) => invoiceGrandTotal(inv) >= min);
      }
    }
    if (advAmountMax !== "") {
      const max = parseFloat(advAmountMax);
      if (!isNaN(max)) {
        rows = rows.filter((inv) => invoiceGrandTotal(inv) <= max);
      }
    }

    // Advanced: salesperson
    if (advSalesperson !== "All Salespersons") {
      rows = rows.filter((inv) => inv.salesperson === advSalesperson);
    }

    rows = [...rows].sort((a, b) => {
      if (sortKey === "date-desc")
        return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
      if (sortKey === "date-asc")
        return new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime();
      if (sortKey === "amount-desc") return invoiceGrandTotal(b) - invoiceGrandTotal(a);
      if (sortKey === "amount-asc") return invoiceGrandTotal(a) - invoiceGrandTotal(b);
      return 0;
    });
    return rows;
  }, [
    localInvoices,
    search,
    filterStatus,
    filterPayment,
    sortKey,
    advDateFrom,
    advDateTo,
    advAmountMin,
    advAmountMax,
    advSalesperson,
    resolveCustomer,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function handleSearch(v: string) {
    setSearch(v);
    setPage(1);
  }
  function handleStatusFilter(v: string) {
    setFilterStatus(v);
    setPage(1);
  }
  function handlePaymentFilter(v: string) {
    setFilterPayment(v);
    setPage(1);
  }

  // ── Saved view apply ───────────────────────────────────────────
  function applyView(sv: SavedView) {
    setActiveViewName(sv.name);
    setFilterStatus(sv.filterStatus ?? "all");
    setFilterPayment(sv.filterPayment ?? "all");
    setAdvDateFrom(sv.dateFrom ?? "");
    setAdvDateTo(sv.dateTo ?? "");
    setAdvAmountMin("");
    setAdvAmountMax("");
    setAdvSalesperson("All Salespersons");
    setPage(1);
    viewsPopover.setOpen(false);
  }

  // ── Column toggle ──────────────────────────────────────────────
  function toggleColumn(col: OptionalColumn) {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(col)) next.delete(col);
      else next.add(col);
      return next;
    });
  }

  function colVisible(col: OptionalColumn) {
    return visibleColumns.has(col);
  }

  // ── Selection ──────────────────────────────────────────────────
  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    if (pageRows.every((r) => selectedIds.has(r.id))) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pageRows.forEach((r) => next.delete(r.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pageRows.forEach((r) => next.add(r.id));
        return next;
      });
    }
  }
  const allPageSelected = pageRows.length > 0 && pageRows.every((r) => selectedIds.has(r.id));
  const someSelected = selectedIds.size > 0;

  // ── CRUD actions ───────────────────────────────────────────────
  function handleDuplicate(inv: Invoice) {
    const newInv: Invoice = {
      ...inv,
      id: "inv-" + Date.now(),
      invoiceNumber: nextInvoiceNumberLocal([...localInvoices]),
      status: "draft",
      paymentStatus: "pending",
      amountPaid: 0,
      createdDate: new Date().toISOString().split("T")[0],
    };
    // Save duplicate as a new draft (no stock movements)
    createInvoiceMutation.mutate({ invoice: newInv, dbProducts: [], skipMovements: true });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this invoice? This action cannot be undone.")) return;
    deleteInvoiceMutation.mutate(id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function handleBulkDelete() {
    if (!confirm(`Delete ${selectedIds.size} selected invoice(s)? This cannot be undone.`)) return;
    [...selectedIds].forEach((id) => deleteInvoiceMutation.mutate(id));
    setSelectedIds(new Set());
  }

  function handleExportCSV() {
    const selected =
      selectedIds.size > 0 ? filtered.filter((i) => selectedIds.has(i.id)) : filtered;
    downloadFile(
      buildCSV(selected, resolveCustomer),
      "invoices-export.csv",
      "text/csv;charset=utf-8;",
    );
  }

  function handleExportExcel() {
    const selected =
      selectedIds.size > 0 ? filtered.filter((i) => selectedIds.has(i.id)) : filtered;
    downloadFile(
      buildCSV(selected, resolveCustomer),
      "invoices-export.xls",
      "application/vnd.ms-excel",
    );
  }

  function handleBulkPrint() {
    window.print();
  }

  function handleBulkEmail() {
    alert(
      `Bulk email would be sent to ${selectedIds.size} customer(s). Email integration required.`,
    );
  }

  async function handleBulkMarkPaid() {
    const selected = localInvoices
      .filter(
        (inv) => selectedIds.has(inv.id) && ["sent", "partial", "overdue"].includes(inv.status),
      )
      .map((invoice) => ({
        invoice,
        outstanding:
          Math.round(
            (computeDocumentTotals(invoice.items, invoice.isInterState).grandTotal -
              invoice.amountPaid) *
              100,
          ) / 100,
      }))
      .filter(({ outstanding }) => outstanding > 0);
    const date = new Intl.DateTimeFormat("sv-SE", {
      timeZone: business?.timezone || "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const results = await Promise.allSettled(
      selected.map(({ invoice: inv, outstanding }) => {
        return createPaymentMutation.mutateAsync({
          invoiceId: inv.id,
          customerId: inv.customerId,
          amount: outstanding,
          mode: inv.paymentMode,
          date,
          currency: inv.currency,
          notes: "Marked paid from invoice list",
        });
      }),
    );
    const succeeded = results.filter((result) => result.status === "fulfilled").length;
    const failed = results.length - succeeded;
    setSelectedIds(new Set());
    if (failed > 0) {
      toast.error(
        `${succeeded} payment${succeeded === 1 ? "" : "s"} recorded; ${failed} failed. Refreshing saved invoices.`,
      );
    } else if (succeeded > 0) {
      toast.success(
        `${succeeded} invoice${succeeded === 1 ? "" : "s"} marked paid with payment records.`,
      );
    } else {
      toast.info("Select an issued invoice with an outstanding balance.");
    }
  }

  // ── Builder save ───────────────────────────────────────────────
  function handleBuilderSave(inv: Invoice) {
    if (view === "create") {
      createInvoiceMutation.mutate({ invoice: inv, dbProducts });
    } else {
      updateInvoiceMutation.mutate({ id: inv.id, invoice: inv });
    }
    setView("list");
    setActiveInvoice(undefined);
  }

  // ── View switching ─────────────────────────────────────────────
  function openCreate() {
    setActiveInvoice(undefined);
    setView("create");
  }

  function openEdit(inv: Invoice) {
    setActiveInvoice(inv);
    setView("edit");
  }

  function openView(inv: Invoice) {
    setActiveInvoice(inv);
    setView("view");
  }

  function backToList() {
    setView("list");
    setActiveInvoice(undefined);
  }

  // ── Render: create / edit ──────────────────────────────────────
  if (view === "create" || view === "edit") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={backToList}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-slate-50"
          >
            ← Back to Invoices
          </button>
          <h2 className="text-sm font-semibold text-foreground">
            {view === "create" ? "New Invoice" : `Edit ${activeInvoice?.invoiceNumber ?? ""}`}
          </h2>
        </div>
        <InvoiceBuilder
          mode={view}
          invoice={activeInvoice}
          onSave={handleBuilderSave}
          onCancel={backToList}
        />
      </div>
    );
  }

  // ── Render: view ───────────────────────────────────────────────
  if (view === "view" && activeInvoice) {
    return (
      <InvoiceDetailView
        invoice={activeInvoice}
        onEdit={() => openEdit(activeInvoice)}
        onBack={backToList}
      />
    );
  }

  // ── Render: list ───────────────────────────────────────────────
  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "draft", label: "Draft" },
    { value: "sent", label: "Sent" },
    { value: "paid", label: "Paid" },
    { value: "partial", label: "Partial" },
    { value: "overdue", label: "Overdue" },
    { value: "cancelled", label: "Cancelled" },
  ];
  const paymentOptions = [
    { value: "all", label: "All Payment" },
    { value: "paid", label: "Paid" },
    { value: "pending", label: "Pending" },
    { value: "partial", label: "Partial" },
    { value: "overdue", label: "Overdue" },
  ];
  const sortOptions = [
    { value: "date-desc", label: "Newest First" },
    { value: "date-asc", label: "Oldest First" },
    { value: "amount-desc", label: "Amount High–Low" },
    { value: "amount-asc", label: "Amount Low–High" },
  ];

  // Build table headers dynamically
  const mandatoryHeaders = ["Invoice No.", "Customer"];
  const optionalHeaderMap: Record<OptionalColumn, string> = {
    GSTIN: "GSTIN",
    Tax: "Tax",
    "Due Date": "Due Date",
    "Payment Mode": "Payment Mode",
    Salesperson: "Salesperson",
  };

  return (
    <div className="space-y-5">
      {/* ── Stat strip ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile
          label="Total Invoices"
          value={String(totalCount)}
          sub={fmtINR(totalAmount)}
          icon={FileText}
          bg="bg-slate-100"
          iconColor="text-slate-600"
          index={0}
        />
        <StatTile
          label="Paid"
          value={String(paidCount)}
          sub={fmtINR(paidAmount)}
          icon={CheckCircle2}
          bg="bg-emerald-100"
          iconColor="text-emerald-600"
          index={1}
        />
        <StatTile
          label="Pending"
          value={String(pendingCount)}
          sub={fmtINR(pendingAmount)}
          icon={Clock}
          bg="bg-amber-100"
          iconColor="text-amber-600"
          index={2}
        />
        <StatTile
          label="Overdue"
          value={String(overdueCount)}
          sub={fmtINR(overdueAmount)}
          icon={AlertTriangle}
          bg="bg-red-100"
          iconColor="text-red-600"
          index={3}
        />
      </div>

      {/* ── Table card ── */}
      <SectionCard
        title="Invoices"
        subtitle={`${localInvoices.length} invoices`}
        action={
          <PrimaryButton icon={Plus} onClick={openCreate}>
            New Invoice
          </PrimaryButton>
        }
        noPadding
      >
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-6 py-3">
          <SearchInput
            value={search}
            onChange={handleSearch}
            placeholder="Search invoice or customer..."
            className="w-56"
          />
          <Select
            value={filterStatus}
            onChange={handleStatusFilter}
            options={statusOptions}
            className="w-36"
          />
          <Select
            value={filterPayment}
            onChange={handlePaymentFilter}
            options={paymentOptions}
            className="w-36"
          />
          <Select value={sortKey} onChange={setSortKey} options={sortOptions} className="w-40" />

          {/* ── Filters button ── */}
          <button
            onClick={() => setShowAdvancedFilters((v) => !v)}
            className={`relative inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              showAdvancedFilters || advFilterCount > 0
                ? "border-blue-300 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {advFilterCount > 0 && (
              <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                {advFilterCount}
              </span>
            )}
          </button>

          {/* ── Columns button ── */}
          <div className="relative" ref={columnsPopover.ref}>
            <button
              onClick={() => columnsPopover.setOpen((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                columnsPopover.open
                  ? "border-blue-300 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Columns className="h-3.5 w-3.5" />
              Columns
            </button>
            {columnsPopover.open && (
              <div className="absolute left-0 top-full z-20 mt-1 w-44 rounded-xl border border-slate-200 bg-white py-2 shadow-lg">
                <p className="px-3 pb-1.5 pt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Optional Columns
                </p>
                {OPTIONAL_COLUMNS.map((col) => (
                  <label
                    key={col}
                    className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={visibleColumns.has(col)}
                      onChange={() => toggleColumn(col)}
                      className="h-3.5 w-3.5 rounded border-slate-300"
                    />
                    {col}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* ── Views button ── */}
          <div className="relative" ref={viewsPopover.ref}>
            <button
              onClick={() => viewsPopover.setOpen((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                viewsPopover.open
                  ? "border-blue-300 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <BookMarked className="h-3.5 w-3.5" />
              <span>{activeViewName}</span>
            </button>
            {viewsPopover.open && (
              <div className="absolute left-0 top-full z-20 mt-1 w-48 rounded-xl border border-slate-200 bg-white py-2 shadow-lg">
                <p className="px-3 pb-1.5 pt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Saved Views
                </p>
                {SAVED_VIEWS.map((sv) => (
                  <button
                    key={sv.name}
                    onClick={() => applyView(sv)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-slate-50 ${
                      activeViewName === sv.name ? "font-semibold text-blue-700" : "text-slate-700"
                    }`}
                  >
                    {sv.name === "Overdue & Pending" && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    )}
                    {sv.name !== "Overdue & Pending" && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                    )}
                    {sv.name}
                    {activeViewName === sv.name && (
                      <span className="ml-auto text-[10px] text-blue-500">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <SecondaryButton icon={Download} onClick={handleExportCSV}>
              Export CSV
            </SecondaryButton>
            <SecondaryButton icon={Download} onClick={handleExportExcel}>
              Export Excel
            </SecondaryButton>
          </div>
        </div>

        {/* ── Advanced Filters Row ── */}
        {showAdvancedFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-slate-100 bg-slate-50/60 px-6 py-3"
          >
            <div className="flex flex-wrap items-end gap-4">
              {/* Date Range */}
              <div className="flex items-end gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    From
                  </label>
                  <input
                    type="date"
                    value={advDateFrom}
                    onChange={(e) => {
                      setAdvDateFrom(e.target.value);
                      setPage(1);
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-300"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    To
                  </label>
                  <input
                    type="date"
                    value={advDateTo}
                    onChange={(e) => {
                      setAdvDateTo(e.target.value);
                      setPage(1);
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-300"
                  />
                </div>
              </div>

              {/* Amount Range */}
              <div className="flex items-end gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    Min ₹
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={advAmountMin}
                    onChange={(e) => {
                      setAdvAmountMin(e.target.value);
                      setPage(1);
                    }}
                    className="w-28 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-300"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    Max ₹
                  </label>
                  <input
                    type="number"
                    placeholder="∞"
                    value={advAmountMax}
                    onChange={(e) => {
                      setAdvAmountMax(e.target.value);
                      setPage(1);
                    }}
                    className="w-28 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-300"
                  />
                </div>
              </div>

              {/* Salesperson */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Salesperson
                </label>
                <select
                  value={advSalesperson}
                  onChange={(e) => {
                    setAdvSalesperson(e.target.value);
                    setPage(1);
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-300"
                >
                  {SALESPERSON_OPTIONS.map((sp) => (
                    <option key={sp} value={sp}>
                      {sp}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear advanced filters */}
              {advFilterCount > 0 && (
                <button
                  onClick={() => {
                    setAdvDateFrom("");
                    setAdvDateTo("");
                    setAdvAmountMin("");
                    setAdvAmountMax("");
                    setAdvSalesperson("All Salespersons");
                    setPage(1);
                  }}
                  className="self-end rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Bulk action bar */}
        {someSelected && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-3 border-b border-amber-100 bg-amber-50 px-6 py-2"
          >
            <span className="text-xs font-semibold text-amber-700">
              {selectedIds.size} selected
            </span>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> Export Excel
            </button>
            <button
              onClick={handleBulkPrint}
              className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" /> Print
            </button>
            {/* ── Bulk Email ── */}
            <button
              onClick={handleBulkEmail}
              className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 transition-colors"
            >
              <Mail className="h-3.5 w-3.5" /> Send Email
            </button>
            {/* ── Bulk Mark Paid ── */}
            <button
              onClick={handleBulkMarkPaid}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Mark Paid
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </button>
          </motion.div>
        )}

        {/* Table */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No invoices found"
            subtitle="Try adjusting your filters or create a new invoice."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="w-10 pl-6 py-3">
                      <Checkbox checked={allPageSelected} onChange={toggleAll} />
                    </th>
                    {/* Mandatory: Invoice No. */}
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">
                      Invoice No.
                    </th>
                    {/* Mandatory: Customer */}
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">
                      Customer
                    </th>
                    {/* Optional: GSTIN */}
                    {colVisible("GSTIN") && (
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">
                        GSTIN
                      </th>
                    )}
                    {/* Mandatory: Status */}
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">
                      Status
                    </th>
                    {/* Mandatory: Amount */}
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">
                      Amount
                    </th>
                    {/* Optional: Tax */}
                    {colVisible("Tax") && (
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">
                        Tax
                      </th>
                    )}
                    {/* Mandatory: Created */}
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">
                      Created
                    </th>
                    {/* Optional: Due Date */}
                    {colVisible("Due Date") && (
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">
                        Due Date
                      </th>
                    )}
                    {/* Optional: Payment Mode */}
                    {colVisible("Payment Mode") && (
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">
                        Payment Mode
                      </th>
                    )}
                    {/* Mandatory: Payment (status) */}
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">
                      Payment
                    </th>
                    {/* Optional: Salesperson */}
                    {colVisible("Salesperson") && (
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">
                        Salesperson
                      </th>
                    )}
                    {/* Mandatory: Actions */}
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((inv, i) => {
                    const cust = resolveCustomer(inv.customerId);
                    const totals = computeDocumentTotals(inv.items, inv.isInterState);
                    const tax = inv.isInterState ? totals.igst : totals.cgst + totals.sgst;
                    const isSelected = selectedIds.has(inv.id);

                    return (
                      <motion.tr
                        key={inv.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.03 }}
                        className={`group cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50/70 ${isSelected ? "bg-blue-50/50" : ""}`}
                        onClick={(e) => {
                          const target = e.target as HTMLElement;
                          if (target.closest("[data-no-row-click]")) return;
                          openView(inv);
                        }}
                      >
                        <td className="pl-6 py-3" data-no-row-click>
                          <Checkbox checked={isSelected} onChange={() => toggleSelect(inv.id)} />
                        </td>
                        {/* Invoice No. */}
                        <td className="px-3 py-3">
                          <span className="font-mono text-xs font-semibold text-blue-700">
                            {inv.invoiceNumber}
                          </span>
                        </td>
                        {/* Customer */}
                        <td className="px-3 py-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {cust?.name ?? inv.customerId}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {cust?.contactPerson ?? ""}
                            </p>
                          </div>
                        </td>
                        {/* Optional: GSTIN */}
                        {colVisible("GSTIN") && (
                          <td className="px-3 py-3 text-xs font-mono text-slate-500">
                            {cust?.gstin ?? "—"}
                          </td>
                        )}
                        {/* Status */}
                        <td className="px-3 py-3">
                          <BillingStatusPill status={inv.status} />
                        </td>
                        {/* Amount */}
                        <td className="px-3 py-3 text-right font-semibold text-slate-800 whitespace-nowrap">
                          {fmtINR(totals.grandTotal)}
                        </td>
                        {/* Optional: Tax */}
                        {colVisible("Tax") && (
                          <td className="px-3 py-3 text-right text-xs text-slate-600 whitespace-nowrap">
                            {fmtINR(tax)}
                          </td>
                        )}
                        {/* Created */}
                        <td className="px-3 py-3 text-xs text-slate-600 whitespace-nowrap">
                          {fmtDate(inv.createdDate)}
                        </td>
                        {/* Optional: Due Date */}
                        {colVisible("Due Date") && (
                          <td className="px-3 py-3 text-xs text-slate-600 whitespace-nowrap">
                            {fmtDate(inv.dueDate)}
                          </td>
                        )}
                        {/* Optional: Payment Mode */}
                        {colVisible("Payment Mode") && (
                          <td className="px-3 py-3 text-xs text-slate-600 whitespace-nowrap capitalize">
                            {inv.paymentMode.replace(/-/g, " ")}
                          </td>
                        )}
                        {/* Payment status */}
                        <td className="px-3 py-3">
                          <BillingStatusPill status={inv.paymentStatus} />
                        </td>
                        {/* Optional: Salesperson */}
                        {colVisible("Salesperson") && (
                          <td className="px-3 py-3">
                            {inv.salesperson ? (
                              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                                {inv.salesperson}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                        )}
                        {/* Actions */}
                        <td className="px-3 py-3" data-no-row-click>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openView(inv)}
                              title="View"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => openEdit(inv)}
                              title="Edit"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDuplicate(inv)}
                              title="Duplicate"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(inv.id)}
                              title="Delete"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
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
            <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </SectionCard>
    </div>
  );
}
