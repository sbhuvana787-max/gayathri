import { motion } from "framer-motion";
import { Receipt, Info, FileText, AlertCircle } from "lucide-react";
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
import { fmtINR } from "@/lib/finance-data";
import { useFinanceModel } from "@/hooks/useFinanceModel";
import { SectionCard, StatTile, TableWrapper, Th, Td } from "@/components/finance/shared";

export function GSTSummaryTab() {
  const { model, isLoading, isError, error } = useFinanceModel();
  const { gstSummary, currentMonthGST } = model;
  if (isLoading)
    return (
      <p className="rounded-xl border bg-white p-6 text-sm text-muted-foreground">
        Loading GST summary…
      </p>
    );
  if (isError)
    return (
      <p
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700"
      >
        Unable to load GST summary: {(error as Error).message}
      </p>
    );

  function exportMonth(month: (typeof gstSummary)[number]) {
    const rows = [
      ["Month", "CGST", "SGST", "IGST", "GST on invoices", "ITC recorded", "Net payable"],
      [
        month.month,
        month.cgst,
        month.sgst,
        month.igst,
        month.collectedGST,
        month.itcClaimed,
        month.payableGST,
      ],
    ];
    const csv = rows
      .map((row) => row.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `gst-summary-${month.month.toLowerCase().replaceAll(" ", "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Current Month KPI Cards */}
      <div>
        <div className="mb-3">
          <h2 className="text-base font-semibold text-foreground">
            Current Month — {currentMonthGST.month}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            GST breakdown for the current filing period
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatTile
            label="CGST Collected"
            value={fmtINR(currentMonthGST.cgst)}
            sub="Central GST"
            icon={Receipt}
            bg="bg-indigo-50"
            iconColor="text-indigo-600"
            index={0}
          />
          <StatTile
            label="SGST Collected"
            value={fmtINR(currentMonthGST.sgst)}
            sub="State GST"
            icon={Receipt}
            bg="bg-purple-50"
            iconColor="text-purple-600"
            index={1}
          />
          <StatTile
            label="IGST"
            value={fmtINR(currentMonthGST.igst)}
            sub="Integrated GST"
            icon={Receipt}
            bg="bg-blue-50"
            iconColor="text-blue-600"
            index={2}
          />
        </div>
      </div>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.12 }}
          className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5"
        >
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Collected GST
          </p>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {fmtINR(currentMonthGST.collectedGST)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Total GST billed to customers</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.16 }}
          className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5"
        >
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            ITC Claimed
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {fmtINR(currentMonthGST.itcClaimed)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Input Tax Credit utilized</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="rounded-2xl border border-amber-200 bg-amber-50 shadow-sm p-5"
        >
          <p className="text-xs font-medium text-amber-700 uppercase tracking-wide">GST Payable</p>
          <p className="mt-2 text-2xl font-bold text-amber-700">
            {fmtINR(currentMonthGST.payableGST)}
          </p>
          <p className="mt-1 text-xs text-amber-600">
            Net GST liability for {currentMonthGST.month}
          </p>
        </motion.div>
      </div>

      {/* Monthly GST Chart */}
      <SectionCard title="Monthly GST Trend" subtitle="CGST, SGST, and IGST breakdown by month">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={gstSummary}
            margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
            barCategoryGap="30%"
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
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value: number) => fmtINR(value)}
              contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="cgst" name="CGST" fill="#6366f1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="sgst" name="SGST" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="igst" name="IGST" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      {/* Monthly GST Table */}
      <SectionCard
        title="Monthly GST Summary"
        subtitle="Detailed GST data for each filing period"
        noPadding
      >
        <TableWrapper>
          <thead>
            <tr>
              <Th>Month</Th>
              <Th right>CGST</Th>
              <Th right>SGST</Th>
              <Th right>IGST</Th>
              <Th right>Collected GST</Th>
              <Th right>ITC Claimed</Th>
              <Th right>GST Payable</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {gstSummary.map((entry, idx) => {
              const isCurrent = entry.month === currentMonthGST.month;
              return (
                <motion.tr
                  key={entry.month}
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
                        {entry.month}
                        {isCurrent && (
                          <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-600">
                            Current
                          </span>
                        )}
                      </span>
                    </div>
                  </Td>
                  <Td right>
                    <span className="text-sm text-foreground">{fmtINR(entry.cgst)}</span>
                  </Td>
                  <Td right>
                    <span className="text-sm text-foreground">{fmtINR(entry.sgst)}</span>
                  </Td>
                  <Td right>
                    <span className="text-sm text-foreground">{fmtINR(entry.igst)}</span>
                  </Td>
                  <Td right>
                    <span className="text-sm font-medium text-foreground">
                      {fmtINR(entry.collectedGST)}
                    </span>
                  </Td>
                  <Td right>
                    <span className="text-sm text-emerald-600">{fmtINR(entry.itcClaimed)}</span>
                  </Td>
                  <Td right>
                    <span className="text-sm font-semibold text-amber-700">
                      {fmtINR(entry.payableGST)}
                    </span>
                  </Td>
                  <Td>
                    <button
                      onClick={() => exportMonth(entry)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-[11px] font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
                    >
                      <FileText className="h-3 w-3" />
                      Export CSV
                    </button>
                  </Td>
                </motion.tr>
              );
            })}
          </tbody>
        </TableWrapper>
      </SectionCard>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="rounded-2xl border border-blue-200 bg-blue-50 p-5"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-100">
            <Info className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-blue-800 mb-2">
              Understanding GST Components
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl bg-white/60 px-3 py-2.5 border border-blue-100">
                <p className="text-xs font-semibold text-blue-700 mb-1">CGST — Central GST</p>
                <p className="text-xs text-blue-600">
                  Levied by the Central Government on intra-state supply of goods and services.
                  Equal split with SGST.
                </p>
              </div>
              <div className="rounded-xl bg-white/60 px-3 py-2.5 border border-blue-100">
                <p className="text-xs font-semibold text-blue-700 mb-1">SGST — State GST</p>
                <p className="text-xs text-blue-600">
                  Levied by the State Government on intra-state transactions. Collected alongside
                  CGST at equal rates.
                </p>
              </div>
              <div className="rounded-xl bg-white/60 px-3 py-2.5 border border-blue-100">
                <p className="text-xs font-semibold text-blue-700 mb-1">IGST — Integrated GST</p>
                <p className="text-xs text-blue-600">
                  Applied on inter-state supply of goods/services and imports. Collected by Central
                  Government and shared.
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-blue-600">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>
                GST Registration: <strong>07AABCS1429B1ZB</strong> · Filing deadline: 20th of each
                month (GSTR-3B)
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
