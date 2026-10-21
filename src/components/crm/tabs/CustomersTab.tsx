// ── Customers Tab — Supabase-backed ───────────────────────────────
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Download,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Users,
  ChevronUp,
  ChevronDown,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fmtINR, fmtDate, type CustomerStatus, type CustomerGroupName } from "@/lib/crm-data";
import {
  SectionCard,
  SearchInput,
  Select,
  Pagination,
  PrimaryButton,
  SecondaryButton,
  EmptyState,
  CrmStatusPill,
  Checkbox,
  ModalShell,
  Avatar,
} from "@/components/crm/shared";
import { useBusiness } from "@/contexts/BusinessContext";
import { useInvoices } from "@/hooks/useInvoicesQuery";
import { invoiceBalance, invoiceGrandTotal } from "@/lib/billing-data";
import { useCrmSettings } from "@/hooks/useCrmQuery";
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useBulkUpdateCustomers,
} from "@/hooks/useCustomersQuery";
import { type Customer, type CustomerInsert, type CustomerUpdate } from "@/services/customers";

const PAGE_SIZE = 10;

// ── UI shape (compatible with existing render code) ───────────────

interface UiCustomer {
  id: string;
  customerCode: string;
  name: string;
  company: string;
  contactPerson: string;
  gstin: string;
  pan: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  billingAddress: string;
  shippingAddress: string;
  group: CustomerGroupName;
  status: CustomerStatus;
  outstandingAmount: number;
  creditLimit: number;
  creditDays: number;
  totalRevenue: number;
  lastPurchase: string;
  createdDate: string;
  rating: number;
}

// ── DB ↔ UI adapters ──────────────────────────────────────────────

function dbToUi(c: Customer): UiCustomer {
  return {
    id: c.id,
    customerCode: c.customer_code,
    name: c.name,
    company: c.company_name ?? "",
    contactPerson: c.contact_person ?? "",
    gstin: c.gst_number ?? "",
    pan: c.pan_number ?? "",
    phone: c.phone,
    email: c.email ?? "",
    city: c.city ?? "",
    state: c.state ?? "",
    billingAddress: c.address ?? "",
    shippingAddress: c.shipping_address ?? "",
    group: (c.customer_group as CustomerGroupName) ?? "Retail",
    status: (c.status as CustomerStatus) ?? "active",
    outstandingAmount: c.opening_balance,
    creditLimit: c.credit_limit,
    creditDays: c.credit_days,
    totalRevenue: 0,
    lastPurchase: "",
    createdDate: c.created_at?.slice(0, 10) ?? "",
    rating: c.rating ?? 3,
  };
}

function formToInsert(
  businessId: string,
  form: CustomerFormData,
  country = "India",
): CustomerInsert {
  return {
    business_id: businessId,
    customer_code: "",
    name: form.name.trim(),
    company_name: form.company.trim() || null,
    contact_person: form.contactPerson.trim() || null,
    email: form.email.trim() || null,
    phone: form.phone.trim(),
    gst_number: form.gstin.trim() || null,
    pan_number: form.pan.trim() || null,
    address: form.billingAddress.trim() || null,
    shipping_address: form.shippingAddress.trim() || null,
    city: form.city.trim() || null,
    state: form.state.trim() || null,
    country,
    postal_code: null,
    credit_limit: form.creditLimit,
    credit_days: form.creditDays,
    opening_balance: 0,
    customer_group: form.group,
    status: form.status,
    rating: 3,
    notes: null,
  };
}

function formToUpdate(form: CustomerFormData): CustomerUpdate {
  return {
    name: form.name.trim(),
    company_name: form.company.trim() || null,
    contact_person: form.contactPerson.trim() || null,
    email: form.email.trim() || null,
    phone: form.phone.trim(),
    gst_number: form.gstin.trim() || null,
    pan_number: form.pan.trim() || null,
    address: form.billingAddress.trim() || null,
    shipping_address: form.shippingAddress.trim() || null,
    city: form.city.trim() || null,
    state: form.state.trim() || null,
    credit_limit: form.creditLimit,
    credit_days: form.creditDays,
    customer_group: form.group,
    status: form.status,
  };
}

// ── Helpers ───────────────────────────────────────────────────────

