/* Supabase is not generated with database row types in this project. */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { FileText, Landmark, Percent, Receipt } from "lucide-react";
import { fmtINR, fmtCompactINR } from "@/lib/reports-data";
import { ChartCard, KpiCard, SectionCard, TableWrapper, Th, Td } from "../shared";
import { useReportModel } from "@/hooks/useReportModel";

export function GstReportsTab() {
  const { model } = useReportModel();
  const gstMonthly = model?.gstMonths ?? [];
  const gstSummary = {
    totalCollected: gstMonthly.reduce((s: number, g: any) => s + g.collected, 0),
    totalITC: gstMonthly.reduce((s: number, g: any) => s + g.itcClaimed, 0),
    totalPayable: gstMonthly.reduce((s: number, g: any) => s + g.payable, 0),
    currentMonth: gstMonthly.at(-1) ?? { cgst: 0, sgst: 0, igst: 0, payable: 0 },
  };
  const cm = gstSummary.currentMonth;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">GST Reports</h2>
        <p className="text-sm text-muted-foreground mt-1">
          CGST, SGST, IGST breakdown with ITC claimed and payable summary.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard
          label="CGST (Jul)"
          value={fmtINR(cm.cgst)}
          icon={Landmark}
          bg="bg-blue-50"
          iconColor="text-blue-600"
          index={0}
        />
        <KpiCard
          label="SGST (Jul)"
          value={fmtINR(cm.sgst)}
          icon={Landmark}
          bg="bg-cyan-50"
          iconColor="text-cyan-600"
          index={1}
        />
        <KpiCard
          label="IGST (Jul)"
          value={fmtINR(cm.igst)}
          icon={Landmark}
          bg="bg-violet-50"
          iconColor="text-violet-600"
          index={2}
        />
        <KpiCard
          label="Payable (Jul)"
          value={fmtINR(cm.payable)}
          icon={Receipt}
          bg="bg-red-50"
          iconColor="text-red-600"
          index={3}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <SectionCard>
          <p className="text-xs text-muted-foreground">Total Collected (YTD)</p>
          <p className="text-xl font-bold text-foreground mt-1">
            {fmtINR(gstSummary.totalCollected)}
          </p>
        </SectionCard>
        <SectionCard>
          <p className="text-xs text-muted-foreground">ITC Claimed (YTD)</p>
          <p className="text-xl font-bold text-blue-600 mt-1">{fmtINR(gstSummary.totalITC)}</p>
        </SectionCard>
        <SectionCard>
          <p className="text-xs text-muted-foreground">Net Payable (YTD)</p>
          <p className="text-xl font-bold text-red-600 mt-1">{fmtINR(gstSummary.totalPayable)}</p>
        </SectionCard>
      </div>

      <ChartCard title="Monthly GST" subtitle="Collected vs ITC claimed vs payable">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={gstMonthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={1} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmtCompactINR(v)} width={54} />
            <Tooltip formatter={(v: number) => fmtINR(v)} />
            <Legend />
            <Bar dataKey="collected" fill="#10b981" radius={[4, 4, 0, 0]} name="Collected" />
            <Bar dataKey="itcClaimed" fill="#6366f1" radius={[4, 4, 0, 0]} name="ITC Claimed" />
            <Bar dataKey="payable" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Payable" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <SectionCard title="GST Summary" subtitle="Month-wise breakdown" noPadding>
        <TableWrapper>
          <thead>
            <tr>
              <Th>Month</Th>
              <Th right>CGST</Th>
              <Th right>SGST</Th>
              <Th right>IGST</Th>
              <Th right>Collected</Th>
              <Th right>ITC Claimed</Th>
              <Th right>Payable</Th>
            </tr>
          </thead>
          <tbody>
            {gstMonthly.map((g) => (
              <tr key={g.month} className="hover:bg-slate-50">
                <Td className="font-medium">{g.month}</Td>
                <Td right>{fmtINR(g.cgst)}</Td>
                <Td right>{fmtINR(g.sgst)}</Td>
                <Td right>{fmtINR(g.igst)}</Td>
                <Td right className="font-semibold text-emerald-600">
                  {fmtINR(g.collected)}
                </Td>
                <Td right className="text-blue-600">
                  {fmtINR(g.itcClaimed)}
                </Td>
                <Td right className="font-bold text-red-600">
                  {fmtINR(g.payable)}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
      </SectionCard>
    </div>
  );
}
