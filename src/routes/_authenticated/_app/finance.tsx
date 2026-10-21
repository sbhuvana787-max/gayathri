import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutGrid,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Building2,
  ArrowLeftRight,
  FileText,
  BarChart3,
  Users,
  Truck,
  Settings,
  Receipt,
} from "lucide-react";

import { OverviewTab } from "../../../components/finance/tabs/OverviewTab";
import { IncomeTab } from "../../../components/finance/tabs/IncomeTab";
import { ExpensesTab } from "../../../components/finance/tabs/ExpensesTab";
import { CashbookTab } from "../../../components/finance/tabs/CashbookTab";
import { BankAccountsTab } from "../../../components/finance/tabs/BankAccountsTab";
import { TransactionsTab } from "../../../components/finance/tabs/TransactionsTab";
import { GSTSummaryTab } from "../../../components/finance/tabs/GSTSummaryTab";
import { ProfitLossTab } from "../../../components/finance/tabs/ProfitLossTab";
import { ReceivablesTab } from "../../../components/finance/tabs/ReceivablesTab";
import { PayablesTab } from "../../../components/finance/tabs/PayablesTab";
import { ReportsTab } from "../../../components/finance/tabs/ReportsTab";
import { FinanceSettingsTab } from "../../../components/finance/tabs/FinanceSettingsTab";
import { useBusiness } from "../../../contexts/BusinessContext";

export const Route = createFileRoute("/_authenticated/_app/finance")({
  component: FinancePage,
});

// ── Sub-navigation ────────────────────────────────────────────────

type TabId =
  | "overview"
  | "income"
  | "expenses"
  | "cashbook"
  | "bank-accounts"
  | "transactions"
  | "gst-summary"
  | "profit-loss"
  | "receivables"
  | "payables"
  | "reports"
  | "settings";

interface FinanceNavItem {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

const navItems: FinanceNavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "income", label: "Income", icon: TrendingUp },
  { id: "expenses", label: "Expenses", icon: TrendingDown },
  { id: "cashbook", label: "Cashbook", icon: BookOpen },
  { id: "bank-accounts", label: "Bank Accounts", icon: Building2 },
  { id: "transactions", label: "Transactions", icon: ArrowLeftRight },
  { id: "gst-summary", label: "GST Summary", icon: Receipt },
  { id: "profit-loss", label: "Profit & Loss", icon: BarChart3 },
  { id: "receivables", label: "Receivables", icon: Users },
  { id: "payables", label: "Payables", icon: Truck },
  { id: "reports", label: "Finance Reports", icon: FileText },
  { id: "settings", label: "Finance Settings", icon: Settings },
];

// ── Page ──────────────────────────────────────────────────────────

function FinancePage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const { business } = useBusiness();

  return (
    <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px] space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Finance & Accounting</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Income, expenses, GST, P&amp;L, and bank accounts — all in one place.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {business?.financial_year && (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                FY {business.financial_year}
              </span>
            )}
            {business?.gst_number && (
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-muted-foreground">
                GSTIN: {business.gst_number}
              </span>
            )}
          </div>
        </div>

        {/* Sub-navigation */}
        <div className="rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
          <div className="flex gap-1 overflow-x-auto scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-150 ${
                    active
                      ? "bg-[image:var(--gradient-brand)] text-white shadow-[0_4px_16px_-4px_oklch(0.62_0.22_258/0.45)]"
                      : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : ""}`} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active tab content */}
        <div>
          {activeTab === "overview" && (
            <OverviewTab onNavigate={(id) => setActiveTab(id as TabId)} />
          )}
          {activeTab === "income" && <IncomeTab />}
          {activeTab === "expenses" && <ExpensesTab />}
          {activeTab === "cashbook" && <CashbookTab />}
          {activeTab === "bank-accounts" && <BankAccountsTab />}
          {activeTab === "transactions" && <TransactionsTab />}
          {activeTab === "gst-summary" && <GSTSummaryTab />}
          {activeTab === "profit-loss" && <ProfitLossTab />}
          {activeTab === "receivables" && <ReceivablesTab />}
          {activeTab === "payables" && <PayablesTab />}
          {activeTab === "reports" && <ReportsTab />}
          {activeTab === "settings" && <FinanceSettingsTab />}
        </div>
      </div>
    </div>
  );
}
