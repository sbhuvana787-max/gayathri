import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Download,
  FileText,
  Printer,
  TrendingDown,
  TrendingUp,
  Users,
  Truck,
  Receipt,
  Wallet,
  X,
} from "lucide-react";
import { useFinanceModel } from "@/hooks/useFinanceModel";
import { fmtDate, fmtINR } from "@/lib/finance-data";
import {
  EmptyState,
  SectionCard,
  StatTile,
  TableWrapper,
  Th,
  Td,
  SecondaryButton,
} from "@/components/finance/shared";

const reportDefinitions = [
  {
    id: "income",
    title: "Income Report",
    description: "Actual receipts from Billing payments and recorded income.",
    icon: TrendingUp,
  },
  {
    id: "expense",
    title: "Expense Report",
    description: "Recorded expenses and supplier bill payments.",
    icon: TrendingDown,
  },
  {
    id: "cashflow",
    title: "Cashbook Report",
    description: "Cash receipts, payments, and running balances.",
    icon: Wallet,
  },
  {
    id: "pl",
    title: "Cash Basis Summary",
    description: "Collected receipts less recorded payments by month.",
    icon: BarChart3,
  },
  {
    id: "gst",
    title: "GST Summary",
    description: "Tax on posted invoices and recorded input tax credit.",
    icon: Receipt,
  },
  {
    id: "receivables",
    title: "Receivables Report",
    description: "Outstanding posted invoices and due dates.",
    icon: Users,
  },
  {
    id: "payables",
    title: "Payables Report",
    description: "Supplier bills, payments, and outstanding balances.",
    icon: Truck,
  },
] as const;
type ReportId = (typeof reportDefinitions)[number]["id"];

function reportRows(
  id: ReportId,
  model: ReturnType<typeof useFinanceModel>["model"],
): Record<string, unknown>[] {
  switch (id) {
    case "income":
      return model.incomeEntries.map((row) => ({ ...row }));
    case "expense":
      return model.expenseEntries.map((row) => ({ ...row }));
    case "cashflow":
      return model.cashbookEntries.map((row) => ({ ...row }));
    case "pl":
      return model.plData.map((row) => ({ ...row }));
    case "gst":
      return model.gstSummary.map((row) => ({ ...row }));
    case "receivables":
      return model.receivables.map((row) => ({ ...row }));
    case "payables":
      return model.payables.map((row) => ({ ...row }));
  }
}

function columnsFor(id: ReportId): [string, string][] {
  switch (id) {
    case "income":
      return [
        ["date", "Date"],
        ["source", "Source"],
        ["customer", "Counterparty"],
        ["reference", "Reference"],
        ["category", "Category"],
        ["amount", "Amount"],
      ];
    case "expense":
      return [
        ["date", "Date"],
        ["vendor", "Vendor"],
        ["reference", "Reference"],
        ["category", "Category"],
        ["paymentMethod", "Method"],
        ["amount", "Amount"],
      ];
    case "cashflow":
      return [
        ["date", "Date"],
        ["description", "Description"],
        ["type", "Direction"],
        ["reference", "Reference"],
        ["amount", "Amount"],
        ["balance", "Balance"],
      ];
    case "pl":
      return [
        ["month", "Month"],
        ["revenue", "Receipts"],
        ["expenses", "Payments"],
        ["netProfit", "Net cash flow"],
      ];
    case "gst":
      return [
        ["month", "Month"],
        ["cgst", "CGST"],
        ["sgst", "SGST"],
        ["igst", "IGST"],
        ["collectedGST", "GST on invoices"],
        ["itcClaimed", "ITC"],
        ["payableGST", "Net payable"],
      ];
    case "receivables":
      return [
        ["invoiceNo", "Invoice"],
        ["customer", "Customer"],
        ["invoiceDate", "Invoice date"],
        ["dueDate", "Due date"],
        ["totalAmount", "Total"],
        ["paidAmount", "Paid"],
        ["outstandingAmount", "Outstanding"],
        ["status", "Status"],
      ];
    case "payables":
      return [
        ["billNo", "Bill"],
        ["supplier", "Supplier"],
        ["billDate", "Bill date"],
        ["dueDate", "Due date"],
        ["totalAmount", "Total"],
        ["paidAmount", "Paid"],
        ["outstandingAmount", "Outstanding"],
        ["status", "Status"],
      ];
  }
}

function asCell(value: unknown, key: string): string {
  if (typeof value === "number")
    return /amount|balance|revenue|expenses|profit|gst|itc/i.test(key)
      ? fmtINR(value)
      : String(value);
  if (typeof value === "string" && /date/i.test(key) && /^\d{4}-\d{2}-\d{2}$/.test(value))
    return fmtDate(value);
  return value == null || value === "" ? "—" : String(value);
}

