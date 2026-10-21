// ── Customer Reports Tab ──────────────────────────────────────────
import { motion } from "framer-motion";
import {
  TrendingUp,
  Users,
  AlertTriangle,
  Clock,
  Download,
  FileText,
  Printer,
  Search,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { fmtINR, fmtDate, LEAD_STATUS_LABELS, type CrmCustomer, type Lead } from "@/lib/crm-data";
import { SectionCard, StatTile, EmptyState } from "@/components/crm/shared";
import { useBusiness } from "@/contexts/BusinessContext";
import { useCustomers } from "@/hooks/useCustomersQuery";
import { useInvoices } from "@/hooks/useInvoicesQuery";
import { useCrmLeads } from "@/hooks/useCrmQuery";
import { invoiceBalance, invoiceGrandTotal } from "@/lib/billing-data";

// ── Export helpers ─────────────────────────────────────────────────
function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCSV(headers: string[], rows: (string | number)[][]): string {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
}

// ── Export Bar ─────────────────────────────────────────────────────
function ExportBar({ onCSV, onExcel }: { onCSV: () => void; onExcel: () => void }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <span className="mr-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Export:
      </span>
      <button
        onClick={() => window.print()}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <FileText className="h-3.5 w-3.5" /> PDF
      </button>
      <button
        onClick={onExcel}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <Download className="h-3.5 w-3.5" /> Excel CSV
      </button>
      <button
        onClick={onCSV}
        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
      >
        <Download className="h-3.5 w-3.5" /> CSV
      </button>
      <button
        onClick={() => window.print()}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <Printer className="h-3.5 w-3.5" /> Print
      </button>
    </div>
  );
}

// ── Table helpers ──────────────────────────────────────────────────
function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      className={`px-4 py-3 text-xs font-semibold text-muted-foreground ${right ? "text-right" : "text-left"}`}
    >
      {children}
    </th>
  );
}
function Td({
  children,
  right,
  className = "",
}: {
  children: React.ReactNode;
  right?: boolean;
  className?: string;
}) {
  return (
    <td className={`px-4 py-3 text-sm ${right ? "text-right font-semibold" : ""} ${className}`}>
      {children}
    </td>
  );
}

// ── Custom chart tooltips ──────────────────────────────────────────
function ChartTip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
      <p className="mb-1 text-xs font-semibold text-slate-500">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-bold text-foreground">
          {typeof p.value === "number" && p.name.toLowerCase().includes("rev")
            ? fmtINR(p.value)
            : p.value}{" "}
          <span className="text-xs font-normal text-muted-foreground">{p.name}</span>
        </p>
      ))}
    </div>
  );
}

