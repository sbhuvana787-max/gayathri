import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  Download,
  CheckCircle,
  X,
  Info,
} from "lucide-react";
import { fmtINR, fmtDate, type Transaction, type TransactionStatus } from "@/lib/finance-data";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useFinanceModel } from "@/hooks/useFinanceModel";
import {
  SectionCard,
  StatTile,
  StatusPill,
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

const PAGE_SIZE = 10;

export function TransactionsTab() {
  const { model, isLoading, isError, error } = useFinanceModel();
  const finance = useFinanceData();
  const transactions = model.transactions;
  const [operationError, setOperationError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [methodFilter, setMethodFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);

  const totalIncome = transactions
    .filter((t) => t.type === "Income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions
    .filter((t) => t.type === "Expense")
    .reduce((s, t) => s + t.amount, 0);
  const totalTransfers = transactions
    .filter((t) => t.type === "Transfer" && t.transferDirection !== "incoming")
    .reduce((s, t) => s + t.amount, 0);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        t.description.toLowerCase().includes(q) ||
        t.reference.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q);
      const matchType = typeFilter === "All" || t.type === typeFilter;
      const matchStatus = statusFilter === "All" || t.status === statusFilter;
      const matchMethod = methodFilter === "All" || t.paymentMethod === methodFilter;
      const matchFrom = !dateFrom || t.date >= dateFrom;
      const matchTo = !dateTo || t.date <= dateTo;
      return matchSearch && matchType && matchStatus && matchMethod && matchFrom && matchTo;
    });
  }, [transactions, search, typeFilter, statusFilter, methodFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function reconcile(id: string) {
    if (!(finance.data?.transactions ?? []).some((t) => t.id === id)) return;
    try {
      await finance.updateTransaction.mutateAsync({ id, patch: { status: "reconciled" } });
      setOperationError("");
    } catch (e) {
      setOperationError((e as Error).message || "Unable to reconcile transaction.");
    }
  }

  function handleExportCSV() {
    const headers = [
      "Date",
      "Reference",
      "Description",
      "Account",
      "Category",
      "Payment Method",
      "Type",
      "Amount",
      "Status",
    ];
    const rows = filtered.map((t) => [
      t.date,
      t.reference,
      t.description,
      t.account,
      t.category,
      t.paymentMethod,
      t.type,
      t.amount,
      t.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading)
    return (
      <p className="rounded-xl border bg-white p-6 text-sm text-muted-foreground">
        Loading transactions…
      </p>
    );
  if (isError)
    return (
      <p
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700"
      >
        Unable to load transactions: {(error as Error).message}
      </p>
    );

  function amountColor(type: string) {
    if (type === "Income") return "text-emerald-600";
    if (type === "Expense") return "text-red-500";
    return "text-blue-600";
  }

  function amountPrefix(type: string) {
    if (type === "Income") return "+";
    if (type === "Expense") return "-";
    return "↔";
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
      {/* Stat Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Total Transactions"
          value={String(transactions.length)}
          sub="All time records"
          icon={ArrowRightLeft}
          bg="bg-indigo-50"
          iconColor="text-indigo-600"
          index={0}
        />
        <StatTile
          label="Total Income"
          value={fmtINR(totalIncome)}
          sub={`${transactions.filter((t) => t.type === "Income").length} transactions`}
          icon={TrendingUp}
          bg="bg-emerald-50"
          iconColor="text-emerald-600"
          index={1}
        />
        <StatTile
          label="Total Expenses"
          value={fmtINR(totalExpenses)}
          sub={`${transactions.filter((t) => t.type === "Expense").length} transactions`}
          icon={TrendingDown}
          bg="bg-red-50"
          iconColor="text-red-500"
          index={2}
        />
        <StatTile
          label="Total Transfers"
          value={fmtINR(totalTransfers)}
          sub={`${transactions.filter((t) => t.type === "Transfer").length} transactions`}
          icon={ArrowRightLeft}
          bg="bg-blue-50"
          iconColor="text-blue-600"
          index={3}
        />
      </div>

      {/* Filter Bar + Export */}
      <SectionCard
        title="Transaction Ledger"
        subtitle={`${filtered.length} of ${transactions.length} transactions`}
        action={
          <SecondaryButton icon={Download} onClick={handleExportCSV}>
            Export CSV
          </SecondaryButton>
        }
        noPadding
      >
        {/* Filters */}
        <div className="flex flex-wrap gap-3 px-6 py-4 border-b border-slate-100">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search description or reference..."
            className="w-56"
          />
          <FilterSelect
            value={typeFilter}
            onChange={(v) => {
              setTypeFilter(v);
              setPage(1);
            }}
            options={[
              { value: "All", label: "All Types" },
              { value: "Income", label: "Income" },
              { value: "Expense", label: "Expense" },
              { value: "Transfer", label: "Transfer" },
            ]}
          />
          <FilterSelect
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
            options={[
              { value: "All", label: "All Statuses" },
              { value: "Completed", label: "Completed" },
              { value: "Pending", label: "Pending" },
              { value: "Failed", label: "Failed" },
              { value: "Reconciled", label: "Reconciled" },
            ]}
          />
          <FilterSelect
            value={methodFilter}
            onChange={(v) => {
              setMethodFilter(v);
              setPage(1);
            }}
            options={[
              { value: "All", label: "All Methods" },
              { value: "Cash", label: "Cash" },
              { value: "UPI", label: "UPI" },
              { value: "Bank Transfer", label: "Bank Transfer" },
              { value: "Cheque", label: "Cheque" },
              { value: "Card", label: "Card" },
            ]}
          />
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
            />
          </div>
        </div>

        {/* Table */}
        {paginated.length === 0 ? (
          <EmptyState
            icon={ArrowRightLeft}
            title="No transactions found"
            subtitle="Try adjusting your filters."
          />
        ) : (
          <TableWrapper>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Reference</Th>
                <Th>Description</Th>
                <Th>Account</Th>
                <Th>Category</Th>
                <Th>Method</Th>
                <Th>Type</Th>
                <Th right>Amount</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((txn, idx) => (
                <motion.tr
                  key={txn.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.03 }}
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setSelectedTxn(txn)}
                >
                  <Td>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {fmtDate(txn.date)}
                    </span>
                  </Td>
                  <Td>
                    <span className="font-mono text-xs text-muted-foreground">{txn.reference}</span>
                  </Td>
                  <Td>
                    <span className="text-xs font-medium text-foreground">{txn.description}</span>
                  </Td>
                  <Td>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {txn.account}
                    </span>
                  </Td>
                  <Td>
                    <span className="text-xs text-muted-foreground">{txn.category}</span>
                  </Td>
                  <Td>
                    <span className="text-xs text-muted-foreground">{txn.paymentMethod}</span>
                  </Td>
                  <Td>
                    <StatusPill status={txn.type} />
                  </Td>
                  <Td right>
                    <span className={`text-sm font-semibold ${amountColor(txn.type)}`}>
                      {amountPrefix(txn.type)}
                      {fmtINR(txn.amount)}
                    </span>
                  </Td>
                  <Td>
                    <StatusPill status={txn.status} />
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {txn.status === "Completed" &&
                        (finance.data?.transactions ?? []).some((t) => t.id === txn.id) && (
                          <button
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
                            onClick={() => void reconcile(txn.id)}
                          >
                            <CheckCircle className="h-3 w-3" />
                            Reconcile
                          </button>
                        )}
                      <button
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition-colors"
                        onClick={() => setSelectedTxn(txn)}
                      >
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </Td>
                </motion.tr>
              ))}
            </tbody>
          </TableWrapper>
        )}

        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </SectionCard>

      {/* Transaction Detail Modal */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            className="relative w-full max-w-md rounded-2xl bg-white shadow-xl"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Transaction Details</h3>
                <p className="text-xs text-muted-foreground font-mono">{selectedTxn.reference}</p>
              </div>
              <button
                onClick={() => setSelectedTxn(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Amount highlight */}
              <div
                className={`rounded-xl px-4 py-3 ${
                  selectedTxn.type === "Income"
                    ? "bg-emerald-50"
                    : selectedTxn.type === "Expense"
                      ? "bg-red-50"
                      : "bg-blue-50"
                }`}
              >
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className={`text-2xl font-bold mt-1 ${amountColor(selectedTxn.type)}`}>
                  {amountPrefix(selectedTxn.type)}
                  {fmtINR(selectedTxn.amount)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Date", value: fmtDate(selectedTxn.date) },
                  { label: "Type", value: selectedTxn.type },
                  { label: "Status", value: selectedTxn.status },
                  { label: "Account", value: selectedTxn.account },
                  { label: "Category", value: selectedTxn.category },
                  { label: "Payment Method", value: selectedTxn.paymentMethod },
                ].map((f) => (
                  <div
                    key={f.label}
                    className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <p className="text-[11px] text-muted-foreground">{f.label}</p>
                    <p className="text-sm font-medium text-foreground mt-0.5">{f.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                <p className="text-[11px] text-muted-foreground">Description</p>
                <p className="text-sm text-foreground mt-0.5">{selectedTxn.description}</p>
              </div>
            </div>

            <div className="border-t border-slate-100 px-6 py-3 flex justify-end gap-2">
              {selectedTxn.status === "Completed" &&
                (finance.data?.transactions ?? []).some((t) => t.id === selectedTxn.id) && (
                  <button
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                    onClick={() => {
                      void reconcile(selectedTxn.id).then(() => setSelectedTxn(null));
                    }}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Reconcile
                  </button>
                )}
              <SecondaryButton onClick={() => setSelectedTxn(null)}>Close</SecondaryButton>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
