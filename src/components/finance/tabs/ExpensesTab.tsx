// ── Expenses Tab ──────────────────────────────────────────────────────
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingDown, Eye, Trash2, X, Download, Plus, Check } from "lucide-react";
import {
  expenseCategories,
  fmtINR,
  fmtDate,
  ExpenseEntry,
  PaymentMethod,
} from "@/lib/finance-data";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useFinanceModel } from "@/hooks/useFinanceModel";
import {
  SectionCard,
  StatTile,
  SearchInput,
  FilterSelect,
  Pagination,
  PrimaryButton,
  SecondaryButton,
  EmptyState,
  TableWrapper,
  Th,
  Td,
} from "@/components/finance/shared";

const PAGE_SIZE = 8;
const PAYMENT_METHODS: PaymentMethod[] = ["Cash", "UPI", "Bank Transfer", "Cheque", "Card"];
const MONTHS = [
  { value: "", label: "All Months" },
  ...Array.from({ length: 12 }, (_, offset) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - offset);
    return {
      value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: date.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
    };
  }),
];

const CAT_COLORS: Record<string, string> = {
  Rent: "#6366f1",
  Electricity: "#f59e0b",
  Salary: "#10b981",
  Fuel: "#f43f5e",
  "Office Supplies": "#3b82f6",
  Marketing: "#ec4899",
  Internet: "#14b8a6",
  Software: "#8b5cf6",
  Travel: "#f97316",
  Maintenance: "#64748b",
  "Professional Fees": "#0ea5e9",
  Insurance: "#a855f7",
};

function newBlank(): Omit<ExpenseEntry, "id"> {
  return {
    vendor: "",
    reference: "",
    amount: 0,
    date: "",
    category: expenseCategories[0],
    paymentMethod: "Bank Transfer",
    notes: "",
    hasReceipt: false,
    gstRate: 18,
  };
}

