// ── Leads Tab ─────────────────────────────────────────────────────
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  UserCheck,
  Download,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
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
  fmtINR,
  fmtDate,
  LEAD_STATUS_LABELS,
  LEAD_SOURCE_LABELS,
  type Lead,
  type LeadStatus,
  type LeadSource,
  type LeadPriority,
} from "@/lib/crm-data";
import { useBusiness } from "@/contexts/BusinessContext";
import {
  useConvertCrmLead,
  useCrmLeads,
  useDeleteCrmLead,
  useSaveCrmLead,
} from "@/hooks/useCrmQuery";
import type { CrmLead } from "@/services/crm";
import {
  SectionCard,
  SearchInput,
  Select,
  Pagination,
  PrimaryButton,
  SecondaryButton,
  EmptyState,
  CrmStatusPill,
  PriorityBadge,
  ModalShell,
  Avatar,
} from "@/components/crm/shared";

const PAGE_SIZE = 10;

function fromDb(row: CrmLead): Lead {
  return {
    id: row.id,
    leadCode: row.lead_code,
    name: row.name,
    company: row.company,
    contactPerson: row.contact_person,
    phone: row.phone,
    email: row.email ?? "",
    source: row.source as LeadSource,
    status: row.status,
    expectedRevenue: Number(row.expected_revenue),
    assignedUser: row.assigned_user,
    priority: row.priority,
    createdDate: row.created_at.slice(0, 10),
    convertedCustomerId: row.converted_customer_id ?? undefined,
  };
}

type SortKey = "name" | "expectedRevenue" | "createdDate" | "status" | "priority";
type SortDir = "asc" | "desc";

const EMPTY_FORM = {
  name: "",
  company: "",
  contactPerson: "",
  phone: "",
  email: "",
  source: "website" as LeadSource,
  status: "new" as LeadStatus,
  expectedRevenue: 0,
  assignedUser: "Arjun Mehta",
  priority: "medium" as LeadPriority,
};

const ASSIGNED_USERS = [
  "Arjun Mehta",
  "Divya Krishnan",
  "Rohan Verma",
  "Sneha Patel",
  "Karan Malhotra",
];