// ── Derived data (computed once at module level) ───────────────────
// ── Main Component ─────────────────────────────────────────────────
export function CustomerReportsTab() {
  const { business } = useBusiness();
  const businessId = business?.id ?? null;
  const { data: customerRows = [], isLoading, error } = useCustomers(businessId);
  const { data: invoices = [] } = useInvoices(businessId);
  const { data: leadRows = [] } = useCrmLeads(businessId);
  const crmCustomers: CrmCustomer[] = customerRows.map((c) => {
    const docs = invoices.filter(
      (inv) => inv.customerId === c.id && inv.status !== "cancelled" && inv.status !== "draft",
    );
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
      group: c.customer_group as CrmCustomer["group"],
      status: c.status as CrmCustomer["status"],
      outstandingAmount:
        Number(c.opening_balance) +
        docs.reduce((s, inv) => s + Math.max(0, invoiceBalance(inv)), 0),
      creditLimit: Number(c.credit_limit),
      creditDays: c.credit_days,
      totalRevenue: docs.reduce((s, inv) => s + invoiceGrandTotal(inv), 0),
      lastPurchase: docs.reduce((d, inv) => (inv.createdDate > d ? inv.createdDate : d), ""),
      createdDate: c.created_at.slice(0, 10),
      rating: c.rating,
      notes: [],
      purchaseHistory: [],
    };
  });
  const leads: Lead[] = leadRows.map((l) => ({
    id: l.id,
    leadCode: l.lead_code,
    name: l.name,
    company: l.company,
    contactPerson: l.contact_person,
    phone: l.phone,
    email: l.email ?? "",
    source: l.source as Lead["source"],
    status: l.status,
    expectedRevenue: Number(l.expected_revenue),
    assignedUser: l.assigned_user,
    priority: l.priority,
    createdDate: l.created_at.slice(0, 10),
    convertedCustomerId: l.converted_customer_id ?? undefined,
  }));
  const topCustomers = [...crmCustomers]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10);
  const outstandingCustomers = [...crmCustomers]
    .filter((c) => c.outstandingAmount > 0)
    .sort((a, b) => b.outstandingAmount - a.outstandingAmount)
    .slice(0, 10);
  const inactiveCustomers = [...crmCustomers]
    .filter((c) => c.status === "inactive" || c.status === "at-risk")
    .sort((a, b) => a.lastPurchase.localeCompare(b.lastPurchase))
    .slice(0, 10);
  const revenueChartData = [...crmCustomers]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 15)
    .map((r) => ({
      name: r.name.length > 16 ? r.name.slice(0, 14) + "…" : r.name,
      Revenue: r.totalRevenue,
    }));
  const growthData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(new Date().getFullYear(), new Date().getMonth() - 5 + i, 1);
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    return {
      month: d.toLocaleDateString("en-IN", { month: "short" }),
      customers: customerRows.filter(
        (c) => new Date(c.created_at) >= d && new Date(c.created_at) < next,
      ).length,
    };
  });
  const funnelData = (Object.keys(LEAD_STATUS_LABELS) as Lead["status"][]).map((stage) => ({
    stage,
    count: leads.filter((lead) => lead.status === stage).length,
  }));
  const totalRevenue = crmCustomers.reduce((s, c) => s + c.totalRevenue, 0);
  const totalOutstanding = crmCustomers.reduce((s, c) => s + c.outstandingAmount, 0);
  const activeCount = crmCustomers.filter((c) => c.status === "active").length;
  const wonLeads = leads.filter((l) => l.status === "won").length;
  const revenueByCustomer = (n: number) =>
    [...crmCustomers]
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, n)
      .map((c) => ({ name: c.name, revenue: c.totalRevenue }));

  function exportTopCustomersCSV() {
    const csv = toCSV(
      ["Rank", "Customer", "Company", "City", "Group", "Status", "Total Revenue", "Outstanding"],
      topCustomers.map((c, i) => [
        i + 1,
        c.name,
        c.company,
        c.city,
        c.group,
        c.status,
        c.totalRevenue,
        c.outstandingAmount,
      ]),
    );
    downloadFile(csv, "top-customers.csv", "text/csv");
  }

  function exportOutstandingCSV() {
    const csv = toCSV(
      [
        "Customer",
        "Company",
        "City",
        "Status",
        "Outstanding Amount",
        "Credit Limit",
        "Last Purchase",
      ],
      outstandingCustomers.map((c) => [
        c.name,
        c.company,
        c.city,
        c.status,
        c.outstandingAmount,
        c.creditLimit,
        c.lastPurchase,
      ]),
    );
    downloadFile(csv, "outstanding-customers.csv", "text/csv");
  }

  function exportInactiveCSV() {
    const csv = toCSV(
      ["Customer", "Company", "City", "Status", "Last Purchase", "Total Revenue"],
      inactiveCustomers.map((c) => [
        c.name,
        c.company,
        c.city,
        c.status,
        c.lastPurchase,
        c.totalRevenue,
      ]),
    );
    downloadFile(csv, "inactive-customers.csv", "text/csv");
  }

  function exportExcelCompatible() {
    downloadFile(
      toCSV(
        ["Customer", "Company", "City", "Group", "Status", "Revenue", "Outstanding"],
        topCustomers.map((c) => [
          c.name,
          c.company,
          c.city,
          c.group,
          c.status,
          c.totalRevenue,
          c.outstandingAmount,
        ]),
      ),
      "customer-report-excel.csv",
      "text/csv;charset=utf-8",
    );
  }

  return (
    <div className="space-y-6">
      {isLoading && <p className="text-sm text-muted-foreground">Loading customer reports…</p>}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          Could not load reports: {(error as Error).message}
        </p>
      )}
      {/* Summary stat tiles */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile
          label="Total Revenue"
          value={fmtINR(totalRevenue)}
          icon={TrendingUp}
          bg="bg-blue-50"
          iconColor="text-blue-600"
          index={0}
        />
        <StatTile
          label="Active Customers"
          value={String(activeCount)}
          icon={Users}
          bg="bg-emerald-50"
          iconColor="text-emerald-600"
          index={1}
        />
        <StatTile
          label="Outstanding"
          value={fmtINR(totalOutstanding)}
          icon={AlertTriangle}
          bg="bg-amber-50"
          iconColor="text-amber-600"
          index={2}
        />
        <StatTile
          label="Leads Converted"
          value={String(wonLeads)}
          icon={Clock}
          bg="bg-violet-50"
          iconColor="text-violet-600"
          index={3}
        />
      </div>
      <ExportBar onCSV={exportTopCustomersCSV} onExcel={exportExcelCompatible} />

      {/* Revenue by Customer Bar Chart */}
      <SectionCard
        title="Revenue by Customer"
        subtitle="Top 15 customers by total revenue"
        action={
          <button
            onClick={() =>
              downloadFile(
                toCSV(
                  ["Company", "Revenue"],
                  revenueByCustomer(15).map((r) => [r.name, r.revenue]),
                ),
                "revenue-by-customer.csv",
                "text/csv",
              )
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
        }
      >
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={revenueChartData} margin={{ top: 4, right: 4, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              angle={-35}
              textAnchor="end"
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => "₹" + (v / 100000).toFixed(0) + "L"}
            />
            <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(241,245,249,0.6)", radius: 6 }} />
            <Bar dataKey="Revenue" fill="#6366f1" radius={[5, 5, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      {/* Top Customers Table */}
      <SectionCard
        title="Top Customers by Revenue"
        subtitle="Ranked by lifetime revenue"
        noPadding
        action={
          <button
            onClick={exportTopCustomersCSV}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <Th>#</Th>
                <Th>Customer</Th>
                <Th>Company</Th>
                <Th>Group</Th>
                <Th>Status</Th>
                <Th right>Total Revenue</Th>
                <Th right>Outstanding</Th>
              </tr>
            </thead>
            <tbody>
              {topCustomers.map((c, i) => (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-slate-100 hover:bg-slate-50/60"
                >
                  <Td>
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${i < 3 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}
                    >
                      {i + 1}
                    </span>
                  </Td>
                  <Td>
                    <span className="font-medium text-foreground whitespace-nowrap">{c.name}</span>
                  </Td>
                  <Td>
                    <span className="text-xs text-muted-foreground">{c.company}</span>
                  </Td>
                  <Td>
                    <span className="text-xs">{c.group}</span>
                  </Td>
                  <Td>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${c.status === "active" ? "bg-emerald-50 text-emerald-700" : c.status === "at-risk" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"}`}
                    >
                      {c.status}
                    </span>
                  </Td>
                  <Td right className="text-emerald-700">
                    {fmtINR(c.totalRevenue)}
                  </Td>
                  <Td
                    right
                    className={c.outstandingAmount > 0 ? "text-amber-700" : "text-slate-400"}
                  >
                    {fmtINR(c.outstandingAmount)}
                  </Td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Outstanding + Inactive side by side */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Outstanding Customers */}
        <SectionCard
          title="Outstanding Customers"
          subtitle="Customers with unpaid balances"
          noPadding
          action={
            <button
              onClick={exportOutstandingCSV}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> CSV
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <Th>Customer</Th>
                  <Th>City</Th>
                  <Th right>Outstanding</Th>
                  <Th right>Credit Limit</Th>
                </tr>
              </thead>
              <tbody>
                {outstandingCustomers.length === 0 && (
                  <tr>
                    <td colSpan={4}>
                      <EmptyState
                        icon={Search}
                        title="No outstanding balances"
                        subtitle="All customers are cleared."
                      />
                    </td>
                  </tr>
                )}
                {outstandingCustomers.map((c, i) => (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-slate-100 hover:bg-slate-50/60"
                  >
                    <Td>
                      <p className="font-medium text-foreground text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.company}</p>
                    </Td>
                    <Td>
                      <span className="text-xs text-muted-foreground">{c.city}</span>
                    </Td>
                    <Td right className="text-amber-700">
                      {fmtINR(c.outstandingAmount)}
                    </Td>
                    <Td right className="text-slate-500">
                      {fmtINR(c.creditLimit)}
                    </Td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Inactive / At-Risk Customers */}
        <SectionCard
          title="Inactive / At-Risk Customers"
          subtitle="Customers needing re-engagement"
          noPadding
          action={
            <button
              onClick={exportInactiveCSV}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> CSV
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <Th>Customer</Th>
                  <Th>Status</Th>
                  <Th>Last Purchase</Th>
                  <Th right>Revenue</Th>
                </tr>
              </thead>
              <tbody>
                {inactiveCustomers.length === 0 && (
                  <tr>
                    <td colSpan={4}>
                      <EmptyState
                        icon={Search}
                        title="No inactive customers"
                        subtitle="All customers are active."
                      />
                    </td>
                  </tr>
                )}
                {inactiveCustomers.map((c, i) => (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-slate-100 hover:bg-slate-50/60"
                  >
                    <Td>
                      <p className="font-medium text-foreground text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.company}</p>
                    </Td>
                    <Td>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${c.status === "at-risk" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"}`}
                      >
                        {c.status}
                      </span>
                    </Td>
                    <Td>
                      <span className="text-xs text-muted-foreground">
                        {fmtDate(c.lastPurchase)}
                      </span>
                    </Td>
                    <Td right className="text-foreground">
                      {fmtINR(c.totalRevenue)}
                    </Td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      {/* Customer Growth + Lead Funnel */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Customer Growth Line Chart */}
        <SectionCard
          title="Customer Growth"
          subtitle="New customers acquired per month (last 6 months)"
          action={
            <button
              onClick={() =>
                downloadFile(
                  toCSV(
                    ["Month", "New Customers"],
                    growthData.map((d) => [d.month, d.customers]),
                  ),
                  "customer-growth.csv",
                  "text/csv",
                )
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> CSV
            </button>
          }
        >
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={growthData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<ChartTip />} />
              <Line
                type="monotone"
                dataKey="customers"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "#6366f1", strokeWidth: 0 }}
                name="Customers"
              />
            </LineChart>
          </ResponsiveContainer>
        </SectionCard>

        {/* Lead Conversion Funnel */}
        <SectionCard
          title="Lead Conversion Funnel"
          subtitle="Lead count at each pipeline stage"
          action={
            <button
              onClick={() =>
                downloadFile(
                  toCSV(
                    ["Stage", "Count"],
                    funnelData.map((d) => [LEAD_STATUS_LABELS[d.stage], d.count]),
                  ),
                  "lead-funnel.csv",
                  "text/csv",
                )
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> CSV
            </button>
          }
        >
          <div className="mt-2 space-y-3">
            {funnelData.map((stage, i) => {
              const maxCount = Math.max(...funnelData.map((s) => s.count), 1);
              const pct = Math.round((stage.count / maxCount) * 100);
              const colors = ["#6366f1", "#3b82f6", "#06b6d4", "#8b5cf6", "#f59e0b", "#10b981"];
              const color = colors[i % colors.length];
              return (
                <div key={stage.stage} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">
                      {LEAD_STATUS_LABELS[stage.stage]}
                    </span>
                    <span className="font-semibold text-foreground">{stage.count} leads</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, delay: i * 0.08 }}
                      className="h-2 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
