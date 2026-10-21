// ── Cashbook Tab ──────────────────────────────────────────────────────
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { BookOpen, ArrowDownCircle, ArrowUpCircle, Wallet, Plus, X, Printer } from "lucide-react";
import { fmtINR, fmtDate, CashbookEntry } from "@/lib/finance-data";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useFinanceModel } from "@/hooks/useFinanceModel";
import {
  SectionCard,
  StatTile,
  PrimaryButton,
  SecondaryButton,
  EmptyState,
  TableWrapper,
  Th,
  Td,
  Pagination,
} from "@/components/finance/shared";

const PAGE_SIZE = 8;

interface NewEntry {
  date: string;
  description: string;
  type: "in" | "out";
  amount: number;
  reference: string;
}

function blankEntry(): NewEntry {
  return { date: "", description: "", type: "in", amount: 0, reference: "" };
}

export function CashbookTab() {
  const { model, isLoading, isError, error } = useFinanceModel();
  const finance = useFinanceData();
  const entries = model.cashbookEntries;
  const { openingCashBalance, cashIn, cashOut, closingCashBalance } = model;
  const [operationError, setOperationError] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [viewMode, setViewMode] = useState<"daily" | "table">("table");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<NewEntry>(blankEntry());
  const [page, setPage] = useState(1);

  // Filtered entries
  const filtered = useMemo(() => {
    return entries.filter((e) => !dateFilter || e.date === dateFilter);
  }, [entries, dateFilter]);

  // Daily grouped
  const dailyGroups = useMemo(() => {
    const map = new Map<string, CashbookEntry[]>();
    filtered.forEach((e) => {
      if (!map.has(e.date)) map.set(e.date, []);
      map.get(e.date)!.push(e);
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleAdd() {
    if (
      !form.date ||
      !form.description.trim() ||
      !Number.isFinite(form.amount) ||
      form.amount <= 0
    ) {
      setOperationError("Date, description, and an amount greater than zero are required.");
      return;
    }
    const available = entries[0]?.balance ?? openingCashBalance;
    if (form.type === "out" && form.amount > available) {
      setOperationError("Cash out cannot exceed the current cash balance.");
      return;
    }
    setOperationError("");
    try {
      const cashAccount = finance.data?.accounts.find((a) => a.account_type === "Cash");
      await finance.createTransaction.mutateAsync({
        bank_account_id: cashAccount?.id ?? null,
        transaction_type: form.type === "in" ? "income" : "expense",
        status: "completed",
        transaction_date: form.date,
        reference: form.reference || null,
        category: "Cashbook",
        counterparty: "",
        description: form.description.trim(),
        amount: Math.round(form.amount * 100) / 100,
        payment_method: "cash",
        gst_rate: 0,
        has_receipt: false,
        notes: "",
      });
      setForm(blankEntry());
      setDialogOpen(false);
      setPage(1);
    } catch (e) {
      setOperationError((e as Error).message || "Unable to save cashbook entry.");
    }
  }

  function exportCsv() {
    const rows = [
      ["Date", "Description", "Type", "Reference", "Amount", "Balance"],
      ...filtered.map((e) => [
        e.date,
        e.description,
        e.type,
        e.reference ?? "",
        e.amount,
        e.balance,
      ]),
    ];
    const csv = rows
      .map((row) => row.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "finance-cashbook.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading)
    return (
      <p className="rounded-xl border bg-white p-6 text-sm text-muted-foreground">
        Loading cashbook…
      </p>
    );
  if (isError)
    return (
      <p
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700"
      >
        Unable to load cashbook: {(error as Error).message}
      </p>
    );

  function set(field: keyof NewEntry, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
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
      {/* Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Opening Balance"
          value={fmtINR(openingCashBalance)}
          icon={Wallet}
          bg="bg-slate-100"
          iconColor="text-slate-600"
          index={0}
          sub="Cash account opening balance"
        />
        <StatTile
          label="Cash In"
          value={fmtINR(cashIn)}
          icon={ArrowDownCircle}
          bg="bg-emerald-50"
          iconColor="text-emerald-600"
          index={1}
          sub="Total receipts"
        />
        <StatTile
          label="Cash Out"
          value={fmtINR(cashOut)}
          icon={ArrowUpCircle}
          bg="bg-red-50"
          iconColor="text-red-500"
          index={2}
          sub="Total payments"
        />
        <StatTile
          label="Closing Balance"
          value={fmtINR(closingCashBalance)}
          icon={BookOpen}
          bg="bg-indigo-50"
          iconColor="text-indigo-600"
          index={3}
          sub="Current cash on hand"
        />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-muted-foreground">Filter Date:</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
            />
            {dateFilter && (
              <button
                onClick={() => {
                  setDateFilter("");
                  setPage(1);
                }}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Clear
              </button>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-white overflow-hidden">
            <button
              onClick={() => setViewMode("daily")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "daily" ? "bg-[image:var(--gradient-brand)] text-white" : "text-muted-foreground hover:bg-slate-50"}`}
            >
              Daily View
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "table" ? "bg-[image:var(--gradient-brand)] text-white" : "text-muted-foreground hover:bg-slate-50"}`}
            >
              Table View
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <SecondaryButton icon={Printer} onClick={exportCsv}>
            Export CSV
          </SecondaryButton>
          <PrimaryButton icon={Plus} onClick={() => setDialogOpen(true)}>
            Add Entry
          </PrimaryButton>
        </div>
      </div>

      {/* Daily Summary Cards */}
      {viewMode === "daily" && (
        <div className="space-y-4">
          {dailyGroups.length === 0 ? (
            <SectionCard>
              <EmptyState
                icon={BookOpen}
                title="No entries found"
                subtitle="Try selecting a different date or clear the filter."
              />
            </SectionCard>
          ) : (
            dailyGroups.map(([date, dayEntries]) => {
              const dayIn = dayEntries
                .filter((e) => e.type === "in")
                .reduce((s, e) => s + e.amount, 0);
              const dayOut = dayEntries
                .filter((e) => e.type === "out")
                .reduce((s, e) => s + e.amount, 0);
              const dayNet = dayIn - dayOut;
              const closingBal = dayEntries[dayEntries.length - 1]?.balance ?? 0;

              return (
                <motion.div
                  key={date}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                >
                  {/* Date Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 bg-slate-50">
                    <h4 className="text-sm font-semibold text-foreground">{fmtDate(date)}</h4>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-emerald-600 font-semibold">In: {fmtINR(dayIn)}</span>
                      <span className="text-red-500 font-semibold">Out: {fmtINR(dayOut)}</span>
                      <span
                        className={`font-bold ${dayNet >= 0 ? "text-emerald-700" : "text-red-600"}`}
                      >
                        Net: {dayNet >= 0 ? "+" : ""}
                        {fmtINR(dayNet)}
                      </span>
                      <span className="text-indigo-600 font-semibold">
                        Balance: {fmtINR(closingBal)}
                      </span>
                    </div>
                  </div>
                  {/* Transactions list */}
                  <div className="divide-y divide-slate-50">
                    {dayEntries.map((e) => (
                      <div
                        key={e.id}
                        className="flex items-center justify-between px-5 py-2.5 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-full ${e.type === "in" ? "bg-emerald-50" : "bg-red-50"}`}
                          >
                            {e.type === "in" ? (
                              <ArrowDownCircle className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <ArrowUpCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{e.description}</p>
                            {e.reference && (
                              <p className="text-xs text-muted-foreground font-mono">
                                {e.reference}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-sm font-semibold ${e.type === "in" ? "text-emerald-600" : "text-red-500"}`}
                          >
                            {e.type === "out" ? "−" : "+"}
                            {fmtINR(e.amount)}
                          </p>
                          <p className="text-xs text-muted-foreground">Bal: {fmtINR(e.balance)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <SectionCard title="All Cash Entries" subtitle={`${filtered.length} records`} noPadding>
          <TableWrapper>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Description</Th>
                <Th>Type</Th>
                <Th>Reference</Th>
                <Th right>Amount</Th>
                <Th right>Balance</Th>
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={BookOpen}
                      title="No entries found"
                      subtitle="Try adjusting the date filter."
                    />
                  </td>
                </tr>
              ) : (
                pageData.map((e) => (
                  <motion.tr
                    key={e.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <Td>
                      <span className="text-xs text-muted-foreground">{fmtDate(e.date)}</span>
                    </Td>
                    <Td className="font-medium">{e.description}</Td>
                    <Td>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold border ${e.type === "in" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                        {e.type === "in" ? "Cash In" : "Cash Out"}
                      </span>
                    </Td>
                    <Td>
                      <span className="font-mono text-xs text-muted-foreground">
                        {e.reference ?? "—"}
                      </span>
                    </Td>
                    <Td right>
                      <span
                        className={`font-semibold ${e.type === "in" ? "text-emerald-600" : "text-red-500"}`}
                      >
                        {e.type === "out" ? "−" : "+"}
                        {fmtINR(e.amount)}
                      </span>
                    </Td>
                    <Td right>
                      <span className="font-semibold text-indigo-600">{fmtINR(e.balance)}</span>
                    </Td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </TableWrapper>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </SectionCard>
      )}

      {/* Add Entry Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl bg-white shadow-xl mx-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-sm font-semibold text-foreground">Add Cash Entry</h2>
              <button
                onClick={() => setDialogOpen(false)}
                className="rounded-lg p-1 hover:bg-slate-100 text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Date *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => set("date", e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Description *</label>
                <input
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                  placeholder="e.g. Cash sales — daily"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Type *</label>
                  <select
                    value={form.type}
                    onChange={(e) => set("type", e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                  >
                    <option value="in">Cash In</option>
                    <option value="out">Cash Out</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Amount (₹) *</label>
                  <input
                    type="number"
                    value={form.amount || ""}
                    onChange={(e) => set("amount", parseFloat(e.target.value) || 0)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Reference</label>
                <input
                  value={form.reference}
                  onChange={(e) => set("reference", e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                  placeholder="REF-001 (optional)"
                />
              </div>
              {/* Balance preview */}
              {form.amount > 0 && (
                <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                  <p className="text-xs text-muted-foreground">Estimated new balance:</p>
                  <p className="text-sm font-bold text-indigo-600 mt-0.5">
                    {fmtINR(
                      form.type === "in"
                        ? (entries[entries.length - 1]?.balance ?? openingCashBalance) + form.amount
                        : (entries[entries.length - 1]?.balance ?? openingCashBalance) -
                            form.amount,
                    )}
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
              <button
                onClick={() => setDialogOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-foreground hover:bg-slate-50"
              >
                Cancel
              </button>
              <PrimaryButton onClick={handleAdd}>Save Entry</PrimaryButton>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