function LeadForm({
  initial,
  isEdit,
  onSave,
  onCancel,
}: {
  initial: typeof EMPTY_FORM;
  isEdit: boolean;
  onSave: (data: typeof EMPTY_FORM) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set<K extends keyof typeof EMPTY_FORM>(k: K, v: (typeof EMPTY_FORM)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Lead name is required";
    if (!form.company.trim()) e.company = "Company is required";
    return e;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    onSave(form);
  }

  const inputCls =
    "h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition-colors focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)] placeholder:text-slate-400";
  const selectCls =
    "h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none transition-colors focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]";
  const labelCls = "mb-1 block text-xs font-medium text-foreground";
  const errCls = "mt-0.5 text-[11px] text-red-500";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <div className="col-span-2">
          <label className={labelCls}>Lead Name *</label>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Riya Patel"
            className={inputCls}
          />
          {errors.name && <p className={errCls}>{errors.name}</p>}
        </div>
        <div>
          <label className={labelCls}>Company *</label>
          <input
            value={form.company}
            onChange={(e) => set("company", e.target.value)}
            placeholder="e.g. Metro Traders"
            className={inputCls}
          />
          {errors.company && <p className={errCls}>{errors.company}</p>}
        </div>
        <div>
          <label className={labelCls}>Contact Person</label>
          <input
            value={form.contactPerson}
            onChange={(e) => set("contactPerson", e.target.value)}
            placeholder="e.g. Riya Patel"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Phone</label>
          <input
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+91 98765 43210"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="riya@example.com"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Source</label>
          <select
            value={form.source}
            onChange={(e) => set("source", e.target.value as LeadSource)}
            className={selectCls}
          >
            {(Object.keys(LEAD_SOURCE_LABELS) as LeadSource[]).map((s) => (
              <option key={s} value={s}>
                {LEAD_SOURCE_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Status</label>
          <select
            value={form.status}
            onChange={(e) => set("status", e.target.value as LeadStatus)}
            className={selectCls}
          >
            {(Object.keys(LEAD_STATUS_LABELS) as LeadStatus[]).map((s) => (
              <option key={s} value={s}>
                {LEAD_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Expected Revenue (₹)</label>
          <input
            type="number"
            min={0}
            value={form.expectedRevenue}
            onChange={(e) => set("expectedRevenue", Number(e.target.value))}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Priority</label>
          <select
            value={form.priority}
            onChange={(e) => set("priority", e.target.value as LeadPriority)}
            className={selectCls}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Assigned User</label>
          <select
            value={form.assignedUser}
            onChange={(e) => set("assignedUser", e.target.value)}
            className={selectCls}
          >
            {ASSIGNED_USERS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-[image:var(--gradient-brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
        >
          {isEdit ? "Save Changes" : "Add Lead"}
        </button>
      </div>
    </form>
  );
}

function buildCSV(rows: Lead[]): string {
  const headers = [
    "Lead Code",
    "Name",
    "Company",
    "Contact Person",
    "Phone",
    "Email",
    "Source",
    "Status",
    "Expected Revenue",
    "Assigned User",
    "Priority",
    "Created Date",
  ];
  const escape = (v: string | number | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [
    headers.join(","),
    ...rows.map((l) =>
      [
        l.leadCode,
        l.name,
        l.company,
        l.contactPerson,
        l.phone,
        l.email,
        LEAD_SOURCE_LABELS[l.source],
        LEAD_STATUS_LABELS[l.status],
        l.expectedRevenue,
        l.assignedUser,
        l.priority,
        l.createdDate,
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

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown className="h-3 w-3 text-slate-400" />;
  return sortDir === "asc" ? (
    <ChevronUp className="h-3 w-3 text-blue-600" />
  ) : (
    <ChevronDown className="h-3 w-3 text-blue-600" />
  );
}

export function LeadsTab() {
  const { business } = useBusiness();
  const businessId = business?.id ?? null;
  const leadsQuery = useCrmLeads(businessId);
  const saveLead = useSaveCrmLead(businessId);
  const deleteLead = useDeleteCrmLead(businessId);
  const convertLead = useConvertCrmLead(businessId);
  const localLeads = (leadsQuery.data ?? []).map(fromDb);
  const [errorMessage, setErrorMessage] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("createdDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formInitial, setFormInitial] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  const filtered = useMemo(() => {
    let rows = [...localLeads];
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.company.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.phone.toLowerCase().includes(q) ||
          l.contactPerson.toLowerCase().includes(q),
      );
    }
    if (filterStatus !== "all") rows = rows.filter((l) => l.status === filterStatus);
    if (filterSource !== "all") rows = rows.filter((l) => l.source === filterSource);
    if (filterPriority !== "all") rows = rows.filter((l) => l.priority === filterPriority);
    rows.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "expectedRevenue") cmp = a.expectedRevenue - b.expectedRevenue;
      else if (sortKey === "createdDate") cmp = a.createdDate.localeCompare(b.createdDate);
      else if (sortKey === "status") cmp = a.status.localeCompare(b.status);
      else if (sortKey === "priority") {
        const order = { high: 0, medium: 1, low: 2 };
        cmp = order[a.priority] - order[b.priority];
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [localLeads, search, filterStatus, filterSource, filterPriority, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function openCreate() {
    setFormInitial(EMPTY_FORM);
    setFormMode("create");
    setEditingId(null);
    setFormOpen(true);
  }

  function openEdit(lead: Lead) {
    setFormInitial({
      name: lead.name,
      company: lead.company,
      contactPerson: lead.contactPerson,
      phone: lead.phone,
      email: lead.email,
      source: lead.source,
      status: lead.status,
      expectedRevenue: lead.expectedRevenue,
      assignedUser: lead.assignedUser,
      priority: lead.priority,
    });
    setFormMode("edit");
    setEditingId(lead.id);
    setFormOpen(true);
  }

  async function handleSave(data: typeof EMPTY_FORM) {
    if (!businessId) return setErrorMessage("Your business account is not available.");
    try {
      setErrorMessage("");
      await saveLead.mutateAsync({
        id: formMode === "edit" ? (editingId ?? undefined) : undefined,
        payload: {
          name: data.name,
          company: data.company,
          contact_person: data.contactPerson,
          phone: data.phone,
          email: data.email || null,
          source: data.source,
          status: data.status,
          expected_revenue: data.expectedRevenue,
          assigned_user: data.assignedUser,
          priority: data.priority,
        },
      });
      setFormOpen(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save lead.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteLead.mutateAsync(id);
      setErrorMessage("");
      setDeleteId(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to delete lead.");
    }
  }

  async function handleConvert(lead: Lead) {
    if (!businessId) return setErrorMessage("Your business account is not available.");
    try {
      await convertLead.mutateAsync(lead.id);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to convert lead.");
    }
  }

  const statusOptions = [
    { value: "all", label: "All Status" },
    ...(Object.keys(LEAD_STATUS_LABELS) as LeadStatus[]).map((s) => ({
      value: s,
      label: LEAD_STATUS_LABELS[s],
    })),
  ];
  const sourceOptions = [
    { value: "all", label: "All Sources" },
    ...(Object.keys(LEAD_SOURCE_LABELS) as LeadSource[]).map((s) => ({
      value: s,
      label: LEAD_SOURCE_LABELS[s],
    })),
  ];
  const priorityOptions = [
    { value: "all", label: "All Priority" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
  ];

  const thCls = "cursor-pointer select-none";

  return (
    <div className="space-y-6">
      {errorMessage && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {errorMessage}
        </p>
      )}
      {leadsQuery.isLoading && <p className="text-sm text-muted-foreground">Loading leads…</p>}
      {leadsQuery.error && (
        <p role="alert" className="text-sm text-red-700">
          Could not load leads: {(leadsQuery.error as Error).message}
        </p>
      )}
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search leads…"
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
          value={filterSource}
          onChange={(v) => {
            setFilterSource(v);
            setPage(1);
          }}
          options={sourceOptions}
        />
        <Select
          value={filterPriority}
          onChange={(v) => {
            setFilterPriority(v);
            setPage(1);
          }}
          options={priorityOptions}
        />
        <div className="ml-auto flex items-center gap-2">
          <SecondaryButton
            icon={Download}
            onClick={() => downloadFile(buildCSV(filtered), "leads.csv", "text/csv")}
          >
            Export CSV
          </SecondaryButton>
          <PrimaryButton icon={Plus} onClick={openCreate}>
            Add Lead
          </PrimaryButton>
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-3 text-xs">
        {(
          [
            "new",
            "contacted",
            "qualified",
            "proposal",
            "negotiation",
            "won",
            "lost",
          ] as LeadStatus[]
        ).map((s) => {
          const count = localLeads.filter((l) => l.status === s).length;
          return (
            <button
              key={s}
              onClick={() => {
                setFilterStatus(filterStatus === s ? "all" : s);
                setPage(1);
              }}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-semibold transition-colors ${filterStatus === s ? "bg-[image:var(--gradient-brand)] text-white border-transparent" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
            >
              {LEAD_STATUS_LABELS[s]} <span className="opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <SectionCard noPadding>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/60">
                <TableHead className={thCls} onClick={() => handleSort("name")}>
                  <span className="inline-flex items-center gap-1">
                    Lead Name <SortIcon col="name" sortKey={sortKey} sortDir={sortDir} />
                  </span>
                </TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Phone / Email</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className={thCls} onClick={() => handleSort("status")}>
                  <span className="inline-flex items-center gap-1">
                    Status <SortIcon col="status" sortKey={sortKey} sortDir={sortDir} />
                  </span>
                </TableHead>
                <TableHead
                  className={`${thCls} text-right`}
                  onClick={() => handleSort("expectedRevenue")}
                >
                  <span className="inline-flex items-center justify-end gap-1">
                    Expected Rev{" "}
                    <SortIcon col="expectedRevenue" sortKey={sortKey} sortDir={sortDir} />
                  </span>
                </TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead className={thCls} onClick={() => handleSort("priority")}>
                  <span className="inline-flex items-center gap-1">
                    Priority <SortIcon col="priority" sortKey={sortKey} sortDir={sortDir} />
                  </span>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9}>
                    <EmptyState
                      icon={Search}
                      title="No leads found"
                      subtitle="Try adjusting your search or filters."
                    />
                  </TableCell>
                </TableRow>
              )}
              {pageRows.map((lead, i) => (
                <motion.tr
                  key={lead.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.25 }}
                  className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={lead.name} size="sm" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">{lead.leadCode}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-foreground">{lead.company}</p>
                    <p className="text-xs text-muted-foreground">{lead.contactPerson}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs text-foreground">{lead.phone}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                      {lead.email}
                    </p>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {LEAD_SOURCE_LABELS[lead.source]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <CrmStatusPill status={lead.status} label={LEAD_STATUS_LABELS[lead.status]} />
                  </TableCell>
                  <TableCell className="text-right font-semibold text-sm text-foreground">
                    {fmtINR(lead.expectedRevenue)}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-foreground">{lead.assignedUser}</span>
                  </TableCell>
                  <TableCell>
                    <PriorityBadge priority={lead.priority} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {!lead.convertedCustomerId && lead.status !== "lost" && (
                        <button
                          onClick={() => handleConvert(lead)}
                          title="Convert to Customer"
                          className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition-colors"
                        >
                          <UserCheck className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(lead)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(lead.id)}
                        className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="border-t border-slate-100 px-6 py-4">
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      </SectionCard>

      {/* Create/Edit Modal */}
      <ModalShell
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={formMode === "create" ? "Add New Lead" : "Edit Lead"}
        wide
      >
        <LeadForm
          initial={formInitial}
          isEdit={formMode === "edit"}
          onSave={handleSave}
          onCancel={() => setFormOpen(false)}
        />
      </ModalShell>

      {/* Delete Confirm Modal */}
      <ModalShell open={deleteId !== null} onClose={() => setDeleteId(null)} title="Delete Lead">
        <p className="text-sm text-foreground mb-6">
          Are you sure you want to delete this lead? This action cannot be undone.
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
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </ModalShell>
    </div>
  );
}
