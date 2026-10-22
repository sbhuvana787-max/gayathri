/* Supabase is not generated with database row types in this project. */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Award, TrendingDown, Boxes, Layers } from "lucide-react";
import { fmtINR, fmtCompactINR } from "@/lib/reports-data";
import { ChartCard, KpiCard, SectionCard, TableWrapper, Th, Td } from "../shared";
import { useReportModel } from "@/hooks/useReportModel";

export function ProductReportsTab() {
  const { model } = useReportModel();
  const bestSellingProducts = model?.topProducts ?? [];
  const leastSellingProducts = model?.leastProducts ?? [];
  const productStockValue = [
    ...(model?.products ?? [])
      .reduce(
        (map: Map<string, number>, p: any) =>
          map.set(
            p.category,
            (map.get(p.category) ?? 0) +
              Number(p.current_stock || 0) * Number(p.cost_price || p.purchase_price || 0),
          ),
        new Map(),
      )
      .entries(),
  ].map(([category, stockValue]) => ({ category, stockValue }));
  const productCategoryPerformance = model?.categoriesData ?? [];
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Product Reports</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Best and least sellers, stock value, and category performance.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard
          label="Best Seller"
          value={bestSellingProducts[0]?.name?.split(" ").slice(0, 2).join(" ") ?? "—"}
          sub={`${(bestSellingProducts[0]?.unitsSold ?? 0).toLocaleString("en-IN")} units`}
          icon={Award}
          bg="bg-emerald-50"
          iconColor="text-emerald-600"
          index={0}
        />
        <KpiCard
          label="Least Seller"
          value={leastSellingProducts[0]?.name?.split(" ").slice(0, 2).join(" ") ?? "—"}
          sub={`${leastSellingProducts[0]?.unitsSold ?? 0} units`}
          icon={TrendingDown}
          bg="bg-red-50"
          iconColor="text-red-600"
          index={1}
        />
        <KpiCard
          label="Total Stock Value"
          value={fmtCompactINR(productStockValue.reduce((s, c) => s + c.stockValue, 0))}
          icon={Boxes}
          bg="bg-violet-50"
          iconColor="text-violet-600"
          index={2}
        />
        <KpiCard
          label="Categories Tracked"
          value={productCategoryPerformance.length.toString()}
          icon={Layers}
          bg="bg-blue-50"
          iconColor="text-blue-600"
          index={3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Best Selling Products" subtitle="By units sold">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={bestSellingProducts} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={150} />
              <Tooltip />
              <Bar dataKey="unitsSold" fill="#10b981" radius={[0, 4, 4, 0]} name="Units Sold" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Stock Value by Category" subtitle="Current valuation">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={productStockValue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="category" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmtCompactINR(v)} width={54} />
              <Tooltip formatter={(v: number) => fmtINR(v)} />
              <Bar dataKey="stockValue" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Stock Value" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <SectionCard
        title="Least Selling Products"
        subtitle="Candidates for clearance or discontinuation"
        noPadding
      >
        <TableWrapper>
          <thead>
            <tr>
              <Th>Product</Th>
              <Th>Category</Th>
              <Th right>Units Sold</Th>
              <Th right>Revenue</Th>
            </tr>
          </thead>
          <tbody>
            {leastSellingProducts.map((p) => (
              <tr key={p.name} className="hover:bg-slate-50">
                <Td className="font-medium">{p.name}</Td>
                <Td>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    {p.category}
                  </span>
                </Td>
                <Td right>{p.unitsSold}</Td>
                <Td right className="text-amber-600">
                  {fmtINR(p.revenue)}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
      </SectionCard>

      <SectionCard title="Category Performance" subtitle="Revenue share and turnover" noPadding>
        <TableWrapper>
          <thead>
            <tr>
              <Th>Category</Th>
              <Th right>Revenue</Th>
              <Th right>Share</Th>
              <Th right>Turnover Rate</Th>
            </tr>
          </thead>
          <tbody>
            {productCategoryPerformance.map((c) => (
              <tr key={c.name} className="hover:bg-slate-50">
                <Td className="font-medium">{c.name}</Td>
                <Td right className="font-semibold">
                  {fmtINR(c.revenue)}
                </Td>
                <Td right>{c.share}%</Td>
                <Td right>{c.turnoverRate}x</Td>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
      </SectionCard>
    </div>
  );
}