export function ReportsTab() {
  const { model, isLoading, isError, error } = useFinanceModel();
  const [activeReport, setActiveReport] = useState<ReportId | null>(null);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const rows = useMemo(
    () => (activeReport ? reportRows(activeReport, model) : []),
    [activeReport, model],
  );
  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        const haystack = Object.values(row).join(" ").toLowerCase();
        const date = String(row.date ?? row.invoiceDate ?? row.billDate ?? "");
        return (
          (!search || haystack.includes(search.toLowerCase())) &&
          (!dateFrom || !date || date >= dateFrom) &&
          (!dateTo || !date || date <= dateTo)
        );
      }),
    [rows, search, dateFrom, dateTo],
  );
  const columns = activeReport ? columnsFor(activeReport) : [];

  function exportCsv() {
    if (!activeReport) return;
    const csvRows = [
      columns.map(([, label]) => label),
      ...filtered.map((row) => columns.map(([key]) => row[key])),
    ];
    const csv = csvRows
      .map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `finance-${activeReport}-report.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading)
    return (
      <p className="rounded-xl border bg-white p-6 text-sm text-muted-foreground">
        Loading finance reports…
      </p>
    );
  if (isError)
    return (
      <p
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700"
      >
        Unable to load finance reports: {(error as Error).message}
      </p>
    );
  const countPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Receipts"
          value={fmtINR(model.ytdRevenue)}
          icon={TrendingUp}
          bg="bg-emerald-50"
          iconColor="text-emerald-600"
          index={0}
          sub="Current financial year, cash basis"
        />
        <StatTile
          label="Payments"
          value={fmtINR(model.ytdExpenses)}
          icon={TrendingDown}
          bg="bg-red-50"
          iconColor="text-red-500"
          index={1}
          sub="Recorded outflows"
        />
        <StatTile
          label="Receivables"
          value={fmtINR(model.totalReceivables)}
          icon={Users}
          bg="bg-violet-50"
          iconColor="text-violet-600"
          index={2}
          sub="Outstanding invoices"
        />
        <StatTile
          label="Payables"
          value={fmtINR(model.totalPayables)}
          icon={Truck}
          bg="bg-orange-50"
          iconColor="text-orange-500"
          index={3}
          sub="Outstanding supplier bills"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {reportDefinitions.map((report, index) => {
          const Icon = report.icon;
          return (
            <motion.button
              key={report.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => {
                setActiveReport(report.id);
                setSearch("");
                setDateFrom("");
                setDateTo("");
                setPage(1);
              }}
              className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-foreground">{report.title}</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{report.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600">
                <FileText className="h-3.5 w-3.5" />
                View report
              </span>
            </motion.button>
          );
        })}
      </div>

      {activeReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold">
                  {reportDefinitions.find((r) => r.id === activeReport)?.title}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {filtered.length} records · Current business data
                </p>
              </div>
              <div className="flex items-center gap-2">
                <SecondaryButton icon={Download} onClick={exportCsv}>
                  Export CSV
                </SecondaryButton>
                <SecondaryButton icon={Printer} onClick={() => window.print()}>
                  Print
                </SecondaryButton>
                <button
                  aria-label="Close report"
                  onClick={() => setActiveReport(null)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 border-b border-slate-100 p-4">
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search report…"
                className="h-9 min-w-48 flex-1 rounded-lg border px-3 text-sm"
              />
              <label className="text-xs text-muted-foreground">
                From{" "}
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPage(1);
                  }}
                  className="ml-1 h-9 rounded-lg border px-2 text-sm text-foreground"
                />
              </label>
              <label className="text-xs text-muted-foreground">
                To{" "}
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPage(1);
                  }}
                  className="ml-1 h-9 rounded-lg border px-2 text-sm text-foreground"
                />
              </label>
            </div>
            <div className="max-h-[calc(92vh-150px)] overflow-auto p-4">
              {filtered.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No report records"
                  subtitle="There are no matching records for this report and date range."
                />
              ) : (
                <TableWrapper>
                  <thead>
                    <tr>
                      {columns.map(([, label]) => (
                        <Th key={label}>{label}</Th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((row, index) => (
                      <tr
                        key={String(row.id ?? `${activeReport}-${index}`)}
                        className="hover:bg-slate-50"
                      >
                        {columns.map(([key]) => (
                          <Td key={key}>{asCell(row[key], key)}</Td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </TableWrapper>
              )}
            </div>
            {filtered.length > pageSize && (
              <div className="flex items-center justify-end gap-3 border-t p-3 text-sm">
                <button
                  className="rounded border px-3 py-1 disabled:opacity-40"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </button>
                <span>
                  Page {page} of {countPages}
                </span>
                <button
                  className="rounded border px-3 py-1 disabled:opacity-40"
                  onClick={() => setPage((p) => Math.min(countPages, p + 1))}
                  disabled={page >= countPages}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
