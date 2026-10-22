import { useEffect, useState } from "react";
import { Palette } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useBusiness } from "@/contexts/BusinessContext";
import { useUpdateBusiness } from "@/hooks/useBusinessQuery";
import { SectionCard, FormField, Select, SaveBar } from "@/components/settings/shared";
import { languageOptions, dateFormatOptions, timezoneOptions } from "@/lib/settings-data";

export function PreferencesTab() {
  const { business } = useBusiness();
  const { user } = useAuth();
  const updateBusiness = useUpdateBusiness(user?.id ?? null);
  const [language, setLanguage] = useState("");
  const [dateFormat, setDateFormat] = useState("dd-mm-yyyy");
  const [timezone, setTimezone] = useState("");
  const [theme, setTheme] = useState("light");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!business) return;
    setLanguage(business.language || "en");
    setDateFormat(business.date_format || "dd-mm-yyyy");
    setTimezone(business.timezone || "Asia/Kolkata");
    setTheme(business.theme || "light");
  }, [business]);

  async function handleSave() {
    try {
      await updateBusiness.mutateAsync({ language, date_format: dateFormat, timezone, theme });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save preferences.");
    }
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Preferences"
        subtitle="Personalize language, formats, and appearance"
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-50">
            <Palette className="h-4 w-4 text-pink-600" />
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField label="Language">
            <Select
              value={language}
              onChange={setLanguage}
              options={languageOptions}
              className="w-full"
            />
          </FormField>
          <FormField label="Date Format">
            <Select
              value={dateFormat}
              onChange={setDateFormat}
              options={dateFormatOptions}
              className="w-full"
            />
          </FormField>
          <FormField label="Time Zone">
            <Select
              value={timezone}
              onChange={setTimezone}
              options={timezoneOptions}
              className="w-full"
            />
          </FormField>
          <FormField label="Theme" hint="Dark mode is coming soon — placeholder for now">
            <div className="flex gap-2">
              {[
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
                { value: "system", label: "System" },
              ].map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  disabled={t.value !== "light"}
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    theme === t.value
                      ? "border-[color:var(--brand-electric)] bg-[color:var(--brand-electric)]/5 text-[color:var(--brand-electric)]"
                      : "border-slate-200 text-foreground hover:bg-slate-50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </FormField>
        </div>
      </SectionCard>

      <SaveBar
        saved={saved}
        onSave={handleSave}
        label={updateBusiness.isPending ? "Saving…" : "Save Changes"}
      />
    </div>
  );
}
