/**
 * useDashboardData — aggregates live Supabase data for the main Dashboard.
 *
 * Feeds the Revenue Overview chart, Sales Trend chart, Top Products list,
 * Recent Activity feed, Business Health metrics, and KPI cards.
 * Uses the same React Query caches as the individual module hooks, so any
 * create/update/delete in Billing, Inventory, or CRM auto-refreshes here.
 */

import { useMemo } from "react";
import { useInvoices } from "./useInvoicesQuery";
import { useCustomers } from "./useCustomersQuery";
import { useProducts } from "./useProductsQuery";
import { useInventoryMovements } from "./useInventoryMovementsQuery";
import { computeDocumentTotals } from "../lib/billing-data";
import type { Invoice } from "../lib/billing-data";
import { dbToProduct } from "../services/products";
import { getStockStatus, fmtINR } from "../lib/inventory-data";

// ── Colours for top-products chart (stable per rank) ─────────────────

const TOP_PRODUCT_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

// ── Helpers ───────────────────────────────────────────────────────────

function grandTotal(inv: Invoice): number {
  return computeDocumentTotals(inv.items, inv.isInterState).grandTotal;
}

function timeAgo(isoOrDate: string): string {
  const diff = Date.now() - new Date(isoOrDate).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// ── Return shape ──────────────────────────────────────────────────────

export interface DashboardActivityItem {
  key: string;
  icon: string;
  color: string;
  label: string;
  sub: string;
  time: string;
  type: string;
}

export interface DashboardTopProduct {
  name: string;
  sales: number;
  color: string;
}

export interface DashboardHealthMetric {
  label: string;
  value: string;
  sub: string;
  score: number;
  color: string;
  bar: string;
}

export interface DashboardRevenuePoint {
  date: string;
  revenue: number;
  target: number;
}

export interface DashboardSalesPoint {
  day: string;
  sales: number;
  returns: number;
}

export interface DashboardData {
  revenueData: DashboardRevenuePoint[];
  salesData: DashboardSalesPoint[];
  topProducts: DashboardTopProduct[];
  activityFeed: DashboardActivityItem[];
  healthMetrics: DashboardHealthMetric[];
  overallScore: number;
  monthlyRevenue: number;
  monthlyGrowth: string;
  monthlyGrowthPositive: boolean;
  aiInsight: string;
  isEmpty: boolean;
}

// ── Hook ──────────────────────────────────────────────────────────────

export function useDashboardData(businessId: string | null) {
  const invoicesQ = useInvoices(businessId);
  const customersQ = useCustomers(businessId);
  const productsQ = useProducts(businessId);
  const movementsQ = useInventoryMovements(businessId);

  const isLoading =
    invoicesQ.isLoading || customersQ.isLoading || productsQ.isLoading || movementsQ.isLoading;

  const isError = invoicesQ.isError || customersQ.isError || productsQ.isError;

  const data = useMemo<DashboardData>(() => {
    const invoices = invoicesQ.data ?? [];
    const customers = customersQ.data ?? [];
    const dbProducts = productsQ.data ?? [];
    const movements = movementsQ.data ?? [];

    const products = dbProducts.map(dbToProduct);
    const customerNameMap = new Map(customers.map((c) => [c.id, c.name]));
    const productNameMap = new Map(dbProducts.map((p) => [p.id, p.name]));

    const now = new Date();
    const thisMonthStr = monthKey(now);
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStr = monthKey(lastMonthDate);

    // ── Revenue per calendar date ─────────────────────────────────
    const revenueByDate: Record<string, number> = {};
    invoices.forEach((inv) => {
      if (inv.status === "cancelled") return;
      revenueByDate[inv.createdDate] = (revenueByDate[inv.createdDate] ?? 0) + grandTotal(inv);
    });

    // ── Revenue Overview chart — last 13 calendar days ────────────
    const revenueChartPoints = Array.from({ length: 13 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (12 - i));
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      return { date: label, revenue: revenueByDate[key] ?? 0 };
    });

    // Daily average of all-time revenue as a rolling target
    const allRevValues = Object.values(revenueByDate);
    const avgDaily =
      allRevValues.length > 0 ? allRevValues.reduce((a, b) => a + b, 0) / allRevValues.length : 0;
    const target = Math.round(avgDaily * 1.1);

    const revenueData: DashboardRevenuePoint[] = revenueChartPoints.map((d) => ({
      ...d,
      target,
    }));

    // ── Sales Trend — current Mon–Sun week ────────────────────────
    const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const salesCountByDay: Record<string, { sales: number; returns: number }> = Object.fromEntries(
      DAY_NAMES.map((d) => [d, { sales: 0, returns: 0 }]),
    );

    // Start of current week (Monday)
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    weekStart.setHours(0, 0, 0, 0);

    invoices.forEach((inv) => {
      const d = new Date(inv.createdDate + "T00:00:00");
      if (d < weekStart) return;
      // getDay(): 0=Sun,1=Mon…6=Sat  → map to Mon=0…Sun=6
      const dayIndex = (d.getDay() + 6) % 7;
      const dayName = DAY_NAMES[dayIndex];
      if (inv.status === "cancelled") {
        salesCountByDay[dayName].returns++;
      } else {
        salesCountByDay[dayName].sales++;
      }
    });

    const salesData: DashboardSalesPoint[] = DAY_NAMES.map((day) => ({
      day,
      ...salesCountByDay[day],
    }));

    // ── Top Products by revenue (from invoice line-items) ─────────
    const productRevMap: Record<string, { name: string; sales: number }> = {};
    invoices.forEach((inv) => {
      if (inv.status === "cancelled") return;
      (inv.items ?? []).forEach((item) => {
        const key = item.productId || "unknown";
        const name = (item.productId && productNameMap.get(item.productId)) || "Unknown Product";
        const rev = (item.quantity ?? 0) * (item.unitPrice ?? 0);
        if (!productRevMap[key]) productRevMap[key] = { name, sales: 0 };
        productRevMap[key].sales += rev;
      });
    });

    const topProducts: DashboardTopProduct[] = Object.values(productRevMap)
      .filter((p) => p.sales > 0)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5)
      .map((p, i) => ({ ...p, color: TOP_PRODUCT_COLORS[i] }));

    // ── Monthly revenue (this month vs last month) ─────────────────
    const thisMonthRevenue = invoices
      .filter((inv) => inv.createdDate.startsWith(thisMonthStr) && inv.status !== "cancelled")
      .reduce((s, inv) => s + grandTotal(inv), 0);

    const lastMonthRevenue = invoices
      .filter((inv) => inv.createdDate.startsWith(lastMonthStr) && inv.status !== "cancelled")
      .reduce((s, inv) => s + grandTotal(inv), 0);

    const growthNum =
      lastMonthRevenue > 0
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : thisMonthRevenue > 0
          ? 100
          : 0;

    const monthlyGrowth = growthNum >= 0 ? `+${growthNum.toFixed(1)}%` : `${growthNum.toFixed(1)}%`;
    const monthlyGrowthPositive = growthNum >= 0;

    // ── Activity Feed — invoices + movements + low-stock ──────────
    const activityItems: (DashboardActivityItem & { ts: number })[] = [];

    // Invoice events (latest 20)
    [...invoices]
      .sort(
        (a, b) =>
          new Date(b.createdDate + "T00:00:00").getTime() -
          new Date(a.createdDate + "T00:00:00").getTime(),
      )
      .slice(0, 20)
      .forEach((inv) => {
        const cname = customerNameMap.get(inv.customerId) ?? "Customer";
        const total = grandTotal(inv);
        const ts = new Date(inv.createdDate + "T00:00:00").getTime();

        if (inv.status === "paid") {
          activityItems.push({
            key: `inv-paid-${inv.id}`,
            icon: "💳",
            color: "bg-green-50 text-green-600",
            label: "Payment received",
            sub: `${fmtINR(inv.amountPaid || total)} from ${cname}`,
            time: timeAgo(inv.createdDate + "T00:00:00"),
            ts,
            type: "success",
          });
        } else if (inv.status === "overdue") {
          activityItems.push({
            key: `inv-overdue-${inv.id}`,
            icon: "⚠️",
            color: "bg-amber-50 text-amber-600",
            label: "Invoice overdue",
            sub: `${inv.invoiceNumber} — ${fmtINR(grandTotal(inv) - inv.amountPaid)} past due`,
            time: timeAgo(inv.createdDate + "T00:00:00"),
            ts,
            type: "warning",
          });
        } else if (inv.status !== "cancelled") {
          activityItems.push({
            key: `inv-created-${inv.id}`,
            icon: "🧾",
            color: "bg-blue-50 text-blue-600",
            label: "Invoice created",
            sub: `${inv.invoiceNumber} for ${cname}`,
            time: timeAgo(inv.createdDate + "T00:00:00"),
            ts,
            type: "info",
          });
        }
      });

    // Inventory movement events (latest 10)
    movements.slice(0, 10).forEach((m) => {
      const pname = productNameMap.get(m.product_id) ?? "Product";
      const isIn = m.movement_type === "in";
      const qty = isIn ? `+${m.quantity}` : `-${m.quantity}`;
      const ts = new Date(m.created_at).getTime();
      activityItems.push({
        key: `mv-${m.id}`,
        icon: isIn ? "✅" : "📦",
        color: isIn ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600",
        label: isIn ? "Stock updated" : "Stock removed",
        sub: `${pname} — ${qty} units`,
        time: timeAgo(m.created_at),
        ts,
        type: isIn ? "success" : "warning",
      });
    });

    // Customer added events (latest 5)
    [...customers]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .forEach((c) => {
        const ts = new Date(c.created_at).getTime();
        activityItems.push({
          key: `cust-${c.id}`,
          icon: "👤",
          color: "bg-purple-50 text-purple-600",
          label: "New customer added",
          sub: `${c.name}${c.city ? ` — ${c.city}` : ""}`,
          time: timeAgo(c.created_at),
          ts,
          type: "info",
        });
      });

    // Low-stock alerts (pinned near-top via very recent ts)
    const lowStockProds = products.filter((p) => {
      const s = getStockStatus(p);
      return s === "low-stock" || s === "critical";
    });
    lowStockProds.slice(0, 2).forEach((p, i) => {
      activityItems.push({
        key: `ls-${p.id}`,
        icon: "📦",
        color: "bg-red-50 text-red-600",
        label: "Low stock alert",
        sub: `${p.name} — only ${p.currentStock} units left`,
        time: "Now",
        ts: Date.now() - i * 1000,
        type: "warning",
      });
    });

    const activityFeed: DashboardActivityItem[] = activityItems
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 6)
      .map(({ ts: _ts, ...rest }) => rest);

    // ── Business Health metrics ───────────────────────────────────
    // Revenue Growth
    const revScore = Math.min(100, Math.max(0, 50 + growthNum));
    const revValueStr = growthNum >= 0 ? `+${growthNum.toFixed(0)}%` : `${growthNum.toFixed(0)}%`;

    // Inventory Health
    const alertCount = products.filter((p) => {
      const s = getStockStatus(p);
      return s === "low-stock" || s === "critical" || s === "out-of-stock";
    }).length;
    const invScore =
      products.length > 0 ? Math.round((1 - alertCount / products.length) * 100) : 100;

    // Customer Growth (new this month)
    const newCustomers = customers.filter((c) => c.created_at.startsWith(thisMonthStr)).length;
    const custScore = Math.min(100, 50 + newCustomers * 10);
    const custValueStr = newCustomers > 0 ? `+${newCustomers} new` : "No new";

    // Payment Recovery
    const paidCount = invoices.filter((i) => i.status === "paid").length;
    const nonCancelled = invoices.filter((i) => i.status !== "cancelled").length;
    const collectionRate = nonCancelled > 0 ? Math.round((paidCount / nonCancelled) * 100) : 100;

    const healthMetrics: DashboardHealthMetric[] = [
      {
        label: "Revenue Growth",
        value: revValueStr,
        sub: "vs last month",
        score: Math.round(revScore),
        color: growthNum >= 0 ? "text-emerald-600" : "text-red-600",
        bar: growthNum >= 0 ? "bg-emerald-500" : "bg-red-500",
      },
      {
        label: "Inventory Health",
        value: alertCount > 0 ? `${alertCount} alerts` : "All good",
        sub: "stock status",
        score: invScore,
        color: alertCount === 0 ? "text-emerald-600" : "text-amber-600",
        bar: alertCount === 0 ? "bg-emerald-500" : "bg-amber-500",
      },
      {
        label: "Customer Growth",
        value: custValueStr,
        sub: "this month",
        score: custScore,
        color: "text-blue-600",
        bar: "bg-blue-500",
      },
      {
        label: "Payment Recovery",
        value: `${collectionRate}%`,
        sub: "collected on time",
        score: collectionRate,
        color: "text-violet-600",
        bar: "bg-violet-500",
      },
    ];

    const overallScore = Math.round((revScore + invScore + custScore + collectionRate) / 4);

    // ── AI Insight ────────────────────────────────────────────────
    const isEmpty = invoices.length === 0 && products.length === 0 && customers.length === 0;

    let aiInsight: string;
    if (isEmpty) {
      aiInsight =
        "Welcome to Nexora! Start by adding products and creating your first invoice to see live insights here.";
    } else if (lowStockProds.length > 0) {
      const names = lowStockProds
        .slice(0, 2)
        .map((p) => p.name)
        .join(" and ");
      const rev =
        thisMonthRevenue > 0 ? `Your revenue this month is ${fmtINR(thisMonthRevenue)}. ` : "";
      aiInsight = `${rev}Consider restocking ${names} to avoid stockouts.`;
    } else if (growthNum > 0 && lastMonthRevenue > 0) {
      aiInsight = `Revenue is up ${growthNum.toFixed(0)}% this month vs last month. You have ${paidCount} paid invoice${paidCount !== 1 ? "s" : ""} collected so far.`;
    } else if (invoices.length > 0) {
      aiInsight = `You have ${invoices.length} invoice${invoices.length !== 1 ? "s" : ""} and ${customers.length} customer${customers.length !== 1 ? "s" : ""} registered. Keep growing!`;
    } else {
      aiInsight = "Start adding invoices and customers to see live business insights here.";
    }

    return {
      revenueData,
      salesData,
      topProducts,
      activityFeed,
      healthMetrics,
      overallScore,
      monthlyRevenue: thisMonthRevenue,
      monthlyGrowth,
      monthlyGrowthPositive,
      aiInsight,
      isEmpty,
    };
  }, [invoicesQ.data, customersQ.data, productsQ.data, movementsQ.data]);

  return { data, isLoading, isError };
}
