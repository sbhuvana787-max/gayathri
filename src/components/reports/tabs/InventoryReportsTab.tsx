/* Supabase is not generated with database row types in this project. */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Boxes, AlertTriangle, Archive, Layers } from "lucide-react";
import { fmtINR, fmtCompactINR } from "@/lib/reports-data";
import { ChartCard, KpiCard, SectionCard, TableWrapper, Th, Td, StatusPill } from "../shared";
import { useReportModel } from "@/hooks/useReportModel";

export function InventoryReportsTab() {
  const { model } = useReportModel();
  const lowStockItems = (model?.lowStock ?? []).map((p: any) => ({
    name: p.name,
    sku: p.sku,
    stock: p.current_stock,
    reorderLevel: p.minimum_stock,
  }));
  const deadStockItems = (model?.deadStock ?? []).map((p: any) => ({
    name: p.name,
    sku: p.sku,
    stock: p.current_stock,
    daysIdle: p.daysIdle,
  }));
  const fastMovingProducts = (model?.topProducts ?? []).slice(0, 10);
  const slowMovingProducts = [...(model?.topProducts ?? [])].slice(-10).reverse();
  const categoryPerformance = model?.categoriesData ?? [];
  const inventoryStats = {
    totalValue: model?.stockValue ?? 0,
    lowStockCount: lowStockItems.length,
    deadStockCount: deadStockItems.length,
    totalSKUs: model?.products.length ?? 0,
  };
  const supplierPerformance = (model?.suppliers ?? []).map((supplier: any) => {
    const bills =
      (model as any)?.bills?.filter((bill: any) => bill.supplier_id === supplier.id) ?? [];
    const orders =
      (model as any)?.purchaseOrders?.filter(
        (order: any) =>
          order.supplier_id === supplier.id && !["draft", "cancelled"].includes(order.status),
      ) ?? [];
    const receipts = (model as any)?.receipts ?? [];
    const receivedOrders = orders.filter((order: any) =>
      receipts.some((receipt: any) => receipt.purchase_order_id === order.id),
    );
    const onTime = receivedOrders.filter((order: any) =>
      receipts.some(
        (receipt: any) =>
          receipt.purchase_order_id === order.id && receipt.received_date <= order.expected_date,
      ),
    ).length;
    return {
      name: supplier.name,
      orders: orders.length,
      onTimeRate: receivedOrders.length
        ? Math.round((onTime / receivedOrders.length) * 1000) / 10
        : 0,
      totalValue: bills.reduce((sum: number, bill: any) => sum + Number(bill.total || 0), 0),
    };
  });
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Inventory Reports</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Stock valuation, movement velocity, and supplier reliability.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard
          label="Inventory Value"
          value={fmtINR(inventoryStats.totalValue)}
          icon={Boxes}
          bg="bg-violet-50"
          iconColor="text-violet-600"
          index={0}
        />
        <KpiCard
          label="Low Stock Items"
          value={inventoryStats.lowStockCount.toString()}
          icon={AlertTriangle}
          bg="bg-amber-50"
          iconColor="text-amber-600"
          index={1}
        />
        <KpiCard
          label="Dead Stock Items"
          value={inventoryStats.deadStockCount.toString()}
          icon={Archive}
          bg="bg-red-50"
          iconColor="text-red-600"
          index={2}
        />
        <KpiCard
          label="Total SKUs"
          value={inventoryStats.totalSKUs.toLocaleString("en-IN")}
          icon={Layers}
          bg="bg-blue-50"
          iconColor="text-blue-600"
          index={3}
        />
      </div>

      <ChartCard title="Category Performance" subtitle="Revenue and turnover rate by category">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={categoryPerformance}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmtCompactINR(v)} width={54} />
            <Tooltip formatter={(v: number) => fmtINR(v)} />
            <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Revenue" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard title="Low Stock" subtitle="Items below reorder level" noPadding>
          <TableWrapper>
            <thead>
              <tr>
                <Th>Product</Th>
                <Th>SKU</Th>
                <Th right>Stock</Th>
                <Th right>Reorder Level</Th>
              </tr>
            </thead>
            <tbody>
              {lowStockItems.map((i) => (
                <tr key={i.sku} className="hover:bg-slate-50">
                  <Td className="font-medium">{i.name}</Td>
                  <Td>
                    <span className="font-mono text-xs">{i.sku}</span>
                  </Td>
                  <Td right>
                    <StatusPill status="low" label={i.stock.toString()} />
                  </Td>
                  <Td right>{i.reorderLevel}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        </SectionCard>

        <SectionCard title="Dead Stock" subtitle="No movement in 90+ days" noPadding>
          <TableWrapper>
            <thead>
              <tr>
                <Th>Product</Th>
                <Th>SKU</Th>
                <Th right>Stock</Th>
                <Th right>Days Idle</Th>
              </tr>
            </thead>
            <tbody>
              {deadStockItems.map((i) => (
                <tr key={i.sku} className="hover:bg-slate-50">
                  <Td className="font-medium">{i.name}</Td>
                  <Td>
                    <span className="font-mono text-xs">{i.sku}</span>
                  </Td>
                  <Td right>{i.stock}</Td>
                  <Td right>
                    <StatusPill status="dead" label={`${i.daysIdle}d`} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        </SectionCard>

        <SectionCard title="Fast Moving Products" subtitle="Highest turnover" noPadding>
          <TableWrapper>
            <thead>
              <tr>
                <Th>Product</Th>
                <Th right>Units Sold</Th>
                <Th right>Revenue</Th>
              </tr>
            </thead>
            <tbody>
              {fastMovingProducts.map((p) => (
                <tr key={p.name} className="hover:bg-slate-50">
                  <Td className="font-medium">{p.name}</Td>
                  <Td right>{p.unitsSold.toLocaleString("en-IN")}</Td>
                  <Td right className="font-semibold text-emerald-600">
                    {fmtINR(p.revenue)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        </SectionCard>

        <SectionCard title="Slow Moving Products" subtitle="Lowest turnover" noPadding>
          <TableWrapper>
            <thead>
              <tr>
                <Th>Product</Th>
                <Th right>Units Sold</Th>
                <Th right>Revenue</Th>
              </tr>
            </thead>
            <tbody>
              {slowMovingProducts.map((p) => (
                <tr key={p.name} className="hover:bg-slate-50">
                  <Td className="font-medium">{p.name}</Td>
                  <Td right>{p.unitsSold.toLocaleString("en-IN")}</Td>
                  <Td right className="text-amber-600">
                    {fmtINR(p.revenue)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        </SectionCard>
      </div>

      <SectionCard
        title="Supplier Performance"
        subtitle="On-time delivery rate and order value"
        noPadding
      >
        <TableWrapper>
          <thead>
            <tr>
              <Th>Supplier</Th>
              <Th right>Orders</Th>
              <Th right>On-Time Rate</Th>
              <Th right>Total Value</Th>
            </tr>
          </thead>
          <tbody>
            {supplierPerformance.map((s) => (
              <tr key={s.name} className="hover:bg-slate-50">
                <Td className="font-medium">{s.name}</Td>
                <Td right>{s.orders}</Td>
                <Td right>
                  <StatusPill
                    status={s.onTimeRate >= 90 ? "positive" : "low"}
                    label={`${s.onTimeRate}%`}
                  />
                </Td>
                <Td right className="font-semibold">
                  {fmtINR(s.totalValue)}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
      </SectionCard>
    </div>
  );
}
