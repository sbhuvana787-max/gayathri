// ── Finance Overview Tab ─────────────────────────────────────────────
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  Landmark,
  ReceiptText,
  CreditCard,
  BadgePercent,
  Plus,
  ArrowDownCircle,
  ArrowRightLeft,
  FileBarChart2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { fmtINR } from "@/lib/finance-data";
import { useFinanceModel } from "@/hooks/useFinanceModel";
import { SectionCard, StatTile } from "@/components/finance/shared";

const PIE_COLORS = [
  "#6366f1",
  "#f43f5e",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
];

export function OverviewTab({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { model, isLoading, isError, error } = useFinanceModel();
  const {
    todayIncome,
    todayExpenses,
    todayNetProfit,
    cashBalance,
    totalBankBalance,
    totalReceivables,
    totalPayables,
    currentMonthGST,
    revenueTrend,
    expenseByCategory,
    cashFlowData,
    plData,
    bankAccounts,
  } = model;
  if (isLoading)
    return (
      <p className="rounded-xl border bg-white p-6 text-sm text-muted-foreground">
        Loading finance data…
      </p>
    );
  if (isError)
    return (
      <p
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700"
      >
        Unable to load finance data: {(error as Error).message}
      </p>
    );
  const todayLabel = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const kpiRow1 = [
    {
      label: "Today's Collected",
      value: fmtINR(todayIncome),
      icon: TrendingUp,
      bg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      sub: todayLabel,
    },
    {
      label: "Today's Expenses",
      value: fmtINR(todayExpenses),
      icon: TrendingDown,
      bg: "bg-red-50",
      iconColor: "text-red-500",
      sub: todayLabel,
    },
    {
      label: "Net Profit Today",
      value: fmtINR(todayNetProfit),
      icon: DollarSign,
      bg: "bg-indigo-50",
      iconColor: "text-indigo-600",
      sub: "Revenue − Expenses",
    },
    {
      label: "Cash Balance",
      value: fmtINR(cashBalance),
      icon: Wallet,
      bg: "bg-amber-50",
      iconColor: "text-amber-600",
      sub: "Closing cash",
    },
  ];
  const kpiRow2 = [
    {
      label: "Bank Balance",
      value: fmtINR(totalBankBalance),
      icon: Landmark,
      bg: "bg-blue-50",
      iconColor: "text-blue-600",
      sub: `${bankAccounts.length} accounts`,
    },
    {
      label: "Receivables",
      value: fmtINR(totalReceivables),
      icon: ReceiptText,
      bg: "bg-violet-50",
      iconColor: "text-violet-600",
      sub: "Outstanding",
    },
    {
      label: "Payables",
      value: fmtINR(totalPayables),
      icon: CreditCard,
      bg: "bg-orange-50",
      iconColor: "text-orange-500",
      sub: "Due to vendors",
    },
    {
      label: "GST Collected",
      value: fmtINR(currentMonthGST.collectedGST),
      icon: BadgePercent,
      bg: "bg-teal-50",
      iconColor: "text-teal-600",
      sub: currentMonthGST.month,
    },
  ];

  const quickActions = [
    { label: "Add Expense", icon: Plus, tab: "expenses", color: "text-red-500", bg: "bg-red-50" },
    {
      label: "Record Income",
      icon: ArrowDownCircle,
      tab: "income",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Transfer Money",
      icon: ArrowRightLeft,
      tab: "bank-accounts",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "View Reports",
      icon: FileBarChart2,
      tab: "reports",
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiRow1.map((kpi, i) => (
          <StatTile key={kpi.label} {...kpi} index={i} />
        ))}
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiRow2.map((kpi, i) => (
          <StatTile key={kpi.label} {...kpi} index={i + 4} />
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Revenue vs Expenses" subtitle="Monthly comparison">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueTrend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
              />
              <Tooltip formatter={(v: number) => fmtINR(v)} />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Expense Breakdown" subtitle="By category">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={expenseByCategory}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="45%"
                outerRadius={90}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {expenseByCategory.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => fmtINR(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap gap-2 justify-center">
            {expenseByCategory.map((e, idx) => (
              <span key={e.name} className="flex items-center gap-1 text-xs text-muted-foreground">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }}
                />
                {e.name}
              </span>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Cash Flow" subtitle="Monthly net cash flow">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={cashFlowData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="cashFlowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
              />
              <Tooltip formatter={(v: number) => fmtINR(v)} />
              <Area
                type="monotone"
                dataKey="cashFlow"
                name="Cash Flow"
                stroke="#10b981"
                fill="url(#cashFlowGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Monthly Net Cash Result" subtitle="Rolling 12 months · cash basis">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={plData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
              />
              <Tooltip formatter={(v: number) => fmtINR(v)} />
              <Bar dataKey="netProfit" name="Net Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {quickActions.map((action, i) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05, ease: "easeOut" }}
              onClick={() => onNavigate(action.tab)}
              className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${action.bg}`}>
                <action.icon className={`h-5 w-5 ${action.color}`} />
              </div>
              <span className="text-sm font-semibold text-foreground">{action.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