function buildCSV(rows: UiCustomer[]): string {
  const headers = [
    "Customer Code",
    "Name",
    "Company",
    "Contact Person",
    "GSTIN",
    "PAN",
    "Phone",
    "Email",
    "City",
    "State",
    "Group",
    "Status",
    "Outstanding Amount",
    "Credit Limit",
    "Credit Days",
    "Created Date",
  ];
  const escape = (v: string | number | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [
    headers.join(","),
    ...rows.map((c) =>
      [
        c.customerCode,
        c.name,
        c.company,
        c.contactPerson,
        c.gstin,
        c.pan,
        c.phone,
        c.email,
        c.city,
        c.state,
        c.group,
        c.status,
        c.outstandingAmount,
        c.creditLimit,
        c.creditDays,
        c.createdDate,
      ]
        .map(escape)
        .join(","),
    ),
  ].join("\n");
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

// ── Form types ────────────────────────────────────────────────────

const GROUPS: CustomerGroupName[] = [
  "Retail",
  "Wholesale",
  "Corporate",
  "VIP",
  "Distributor",
  "Dealer",
];
const STATUSES: CustomerStatus[] = ["active", "inactive", "new", "at-risk", "archived"];

type CustomerFormData = {
  name: string;
  company: string;
  contactPerson: string;
  gstin: string;
  pan: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  billingAddress: string;
  shippingAddress: string;
  group: CustomerGroupName;
  creditLimit: number;
  creditDays: number;
  status: CustomerStatus;
};

const EMPTY_FORM: CustomerFormData = {
  name: "",
  company: "",
  contactPerson: "",
  gstin: "",
  pan: "",
  phone: "",
  email: "",
  city: "",
  state: "",
  billingAddress: "",
  shippingAddress: "",
  group: "Retail",
  creditLimit: 50000,
  creditDays: 30,
  status: "new",
};

// ── CustomerForm ──────────────────────────────────────────────────

type FormTab = "basic" | "address" | "business";

function CustomerForm({
  initial,
  isEdit,
  saving,
  serverError,
  onSave,
  onCancel,
}: {
  initial: CustomerFormData;
  isEdit: boolean;
  saving: boolean;
  serverError: string;
  onSave: (data: CustomerFormData) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<CustomerFormData>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<FormTab>("basic");

  function set<K extends keyof CustomerFormData>(key: K, val: CustomerFormData[K]) {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.phone.trim()) e.phone = "Phone is required";
    else if (!/^\+?[\d\s\-()]{7,15}$/.test(form.phone.trim()))
      e.phone = "Enter a valid phone number";
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      e.email = "Enter a valid email address";
    if (
      form.gstin.trim() &&
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(form.gstin.trim())
    )
      e.gstin = "Invalid GST format (e.g. 27AABCU9603R1ZX)";
    return e;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      setTab("basic");
      return;
    }
    onSave(form);
  }

  const inp =
    "h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition-colors focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)] placeholder:text-slate-400 disabled:opacity-50";
  const lbl = "mb-1 block text-xs font-medium text-foreground";
  const err = "mt-0.5 text-[11px] text-red-500";
  const sel =
    "h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)] disabled:opacity-50";
  const txa =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)] placeholder:text-slate-400 resize-none disabled:opacity-50";

  const tabs: { key: FormTab; label: string }[] = [
    { key: "basic", label: "Basic Info" },
    { key: "address", label: "Address" },
    { key: "business", label: "Business" },
  ];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-0">
      {serverError && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {serverError}
        </div>
      )}

      <div className="flex gap-1 border-b border-slate-100 mb-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors ${
              tab === t.key
                ? "bg-white border border-b-white border-slate-200 text-[color:var(--brand-electric)] -mb-px"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="max-h-[55vh] overflow-y-auto px-1 py-1">
        {tab === "basic" && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div className="col-span-2">
              <label className={lbl}>Full Name *</label>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Arjun Sharma"
                className={inp}
                disabled={saving}
              />
              {errors.name && <p className={err}>{errors.name}</p>}
            </div>
            <div>
              <label className={lbl}>Company</label>
              <input
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
                placeholder="Company name"
                className={inp}
                disabled={saving}
              />
            </div>
            <div>
              <label className={lbl}>Contact Person</label>
              <input
                value={form.contactPerson}
                onChange={(e) => set("contactPerson", e.target.value)}
                placeholder="Primary contact"
                className={inp}
                disabled={saving}
              />
            </div>
            <div>
              <label className={lbl}>Phone *</label>
              <input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+91 98765 43210"
                className={inp}
                disabled={saving}
              />
              {errors.phone && <p className={err}>{errors.phone}</p>}
            </div>
            <div>
              <label className={lbl}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="email@example.com"
                className={inp}
                disabled={saving}
              />
              {errors.email && <p className={err}>{errors.email}</p>}
            </div>
            <div>
              <label className={lbl}>Customer Group</label>
              <select
                value={form.group}
                onChange={(e) => set("group", e.target.value as CustomerGroupName)}
                className={sel}
                disabled={saving}
              >
                {GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={lbl}>Status</label>
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value as CustomerStatus)}
                className={sel}
                disabled={saving}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/-/g, " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {tab === "address" && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <label className={lbl}>City</label>
              <input
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="e.g. Mumbai"
                className={inp}
                disabled={saving}
              />
            </div>
            <div>
              <label className={lbl}>State</label>
              <input
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
                placeholder="e.g. Maharashtra"
                className={inp}
                disabled={saving}
              />
            </div>
            <div className="col-span-2">
              <label className={lbl}>Billing Address</label>
              <textarea
                value={form.billingAddress}
                onChange={(e) => set("billingAddress", e.target.value)}
                rows={3}
                placeholder="Full billing address..."
                className={txa}
                disabled={saving}
              />
            </div>
            <div className="col-span-2">
              <label className={lbl}>Shipping Address</label>
              <textarea
                value={form.shippingAddress}
                onChange={(e) => set("shippingAddress", e.target.value)}
                rows={3}
                placeholder="Full shipping address..."
                className={txa}
                disabled={saving}
              />
            </div>
          </div>
        )}

        {tab === "business" && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <label className={lbl}>GSTIN</label>
              <input
                value={form.gstin}
                onChange={(e) => set("gstin", e.target.value.toUpperCase())}
                placeholder="e.g. 27AABCU9603R1ZX"
                className={inp}
                disabled={saving}
              />
              {errors.gstin && <p className={err}>{errors.gstin}</p>}
            </div>
            <div>
              <label className={lbl}>PAN</label>
              <input
                value={form.pan}
                onChange={(e) => set("pan", e.target.value.toUpperCase())}
                placeholder="e.g. AABCU9603R"
                className={inp}
                disabled={saving}
              />
            </div>
            <div>
              <label className={lbl}>Credit Limit (₹)</label>
              <input
                type="number"
                min={0}
                value={form.creditLimit}
                onChange={(e) => set("creditLimit", Number(e.target.value))}
                className={inp}
                disabled={saving}
              />
            </div>
            <div>
              <label className={lbl}>Credit Days</label>
              <input
                type="number"
                min={0}
                value={form.creditDays}
                onChange={(e) => set("creditDays", Number(e.target.value))}
                className={inp}
                disabled={saving}
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-[image:var(--gradient-brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
        >
          {saving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Saving…
            </>
          ) : isEdit ? (
            "Save Changes"
          ) : (
            "Add Customer"
          )}
        </button>
      </div>
    </form>
  );
}

