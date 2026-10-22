import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { dateRangeOptions, defaultReportSettings, type DateRangeId } from "@/lib/reports-data";
import { SectionCard, Select, PrimaryButton } from "../shared";

const currencyOptions = [
  { value: "INR", label: "Indian Rupee (₹)" },
  { value: "USD", label: "US Dollar ($)" },
  { value: "EUR", label: "Euro (€)" },
];

const themeOptions = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function ReportSettingsTab() {
  const [defaultDateRange, setDefaultDateRange] = useState<DateRangeId>(
    () => readSettings().defaultDateRange,
  );
  const [currency, setCurrency] = useState(() => readSettings().currency);
  const [showTax, setShowTax] = useState(() => readSettings().showTaxInReports);
  const [theme, setTheme] = useState<"light" | "dark">(() => readSettings().theme);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    try {
      localStorage.setItem(
        "nexora:report-settings",
        JSON.stringify({ defaultDateRange, currency, showTaxInReports: showTax, theme }),
      );
    } catch {
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Report Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure defaults applied across every report in this module.
        </p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> Settings saved.
        </div>
      )}

      <SectionCard title="Defaults" subtitle="Applied when opening any report">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Default Date Range
            </label>
            <Select
              value={defaultDateRange}
              onChange={(v) => setDefaultDateRange(v as DateRangeId)}
              options={dateRangeOptions}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Currency
            </label>
            <Select
              value={currency}
              onChange={setCurrency}
              options={currencyOptions}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Report Theme
            </label>
            <Select
              value={theme}
              onChange={(v) => setTheme(v as "light" | "dark")}
              options={themeOptions}
              className="w-full"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2.5 text-sm font-medium text-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showTax}
                onChange={(e) => setShowTax(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[color:var(--brand-electric)] focus:ring-[color:var(--brand-electric)]"
              />
              Show tax breakdown in reports
            </label>
          </div>
        </div>
      </SectionCard>

      <PrimaryButton onClick={handleSave}>Save Settings</PrimaryButton>
    </div>
  );
}

function readSettings() {
  if (typeof window === "undefined") return defaultReportSettings;
  try {
    const saved = localStorage.getItem("nexora:report-settings");
    return saved ? { ...defaultReportSettings, ...JSON.parse(saved) } : defaultReportSettings;
  } catch {
    return defaultReportSettings;
  }
}
