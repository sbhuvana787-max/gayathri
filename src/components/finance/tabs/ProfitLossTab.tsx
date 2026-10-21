import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, DollarSign, BarChart2, Printer } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { incomeCategories, expenseCategories, fmtINR } from "@/lib/finance-data";
import { useFinanceModel } from "@/hooks/useFinanceModel";
import {
  SectionCard,
  StatTile,
  SecondaryButton,
  TableWrapper,
  Th,
  Td,
} from "@/components/finance/shared";

const INCOME_ICONS: Record<string, string> = {
  "Product Sales": "🛒",
  "Service Revenue": "⚙️",
  Consulting: "💼",
  Commission: "💰",
  "Rental Income": "🏢",
  "Interest Income": "🏦",
  Miscellaneous: "📦",
};

const EXPENSE_ICONS: Record<string, string> = {
  Rent: "🏢",
  Electricity: "⚡",
  Salary: "👥",
  Fuel: "⛽",
  "Office Supplies": "📎",
  Marketing: "📣",
  Internet: "🌐",
  Software: "💻",
  Travel: "✈️",
  Maintenance: "🔧",
  "Professional Fees": "📋",
  Insurance: "🛡️",
};

function MarginBadge({ pct }: { pct: number }) {
  const cls =
    pct >= 20
      ? "bg-emerald-100 text-emerald-700"
      : pct >= 10
        ? "bg-amber-100 text-amber-700"
        : "bg-red-100 text-red-600";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      {pct.toFixed(1)}%
    </span>
  );
}