export function ExpensesTab() {
  const { model, isLoading, isError, error } = useFinanceModel();
  const finance = useFinanceData();
  const entries = model.expenseEntries;
  const [operationError, setOperationError] = useState("");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [pmFilter, setPmFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(newBlank());
  const [viewEntry, setViewEntry] = useState<ExpenseEntry | null>(null);
  const [accountId, setAccountId] = useState("");

  // Stats
  const totalExpenses = useMemo(() => entries.reduce((s, e) => s + e.amount, 0), [entries]);
  const thisMonth = useMemo(
    () =>
      entries
        .filter((e) => e.date.startsWith(new Date().toISOString().slice(0, 7)))
        .reduce((s, e) => s + e.amount, 0),
    [entries],
  );
  const largestExpense = useMemo(
    () => entries.reduce((max, e) => Math.max(max, e.amount), 0),
    [entries],
  );

  // Filtered
  const filtered = useMemo(() => {
    return entries
      .filter((e) => {
        const q = search.toLowerCase();
        return !q || e.vendor.toLowerCase().includes(q) || e.reference.toLowerCase().includes(q);
      })
      .filter((e) => !catFilter || e.category === catFilter)
      .filter((e) => !pmFilter || e.paymentMethod === pmFilter)
      .filter((e) => !monthFilter || e.date.startsWith(monthFilter))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [entries, search, catFilter, pmFilter, monthFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleAdd() {
    if (
      !form.vendor.trim() ||
      !form.amount ||
      !form.date ||
      !Number.isFinite(form.amount) ||
      form.amount <= 0
    ) {
      setOperationError("Vendor, date, and an amount greater than zero are required.");
      return;
    }
    setOperationError("");
    try {
      await finance.createTransaction.mutateAsync({
        bank_account_id: accountId || null,
        transaction_type: "expense",
        status: "completed",
        transaction_date: form.date,
        reference: form.reference || null,
        category: form.category,
        counterparty: form.vendor.trim(),
        description: form.vendor.trim(),
        amount: Math.round(form.amount * 100) / 100,
        payment_method: (
          {
            Cash: "cash",
            UPI: "upi",
            "Bank Transfer": "bank-transfer",
            Cheque: "cheque",
            Card: "card",
            Other: "other",
          } as const
        )[form.paymentMethod],
        gst_rate: form.gstRate,
        has_receipt: form.hasReceipt,
        notes: form.notes ?? "",
      });
      setForm(newBlank());
      setAccountId("");
      setDialogOpen(false);
      setPage(1);
    } catch (e) {
      setOperationError((e as Error).message || "Unable to save expense.");
    }
  }

  async function handleDelete(id: string) {
    if (
      !(finance.data?.transactions ?? []).some(
        (t) => t.id === id && t.transaction_type === "expense",
      )
    )
      return;
    try {
      await finance.deleteTransaction.mutateAsync(id);
      setOperationError("");
    } catch (e) {
      setOperationError((e as Error).message || "Unable to delete expense.");
    }
  }

  function handleExport() {
    const rows = [
      ["Date", "Vendor", "Reference", "Category", "Payment method", "Amount"],
      ...filtered.map((e) => [
        e.date,
        e.vendor,
        e.reference,
        e.category,
        e.paymentMethod,
        e.amount,
      ]),
    ];
    const csv = rows
      .map((row) => row.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "finance-expenses.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading)
    return (
      <p className="rounded-xl border bg-white p-6 text-sm text-muted-foreground">
        Loading expenses…
      </p>
    );
  if (isError)
    return (
      <p
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700"
      >
        Unable to load expenses: {(error as Error).message}
      </p>
    );

  function set(field: keyof typeof form, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function openWithCategory(cat: string) {
    setForm((prev) => ({ ...prev, category: cat }));
    setDialogOpen(true);
  }

  const quickCategories = ["Rent", "Salary", "Marketing", "Travel"];
  const quickCatColors: Record<string, string> = {
    Rent: "bg-indigo-50 text-indigo-700 border-indigo-200",
    Salary: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Marketing: "bg-pink-50 text-pink-700 border-pink-200",
    Travel: "bg-orange-50 text-orange-700 border-orange-200",
  };

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
      {/* Stat Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Total Expenses"
          value={fmtINR(totalExpenses)}
          icon={TrendingDown}
          bg="bg-red-50"
          iconColor="text-red-500"
          index={0}
        />
        <StatTile
          label="This Month"
          value={fmtINR(thisMonth)}
          icon={TrendingDown}
          bg="bg-orange-50"
          iconColor="text-orange-500"
          index={1}
          sub={new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
        />
        <StatTile
          label="Largest Expense"
          value={fmtINR(largestExpense)}
          icon={TrendingDown}
          bg="bg-rose-50"
          iconColor="text-rose-600"
          index={2}
        />
        <StatTile
          label="Total Entries"
          value={String(entries.length)}
          icon={TrendingDown}
          bg="bg-slate-100"
          iconColor="text-slate-500"
          index={3}
          sub="All time"
        />
      </div>

      {/* Quick Add Buttons */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs font-medium text-muted-foreground self-center mr-1">
          Quick Add:
        </span>
        {quickCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => openWithCategory(cat)}
            className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors hover:opacity-80 ${quickCatColors[cat]}`}
          >
            + {cat}
          </button>
        ))}
      </div>

      {/* Table */}
      <SectionCard
        title="Expense Records"
        subtitle={`${filtered.length} entries`}
        action={
          <div className="flex items-center gap-2">
            <PrimaryButton
              icon={Plus}
              onClick={() => {
                setForm(newBlank());
                setDialogOpen(true);
              }}
            >
              Add Expense
            </PrimaryButton>
            <SecondaryButton icon={Download} onClick={handleExport}>
              Export
            </SecondaryButton>
          </div>
        }
        noPadding
      >
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-slate-100">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search vendor, reference..."
            className="w-64"
          />
          <FilterSelect
            value={catFilter}
            onChange={(v) => {
              setCatFilter(v);
              setPage(1);
            }}
            options={[
              { value: "", label: "All Categories" },
              ...expenseCategories.map((c) => ({ value: c, label: c })),
            ]}
          />
          <FilterSelect
            value={pmFilter}
            onChange={(v) => {
              setPmFilter(v);
              setPage(1);
            }}
            options={[
              { value: "", label: "All Methods" },
              ...PAYMENT_METHODS.map((m) => ({ value: m, label: m })),
            ]}
          />
          <FilterSelect
            value={monthFilter}
            onChange={(v) => {
              setMonthFilter(v);
              setPage(1);
            }}
            options={MONTHS}
          />
        </div>

        <TableWrapper>
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>Vendor</Th>
              <Th>Reference</Th>
              <Th>Category</Th>
              <Th>Payment Method</Th>
              <Th>Receipt</Th>
              <Th right>Amount</Th>
              <Th>GST%</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <EmptyState
                    icon={TrendingDown}
                    title="No expense records"
                    subtitle="Try adjusting your filters."
                  />
                </td>
              </tr>
            ) : (
              pageData.map((e) => (
                <motion.tr
                  key={e.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <Td>
                    <span className="text-xs text-muted-foreground">{fmtDate(e.date)}</span>
                  </Td>
                  <Td className="font-medium">{e.vendor}</Td>
                  <Td>
                    <span className="font-mono text-xs text-muted-foreground">{e.reference}</span>
                  </Td>
                  <Td>
                    <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                      <span
                        className="inline-block h-2 w-2 rounded-full flex-shrink-0"
                        style={{ background: CAT_COLORS[e.category] ?? "#94a3b8" }}
                      />
                      {e.category}
                    </span>
                  </Td>
                  <Td>
                    <span className="text-xs text-muted-foreground">{e.paymentMethod}</span>
                  </Td>
                  <Td>
                    {e.hasReceipt ? (
                      <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                        <Check className="h-3.5 w-3.5" /> Yes
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </Td>
                  <Td right>
                    <span className="font-semibold text-red-500">{fmtINR(e.amount)}</span>
                  </Td>
                  <Td>
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                      {e.gstRate}%
                    </span>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setViewEntry(e)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      {(finance.data?.transactions ?? []).some(
                        (t) => t.id === e.id && t.transaction_type === "expense",
                      ) && (
                        <button
                          onClick={() => void handleDelete(e.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </Td>
                </motion.tr>
              ))
            )}
          </tbody>
        </TableWrapper>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </SectionCard>

      {/* Add Expense Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-2xl bg-white shadow-xl mx-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-sm font-semibold text-foreground">Add Expense</h2>
              <button
                onClick={() => setDialogOpen(false)}
                className="rounded-lg p-1 hover:bg-slate-100 text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Vendor *</label>
                  <input
                    value={form.vendor}
                    onChange={(e) => set("vendor", e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
                    placeholder="Vendor name"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Reference</label>
                  <input
                    value={form.reference}
                    onChange={(e) => set("reference", e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
                    placeholder="EXP-REF-001"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Amount paid, incl. GST (₹) *
                  </label>
                  <input
                    type="number"
                    value={form.amount || ""}
                    onChange={(e) => set("amount", parseFloat(e.target.value) || 0)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Date *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => set("date", e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => set("category", e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
                  >
                    {expenseCategories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Payment Method
                  </label>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) => set("paymentMethod", e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Paid from account (optional)
                  </label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value="">Unassigned</option>
                    {(finance.data?.accounts ?? [])
                      .filter((a) => a.is_active)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.bank_name} · {a.account_number_masked}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">GST Rate (%)</label>
                  <select
                    value={form.gstRate}
                    onChange={(e) => set("gstRate", parseFloat(e.target.value))}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
                  >
                    {[0, 5, 12, 18, 28].map((r) => (
                      <option key={r} value={r}>
                        {r}%
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={form.hasReceipt}
                      onChange={(e) => set("hasReceipt", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
                    />
                    <span className="text-xs font-medium text-muted-foreground">
                      Receipt attached
                    </span>
                  </label>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 resize-none"
                  placeholder="Optional notes..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
              <button
                onClick={() => setDialogOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-foreground hover:bg-slate-50"
              >
                Cancel
              </button>
              <PrimaryButton onClick={handleAdd}>Save Expense</PrimaryButton>
            </div>
          </motion.div>
        </div>
      )}

      {/* View Dialog */}
      {viewEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl bg-white shadow-xl mx-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-sm font-semibold text-foreground">
                Expense Details — {viewEntry.id}
              </h2>
              <button
                onClick={() => setViewEntry(null)}
                className="rounded-lg p-1 hover:bg-slate-100 text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              {[
                ["Vendor", viewEntry.vendor],
                ["Reference", viewEntry.reference],
                ["Date", fmtDate(viewEntry.date)],
                ["Category", viewEntry.category],
                ["Payment Method", viewEntry.paymentMethod],
                ["Amount", fmtINR(viewEntry.amount)],
                ["GST Rate", `${viewEntry.gstRate}%`],
                ["Receipt", viewEntry.hasReceipt ? "Yes" : "No"],
                ["Notes", viewEntry.notes || "—"],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-foreground">{val}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 px-6 py-4 text-right">
              <button
                onClick={() => setViewEntry(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