// ── Bulk Edit Modal ───────────────────────────────────────────────

function BulkEditModal({
  open,
  onClose,
  count,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  count: number;
  onApply: (group: CustomerGroupName | "", status: CustomerStatus | "") => void;
}) {
  const [group, setGroup] = useState<CustomerGroupName | "">("");
  const [status, setStatus] = useState<CustomerStatus | "">("");
  const sel =
    "h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]";
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={`Bulk Edit — ${count} customer${count !== 1 ? "s" : ""}`}
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">
            Assign Group (optional)
          </label>
          <select
            value={group}
            onChange={(e) => setGroup(e.target.value as CustomerGroupName | "")}
            className={sel}
          >
            <option value="">— No change —</option>
            {GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">
            Assign Status (optional)
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as CustomerStatus | "")}
            className={sel}
          >
            <option value="">— No change —</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/-/g, " ")}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onApply(group, status);
              onClose();
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[image:var(--gradient-brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all"
          >
            Apply
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ── Sort indicator ────────────────────────────────────────────────

function SortIcon({ col, current, dir }: { col: string; current: string; dir: "asc" | "desc" }) {
  if (col !== current) return <ChevronUp className="h-3 w-3 opacity-20 ml-1" />;
  return dir === "asc" ? (
    <ChevronUp className="h-3 w-3 ml-1 text-[color:var(--brand-electric)]" />
  ) : (
    <ChevronDown className="h-3 w-3 ml-1 text-[color:var(--brand-electric)]" />
  );
}

// ── Skeleton row ──────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <TableRow className="border-b border-slate-100">
      {Array.from({ length: 10 }).map((_, i) => (
        <TableCell key={i} className={i === 0 ? "pl-6" : i === 9 ? "pr-6" : ""}>
          <div
            className="h-4 rounded bg-slate-100 animate-pulse"
            style={{ width: i === 1 ? "120px" : i === 9 ? "28px" : "80px" }}
          />
        </TableCell>
      ))}
    </TableRow>
  );
}