export function ProfitLossTab() {
  const { model, isLoading, isError, error } = useFinanceModel();
  const {
    plData,
    currentPL,
    ytdRevenue,
    ytdExpenses,
    ytdNetProfit,
    incomeEntries,
    expenseEntries,
  } = model;
  if (isLoading)
    return (
      <p className="rounded-xl border bg-white p-6 text-sm text-muted-foreground">
        Loading cash-basis profit and loss…
      </p>
    );
  if (isError)
    return (
      <p
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700"
      >
        Unable to load profit and loss: {(error as Error).message}
      </p>
    );
  const currentMonth = new Date().toISOString().slice(0, 7);
  const ytdGrossProfit = ytdRevenue - ytdExpenses;
  const profitMargin = ytdRevenue > 0 ? (ytdNetProfit / ytdRevenue) * 100 : 0;

  // Aggregate current month income by category
  const currentMonthIncome = incomeCategories
    .map((cat) => {
      const total = incomeEntries
        .filter((e) => e.date.startsWith(currentMonth) && e.category === cat)
        .reduce((s, e) => s + e.amount, 0);
      return { category: cat, amount: total };
    })
    .filter((c) => c.amount > 0);

  // Aggregate current month expenses by category
  const currentMonthExpenses = expenseCategories
    .map((cat) => {
      const total = expenseEntries
        .filter((e) => e.date.startsWith(currentMonth) && e.category === cat)
        .reduce((s, e) => s + e.amount, 0);
      return { category: cat, amount: total };
    })
    .filter((c) => c.amount > 0);

  const incomeSubtotal = currentMonthIncome.reduce((s, c) => s + c.amount, 0);
  const expenseSubtotal = currentMonthExpenses.reduce((s, c) => s + c.amount, 0);

  // Grand totals
  const grandRevenue = plData.reduce((s, p) => s + p.revenue, 0);
  const grandExpenses = plData.reduce((s, p) => s + p.expenses, 0);
  const grandGross = plData.reduce((s, p) => s + p.grossProfit, 0);
  const grandNet = plData.reduce((s, p) => s + p.netProfit, 0);
  const grandMargin = grandRevenue > 0 ? (grandNet / grandRevenue) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* YTD Summary Cards */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Profit & Loss (Cash Basis)</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cash receipts less recorded payments · current financial year
          </p>
        </div>
        <SecondaryButton icon={Printer} onClick={() => window.print()}>
          Print
        </SecondaryButton>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Collected Receipts"
          value={fmtINR(ytdRevenue)}
          sub="Current financial year"
          icon={TrendingUp}
          bg="bg-emerald-50"
          iconColor="text-emerald-600"
          index={0}
        />
        <StatTile
          label="Recorded Payments"
          value={fmtINR(ytdExpenses)}
          sub="Current financial year"
          icon={TrendingDown}
          bg="bg-red-50"
          iconColor="text-red-500"
          index={1}
        />
        <StatTile
          label="Net Cash Result"
          value={fmtINR(ytdGrossProfit)}
          sub={ytdGrossProfit >= 0 ? "Revenue minus expenses" : "Net loss"}
          icon={BarChart2}
          bg={ytdGrossProfit >= 0 ? "bg-emerald-50" : "bg-red-50"}
          iconColor={ytdGrossProfit >= 0 ? "text-emerald-600" : "text-red-500"}
          index={2}
        />
        <StatTile
          label="Net Profit"
          value={fmtINR(ytdNetProfit)}
          sub={`${profitMargin.toFixed(1)}% profit margin`}
          icon={DollarSign}
          bg="bg-indigo-50"
          iconColor="text-indigo-600"
          index={3}
          trend={{ value: `${profitMargin.toFixed(1)}%`, positive: ytdNetProfit >= 0 }}
        />
      </div>

      {/* Current Month Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Section */}
        <SectionCard
          title={`Receipts — ${new Date().toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`}
          subtitle={`${currentMonthIncome.length} income categories`}
        >
          <div className="space-y-2">
            {currentMonthIncome.map((item, idx) => (
              <motion.div
                key={item.category}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.04 }}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg leading-none">
                    {INCOME_ICONS[item.category] ?? "💵"}
                  </span>
                  <span className="text-sm text-foreground">{item.category}</span>
                </div>
                <span className="text-sm font-semibold text-emerald-600">
                  {fmtINR(item.amount)}
                </span>
              </motion.div>
            ))}
            <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3 px-3">
              <span className="text-sm font-semibold text-foreground">Total Revenue</span>
              <span className="text-sm font-bold text-emerald-600">{fmtINR(incomeSubtotal)}</span>
            </div>
          </div>
        </SectionCard>

        {/* Expense Section */}
        <SectionCard
          title={`Payments — ${new Date().toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`}
          subtitle={`${currentMonthExpenses.length} expense categories`}
        >
          <div className="space-y-2">
            {currentMonthExpenses.map((item, idx) => (
              <motion.div
                key={item.category}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.04 }}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg leading-none">
                    {EXPENSE_ICONS[item.category] ?? "📌"}
                  </span>
                  <span className="text-sm text-foreground">{item.category}</span>
                </div>
                <span className="text-sm font-semibold text-red-500">{fmtINR(item.amount)}</span>
              </motion.div>
            ))}
            <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3 px-3">
              <span className="text-sm font-semibold text-foreground">Total Expenses</span>
              <span className="text-sm font-bold text-red-500">{fmtINR(expenseSubtotal)}</span>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Comparison Chart */}
      <SectionCard
        title="Monthly P&L Comparison"
        subtitle="Revenue, expenses, and net profit by month"
      >
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={plData}
            margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
            barCategoryGap="28%"
            barGap={3}
          >
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
              tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
            />
            <Tooltip
              formatter={(value: number) => fmtINR(value)}
              contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name="Expenses" fill="#f87171" radius={[4, 4, 0, 0]} />
            <Bar dataKey="netProfit" name="Net Profit" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      {/* P&L Table */}
      <SectionCard
        title="P&L Statement — Monthly"
        subtitle="Revenue, expenses, and profitability by month"
        noPadding
      >
        <TableWrapper>
          <thead>
            <tr>
              <Th>Month</Th>
              <Th right>Revenue</Th>
              <Th right>Expenses</Th>
              <Th right>Gross Profit</Th>
              <Th right>Net Profit</Th>
              <Th right>Margin %</Th>
            </tr>
          </thead>
          <tbody>
            {plData.map((row, idx) => {
              const isCurrent = row.month === currentPL.month;
              const margin = row.revenue > 0 ? (row.netProfit / row.revenue) * 100 : 0;
              return (
                <motion.tr
                  key={row.month}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.04 }}
                  className={`transition-colors ${isCurrent ? "bg-indigo-50/60" : "hover:bg-slate-50"}`}
                >
                  <Td>
                    <div className="flex items-center gap-2">
                      {isCurrent && <div className="h-4 w-1 rounded-full bg-indigo-500 shrink-0" />}
                      <span
                        className={`text-sm font-medium ${isCurrent ? "text-indigo-700" : "text-foreground"}`}
                      >
                        {row.month}
                        {isCurrent && (
                          <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-600">
                            Current
                          </span>
                        )}
                      </span>
                    </div>
                  </Td>
                  <Td right>
                    <span className="text-sm text-foreground">{fmtINR(row.revenue)}</span>
                  </Td>
                  <Td right>
                    <span className="text-sm text-red-500">{fmtINR(row.expenses)}</span>
                  </Td>
                  <Td right>
                    <span
                      className={`text-sm font-medium ${row.grossProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}
                    >
                      {fmtINR(row.grossProfit)}
                    </span>
                  </Td>
                  <Td right>
                    <span
                      className={`text-sm font-semibold ${row.netProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}
                    >
                      {fmtINR(row.netProfit)}
                    </span>
                  </Td>
                  <Td right>
                    <MarginBadge pct={margin} />
                  </Td>
                </motion.tr>
              );
            })}

            {/* Grand Totals Row */}
            <tr className="bg-slate-50 font-semibold">
              <Td>
                <span className="text-sm font-bold text-foreground">Grand Total (YTD)</span>
              </Td>
              <Td right>
                <span className="text-sm font-bold text-foreground">{fmtINR(grandRevenue)}</span>
              </Td>
              <Td right>
                <span className="text-sm font-bold text-red-500">{fmtINR(grandExpenses)}</span>
              </Td>
              <Td right>
                <span
                  className={`text-sm font-bold ${grandGross >= 0 ? "text-emerald-600" : "text-red-500"}`}
                >
                  {fmtINR(grandGross)}
                </span>
              </Td>
              <Td right>
                <span
                  className={`text-sm font-bold ${grandNet >= 0 ? "text-emerald-600" : "text-red-500"}`}
                >
                  {fmtINR(grandNet)}
                </span>
              </Td>
              <Td right>
                <MarginBadge pct={grandMargin} />
              </Td>
            </tr>
          </tbody>
        </TableWrapper>
      </SectionCard>
    </div>
  );
}
