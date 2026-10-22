import { useEffect, useState } from "react";
import { Users2, X } from "lucide-react";
import { toast } from "sonner";
import { SectionCard, FormField, TextInput, Select, SaveBar } from "@/components/settings/shared";
import { useBusiness } from "@/contexts/BusinessContext";
import { useCrmSettings, useSaveCrmSettings } from "@/hooks/useCrmQuery";

export function CustomerSettingsTab() {
  const { business } = useBusiness();
  const { data: settings } = useCrmSettings(business?.id ?? null);
  const saveSettings = useSaveCrmSettings(business?.id ?? null);
  const [numberFormat, setNumberFormat] = useState("cust-seq");
  const [creditDays, setCreditDays] = useState("30");
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setNumberFormat(settings.customer_number_format);
    setCreditDays(String(settings.default_credit_days));
    setCategories(settings.customer_categories);
  }, [settings]);

  function addCategory() {
    const trimmed = newCategory.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories((prev) => [...prev, trimmed]);
      setNewCategory("");
    }
  }

  function removeCategory(c: string) {
    setCategories((prev) => prev.filter((x) => x !== c));
  }

  async function handleSave() {
    if (!settings) {
      toast.error("Customer settings are not available yet.");
      return;
    }
    const days = Number(creditDays);
    if (!Number.isInteger(days) || days < 0) {
      toast.error("Default credit days must be a non-negative whole number.");
      return;
    }
    try {
      await saveSettings.mutateAsync({
        ...settings,
        default_credit_days: days,
        customer_categories: categories,
        customer_number_format: numberFormat as typeof settings.customer_number_format,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save customer settings.");
    }
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Customer Settings"
        subtitle="Defaults used across the CRM module"
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50">
            <Users2 className="h-4 w-4 text-amber-600" />
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField label="Customer Number Format">
            <Select
              value={numberFormat}
              onChange={setNumberFormat}
              options={[
                { value: "cust-seq", label: "CUST-0001" },
                { value: "plain-seq", label: "0001" },
                { value: "yyyy-seq", label: "2026-0001" },
              ]}
              className="w-full"
            />
          </FormField>
          <FormField label="Default Credit Days" hint="Applied when a new customer is added">
            <TextInput value={creditDays} onChange={setCreditDays} type="number" />
          </FormField>
        </div>
      </SectionCard>

      <SectionCard
        title="Customer Categories"
        subtitle="Segment customers for pricing, reporting, and targeted offers"
      >
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-foreground"
            >
              {c}
              <button
                onClick={() => removeCategory(c)}
                className="text-slate-400 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <TextInput
            value={newCategory}
            onChange={setNewCategory}
            placeholder="Add a category…"
            className="max-w-xs"
          />
          <button
            onClick={addCategory}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-foreground hover:bg-slate-50"
          >
            Add
          </button>
        </div>
      </SectionCard>

      <SaveBar
        saved={saved}
        onSave={handleSave}
        label={saveSettings.isPending ? "Saving…" : "Save Changes"}
      />
    </div>
  );
}
