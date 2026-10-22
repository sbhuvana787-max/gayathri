/** Formatting and stable option lists shared by the Reports UI. Report values are loaded from Supabase. */
function reportCurrency(): string {
  if (typeof window === "undefined") return "INR";
  try {
    const saved = localStorage.getItem("nexora:report-settings");
    return saved ? JSON.parse(saved).currency || "INR" : "INR";
  } catch {
    return "INR";
  }
}

export function fmtINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: reportCurrency(),
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export function fmtCompactINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: reportCurrency(),
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number.isFinite(value) ? value : 0);
}

export function fmtDate(value: string): string {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export type DateRangeId =
  | "today"
  | "yesterday"
  | "this-week"
  | "this-month"
  | "last-month"
  | "this-quarter"
  | "this-year"
  | "custom";
export const dateRangeOptions: { value: DateRangeId; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this-week", label: "This Week" },
  { value: "this-month", label: "This Month" },
  { value: "last-month", label: "Last Month" },
  { value: "this-quarter", label: "This Quarter" },
  { value: "this-year", label: "This Year" },
  { value: "custom", label: "Custom Range" },
];

export type SalesPeriod = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
export const CHART_COLORS = [
  "#6366f1",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#84cc16",
];
export const defaultReportSettings = {
  defaultDateRange: "this-month" as DateRangeId,
  currency: "INR",
  showTaxInReports: true,
  theme: "light" as "light" | "dark",
};
export const exportableReports = [
  "Executive Dashboard",
  "Sales Report",
  "Billing Report",
  "Inventory Report",
  "CRM Report",
  "Finance Report",
  "GST Report",
  "Customer Report",
  "Product Report",
];