// ── CustomersTab ──────────────────────────────────────────────────

export function CustomersTab({ onViewCustomer }: { onViewCustomer: (id: string) => void }) {
  const { business } = useBusiness();
  const businessId = business?.id ?? null;

  // ── Server state ──────────────────────────────────────────────
  const { data: dbCustomers = [], isLoading, error: loadError } = useCustomers(businessId);
  const { data: crmSettings } = useCrmSettings(businessId);
  const { data: invoices = [] } = useInvoices(businessId);
  const customers = useMemo(
    () =>
      dbCustomers.map((row) => {
        const customerInvoices = invoices.filter(
          (invoice) =>
            invoice.customerId === row.id &&
            invoice.status !== "cancelled" &&
            invoice.status !== "draft",
        );
        const totalRevenue = customerInvoices.reduce(
          (sum, invoice) => sum + invoiceGrandTotal(invoice),
          0,
        );
        const outstandingAmount =
          Number(row.opening_balance) +
          customerInvoices.reduce((sum, invoice) => sum + Math.max(0, invoiceBalance(invoice)), 0);
        const lastPurchase = customerInvoices.reduce(
          (latest, invoice) => (invoice.createdDate > latest ? invoice.createdDate : latest),
          "",
        );
        return { ...dbToUi(row), totalRevenue, outstandingAmount, lastPurchase };
      }),
    [dbCustomers, invoices],
  );

  const createMutation = useCreateCustomer(businessId);
  const updateMutation = useUpdateCustomer(businessId);
  const bulkUpdateMutation = useBulkUpdateCustomers(businessId);

  // ── Filters ───────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCity, setFilterCity] = useState("all");
  const [sortKey, setSortKey] = useState<"name" | "outstanding" | "lastPurchase">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // ── Pagination ────────────────────────────────────────────────
  const [page, setPage] = useState(1);

  // ── Selection ─────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── Modals ────────────────────────────────────────────────────
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formInitial, setFormInitial] = useState<CustomerFormData>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");

  // ── Derived ───────────────────────────────────────────────────
  const cityOptions = useMemo(() => {
    const cities = [...new Set(customers.map((c) => c.city).filter(Boolean))].sort();
    return [{ value: "all", label: "All Cities" }, ...cities.map((c) => ({ value: c, label: c }))];
  }, [customers]);

  const filtered = useMemo(() => {
    let rows = customers;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q) ||
          c.gstin.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.contactPerson.toLowerCase().includes(q),
      );
    }
    if (filterGroup !== "all") rows = rows.filter((c) => c.group === filterGroup);
    if (filterStatus === "all") rows = rows.filter((c) => c.status !== "archived");
    else rows = rows.filter((c) => c.status === filterStatus);
    if (filterCity !== "all") rows = rows.filter((c) => c.city === filterCity);

    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "outstanding") cmp = a.outstandingAmount - b.outstandingAmount;
      else if (sortKey === "lastPurchase") cmp = a.lastPurchase.localeCompare(b.lastPurchase);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [customers, search, filterGroup, filterStatus, filterCity, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const allPageSelected = pageRows.length > 0 && pageRows.every((r) => selectedIds.has(r.id));

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  function toggleSelectAll() {
    if (allPageSelected) {
      setSelectedIds((prev) => {
        const s = new Set(prev);
        pageRows.forEach((r) => s.delete(r.id));
        return s;
      });
    } else {
      setSelectedIds((prev) => {
        const s = new Set(prev);
        pageRows.forEach((r) => s.add(r.id));
        return s;
      });
    }
  }

  async function handleSave(data: CustomerFormData) {
    if (!businessId) return;
    setSaving(true);
    setFormError("");
    try {
      if (formMode === "create") {
        await createMutation.mutateAsync(
          formToInsert(businessId, data, crmSettings?.default_country),
        );
      } else if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, payload: formToUpdate(data) });
      }
      setFormOpen(false);
      setEditingId(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function openEdit(c: UiCustomer) {
    setFormInitial({
      name: c.name,
      company: c.company,
      contactPerson: c.contactPerson,
      gstin: c.gstin,
      pan: c.pan,
      phone: c.phone,
      email: c.email,
      city: c.city,
      state: c.state,
      billingAddress: c.billingAddress,
      shippingAddress: c.shippingAddress,
      group: c.group,
      creditLimit: c.creditLimit,
      creditDays: c.creditDays,
      status: c.status,
    });
    setEditingId(c.id);
    setFormMode("edit");
    setFormError("");
    setFormOpen(true);
  }

  async function handleDelete(id: string) {
    try {
      await updateMutation.mutateAsync({ id, payload: { status: "archived" } });
      setActionError("");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to archive customer.");
      return;
    }
    setSelectedIds((prev) => {
      const s = new Set(prev);
      s.delete(id);
      return s;
    });
    setDeleteId(null);
  }

  async function handleBulkDelete() {
    const ids = [...selectedIds];
    try {
      await bulkUpdateMutation.mutateAsync({ ids, payload: { status: "archived" } });
      setSelectedIds(new Set());
      setActionError("");
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to archive selected customers.",
      );
    }
  }

  async function handleBulkEdit(group: CustomerGroupName | "", status: CustomerStatus | "") {
    const ids = [...selectedIds];
    const payload: CustomerUpdate = {};
    if (group) payload.customer_group = group;
    if (status) payload.status = status;
    if (Object.keys(payload).length > 0) {
      await bulkUpdateMutation.mutateAsync({ ids, payload });
    }
    setSelectedIds(new Set());
  }

  function exportCSV() {
    const rows = selectedIds.size > 0 ? filtered.filter((c) => selectedIds.has(c.id)) : filtered;
    downloadFile(buildCSV(rows), "customers.csv", "text/csv");
  }

  function exportExcel() {
    const rows = selectedIds.size > 0 ? filtered.filter((c) => selectedIds.has(c.id)) : filtered;
    downloadFile(buildCSV(rows), "customers-excel.csv", "text/csv;charset=utf-8");
  }

  const groupOptions = [
    { value: "all", label: "All Groups" },
    ...GROUPS.map((g) => ({ value: g, label: g })),
  ];
  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "new", label: "New" },
    { value: "at-risk", label: "At Risk" },
    { value: "archived", label: "Archived" },
  ];

  const SortTh = ({ col, label }: { col: typeof sortKey; label: string }) => (
    <TableHead
      className="cursor-pointer select-none whitespace-nowrap"
      onClick={() => toggleSort(col)}
    >
      <span className="inline-flex items-center gap-0.5">
        {label}
        <SortIcon col={col} current={sortKey} dir={sortDir} />
      </span>
    </TableHead>
  );

  const isMutating = updateMutation.isPending || bulkUpdateMutation.isPending;

  return (
    <div className="space-y-4">
      {/* Load error banner */}
      {loadError && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong>Failed to load customers.</strong> {(loadError as Error).message}
          </span>
        </div>
      )}
      {actionError && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {actionError}
        </p>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search name, company, GSTIN, phone, email..."
          className="w-64"
        />
        <Select
          value={filterGroup}
          onChange={(v) => {
            setFilterGroup(v);
            setPage(1);
          }}
          options={groupOptions}
        />
        <Select
          value={filterStatus}
          onChange={(v) => {
            setFilterStatus(v);
            setPage(1);
          }}
          options={statusOptions}
        />
        <Select
          value={filterCity}
          onChange={(v) => {
            setFilterCity(v);
            setPage(1);
          }}
          options={cityOptions}
          className="max-w-[140px]"
        />

        <div className="ml-auto flex items-center gap-2">
          {selectedIds.size > 0 && (
            <>
              <span className="text-xs text-muted-foreground">{selectedIds.size} selected</span>
              <button
                onClick={() => setBulkEditOpen(true)}
                disabled={isMutating}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-foreground hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <Pencil className="h-3.5 w-3.5" /> Bulk Edit
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isMutating}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                {bulkUpdateMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Archive
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          <SecondaryButton icon={Download} onClick={exportCSV}>
            CSV
          </SecondaryButton>
          <SecondaryButton icon={Download} onClick={exportExcel}>
            Excel
          </SecondaryButton>
          <PrimaryButton
            icon={Plus}
            onClick={() => {
              setFormInitial({
                ...EMPTY_FORM,
                creditDays: crmSettings?.default_credit_days ?? EMPTY_FORM.creditDays,
              });
              setFormMode("create");
              setEditingId(null);
              setFormError("");
              setFormOpen(true);
            }}
          >
            Add Customer
          </PrimaryButton>
        </div>
      </div>

      {/* Table */}
      <SectionCard noPadding>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/60">
                <TableHead className="w-10 pl-6">
                  <Checkbox checked={allPageSelected} onChange={toggleSelectAll} />
                </TableHead>
                <SortTh col="name" label="Customer" />
                <TableHead>Company</TableHead>
                <TableHead>GSTIN</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>City</TableHead>
                <SortTh col="outstanding" label="Outstanding" />
                <SortTh col="lastPurchase" label="Last Purchase" />
                <TableHead>Status</TableHead>
                <TableHead className="pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : pageRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10}>
                    {customers.length === 0 ? (
                      <EmptyState
                        icon={Users}
                        title="No customers yet"
                        subtitle="Create your first customer."
                        action={
                          <button
                            onClick={() => {
                              setFormInitial(EMPTY_FORM);
                              setFormMode("create");
                              setEditingId(null);
                              setFormError("");
                              setFormOpen(true);
                            }}
                            className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[image:var(--gradient-brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
                          >
                            <Plus className="h-4 w-4" /> Add Customer
                          </button>
                        }
                      />
                    ) : (
                      <EmptyState
                        icon={Users}
                        title="No customers found"
                        subtitle="Try adjusting your search or filters."
                      />
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((c, i) => (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.03 * i, duration: 0.25 }}
                    className="group cursor-pointer border-b border-slate-100 hover:bg-slate-50/60 transition-colors"
                    onClick={() => onViewCustomer(c.id)}
                  >
                    <TableCell className="pl-6" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(c.id)}
                        onChange={(v) => {
                          setSelectedIds((prev) => {
                            const s = new Set(prev);
                            if (v) s.add(c.id);
                            else s.delete(c.id);
                            return s;
                          });
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={c.name} size="sm" />
                        <div>
                          <p className="text-xs font-semibold text-foreground">{c.name}</p>
                          <p className="text-[11px] text-muted-foreground">{c.customerCode}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs font-medium text-foreground max-w-[130px] truncate">
                        {c.company || "—"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-[11px] text-slate-600">{c.gstin || "—"}</span>
                    </TableCell>
                    <TableCell className="text-xs text-foreground whitespace-nowrap">
                      {c.phone}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.city || "—"}</TableCell>
                    <TableCell>
                      {c.outstandingAmount > 0 ? (
                        <span className="text-xs font-semibold text-red-600">
                          {fmtINR(c.outstandingAmount)}
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-600 font-medium">Nil</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {fmtDate(c.lastPurchase)}
                    </TableCell>
                    <TableCell>
                      <CrmStatusPill status={c.status} />
                    </TableCell>
                    <TableCell className="pr-6" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-foreground transition-colors">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => onViewCustomer(c.id)}>
                            <Eye className="mr-2 h-4 w-4" /> View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(c)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            onClick={() => setDeleteId(c.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Archive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3">
          <p className="text-xs text-muted-foreground">
            {filtered.length} customer{filtered.length !== 1 ? "s" : ""} found
          </p>
          <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
        </div>
      </SectionCard>

      {/* Add / Edit Modal */}
      <ModalShell
        open={formOpen}
        onClose={() => {
          if (!saving) setFormOpen(false);
        }}
        title={formMode === "create" ? "Add Customer" : "Edit Customer"}
        wide
      >
        <CustomerForm
          initial={formInitial}
          isEdit={formMode === "edit"}
          saving={saving}
          serverError={formError}
          onSave={handleSave}
          onCancel={() => {
            if (!saving) setFormOpen(false);
          }}
        />
      </ModalShell>

      {/* Bulk Edit Modal */}
      <BulkEditModal
        open={bulkEditOpen}
        onClose={() => setBulkEditOpen(false)}
        count={selectedIds.size}
        onApply={handleBulkEdit}
      />

      {/* Delete Confirm */}
      <ModalShell open={!!deleteId} onClose={() => setDeleteId(null)} title="Archive Customer">
        <p className="text-sm text-muted-foreground mb-6">
          Archive this customer? It will be hidden from active customer views and can be restored by
          changing its status.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setDeleteId(null)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => deleteId && handleDelete(deleteId)}
            disabled={updateMutation.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Archiving…
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" /> Archive
              </>
            )}
          </button>
        </div>
      </ModalShell>
    </div>
  );
}
