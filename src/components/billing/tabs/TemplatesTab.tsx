// ── Invoice Templates Tab ─────────────────────────────────────────
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Eye,
  Star,
  Plus,
  Pencil,
  Copy,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Palette,
  Upload,
  X,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useBusiness } from "@/contexts/BusinessContext";
import {
  SectionCard,
  PrimaryButton,
  SecondaryButton,
  ModalShell,
  SearchInput,
  Select,
  Pagination,
  EmptyState,
  BillingStatusPill,
} from "@/components/billing/shared";
import {
  useTemplates,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
  useDuplicateTemplate,
  useSetDefaultTemplate,
  useUpdateTemplateStatus,
  useUploadTemplateLogo,
} from "@/hooks/useTemplates";
import {
  TEMPLATE_TYPE_LABELS,
  FONT_FAMILY_LABELS,
  TEMPLATE_TYPES,
  type DbTemplate,
  type TemplateInput,
  type TemplateType,
  type FontFamily,
} from "@/services/templates";

// ── Constants ──────────────────────────────────────────────────────

const PAGE_SIZE = 8;

const FONT_OPTIONS: { value: FontFamily; label: string }[] = Object.entries(FONT_FAMILY_LABELS).map(
  ([v, l]) => ({ value: v as FontFamily, label: l })
);

const TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  ...TEMPLATE_TYPES.map((t) => ({ value: t, label: TEMPLATE_TYPE_LABELS[t] })),
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const DEFAULT_OPTIONS = [
  { value: "all", label: "All Templates" },
  { value: "yes", label: "Default Only" },
  { value: "no", label: "Non-Default" },
];

// ── Default form state ─────────────────────────────────────────────

function blankForm(): TemplateInput {
  return {
    templateName: "",
    templateType: "gst_invoice",
    headerText: "",
    footerText: "",
    termsConditions: "",
    logoUrl: "",
    primaryColor: "#2563eb",
    secondaryColor: "#f8fafc",
    fontFamily: "inter",
    showLogo: true,
    showSignature: false,
    showQrCode: false,
    showPaymentDetails: true,
    showBankDetails: false,
    isDefault: false,
    status: "active",
  };
}

function dbToInput(t: DbTemplate): TemplateInput {
  return {
    templateName: t.template_name,
    templateType: t.template_type,
    headerText: t.header_text ?? "",
    footerText: t.footer_text ?? "",
    termsConditions: t.terms_conditions ?? "",
    logoUrl: t.logo_url ?? "",
    primaryColor: t.primary_color,
    secondaryColor: t.secondary_color,
    fontFamily: t.font_family,
    showLogo: t.show_logo,
    showSignature: t.show_signature,
    showQrCode: t.show_qr_code,
    showPaymentDetails: t.show_payment_details,
    showBankDetails: t.show_bank_details,
    isDefault: t.is_default,
    status: t.status,
  };
}

// ── Mini Template Preview (card thumbnail) ─────────────────────────

function TemplatePreview({ accentColor, scale = 1 }: { accentColor: string; scale?: number }) {
  const w = 160 * scale;
  const h = 210 * scale;
  const r = 6 * scale;
  const headerH = 36 * scale;
  const pad = 12 * scale;
  const lineH = 5 * scale;
  const lineGap = 8 * scale;
  const tableH = 4 * scale;
  const tableGap = 6 * scale;

  return (
    <div
      className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm"
      style={{ width: w, height: h, borderRadius: r }}
    >
      <div
        style={{
          backgroundColor: accentColor,
          height: headerH,
          display: "flex",
          alignItems: "center",
          padding: `0 ${pad}px`,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 3 * scale }}>
          <div style={{ width: 50 * scale, height: 5 * scale, backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 2 }} />
          <div style={{ width: 32 * scale, height: 3.5 * scale, backgroundColor: "rgba(255,255,255,0.5)", borderRadius: 2 }} />
        </div>
        <div style={{ marginLeft: "auto" }}>
          <div style={{ width: 28 * scale, height: 14 * scale, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 3 * scale }} />
        </div>
      </div>
      <div style={{ padding: pad }}>
        <div style={{ marginBottom: lineGap }}>
          <div style={{ width: 24 * scale, height: 3 * scale, backgroundColor: accentColor, opacity: 0.5, borderRadius: 2, marginBottom: 3 * scale }} />
          <div style={{ width: 70 * scale, height: lineH, backgroundColor: "#e2e8f0", borderRadius: 2, marginBottom: 3 * scale }} />
          <div style={{ width: 54 * scale, height: lineH - 1, backgroundColor: "#f1f5f9", borderRadius: 2 }} />
        </div>
        <div style={{ height: 1, backgroundColor: "#e2e8f0", marginBottom: lineGap }} />
        <div style={{ display: "flex", gap: 4 * scale, marginBottom: 5 * scale }}>
          {[50, 24, 24].map((w2, i) => (
            <div key={i} style={{ width: w2 * scale, height: tableH, backgroundColor: accentColor, opacity: 0.15, borderRadius: 2 }} />
          ))}
        </div>
        {[0, 1, 2].map((row) => (
          <div key={row} style={{ display: "flex", gap: 4 * scale, marginBottom: tableGap }}>
            {[50, 24, 24].map((w2, i) => (
              <div key={i} style={{ width: (w2 - row * 4) * scale, height: tableH - 1, backgroundColor: "#f1f5f9", borderRadius: 2 }} />
            ))}
          </div>
        ))}
        <div style={{ height: 1, backgroundColor: "#e2e8f0", margin: `${lineGap}px 0` }} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 * scale }}>
          <div style={{ width: 32 * scale, height: lineH, backgroundColor: "#e2e8f0", borderRadius: 2 }} />
          <div style={{ width: 28 * scale, height: lineH, backgroundColor: accentColor, opacity: 0.6, borderRadius: 2 }} />
        </div>
      </div>
    </div>
  );
}

// ── Loading skeleton ───────────────────────────────────────────────

function TemplateSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 animate-pulse">
      <div className="mx-auto mb-4 h-[178px] w-[136px] rounded-lg bg-slate-100" />
      <div className="mb-1 h-4 w-3/4 rounded bg-slate-100" />
      <div className="mb-4 h-3 w-full rounded bg-slate-100" />
      <div className="mt-auto flex flex-col gap-2">
        <div className="h-9 rounded-xl bg-slate-100" />
        <div className="h-9 rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}

// ── Toggle switch ──────────────────────────────────────────────────

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span className="text-sm text-foreground">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-blue-600" : "bg-slate-200"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
}

// ── Create / Edit Modal ────────────────────────────────────────────

function TemplateFormModal({
  open,
  onClose,
  editTarget,
  businessId,
}: {
  open: boolean;
  onClose: () => void;
  editTarget: DbTemplate | null;
  businessId: string;
}) {
  const isEdit = editTarget !== null;
  const [form, setForm] = useState<TemplateInput>(blankForm());
  const [errors, setErrors] = useState<Partial<Record<keyof TemplateInput, string>>>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  const createMutation = useCreateTemplate(businessId);
  const updateMutation = useUpdateTemplate(businessId);
  const uploadMutation = useUploadTemplateLogo(businessId);

  const busy =
    createMutation.isPending || updateMutation.isPending || uploadMutation.isPending;

  // Populate form when opening
  useEffect(() => {
    if (!open) return;
    if (editTarget) {
      setForm(dbToInput(editTarget));
      setLogoPreview(editTarget.logo_url ?? "");
    } else {
      setForm(blankForm());
      setLogoPreview("");
    }
    setErrors({});
    setLogoFile(null);
  }, [open, editTarget]);

  function set<K extends keyof TemplateInput>(key: K, value: TemplateInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof TemplateInput, string>> = {};
    if (!form.templateName.trim()) errs.templateName = "Template name is required";
    if (!form.templateType) errs.templateType = "Template type is required";
    if (!form.primaryColor.match(/^#[0-9a-fA-F]{6}$/))
      errs.primaryColor = "Enter a valid hex colour (e.g. #2563eb)";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2 MB");
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    if (!validate()) return;

    try {
      let logoUrl = form.logoUrl;

      // Upload logo if a new file was chosen
      if (logoFile) {
        logoUrl = await uploadMutation.mutateAsync(logoFile);
      }

      const payload: TemplateInput = { ...form, logoUrl: logoUrl || "" };

      if (isEdit && editTarget) {
        await updateMutation.mutateAsync({ id: editTarget.id, input: payload });
        toast.success("Template updated");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Template created");
      }
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Template" : "New Template"}
      wide
    >
      <div className="space-y-6">
        {/* ── Basic Info ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-foreground">
              Template Name <span className="text-red-500">*</span>
            </label>
            <input
              value={form.templateName}
              onChange={(e) => set("templateName", e.target.value)}
              placeholder="e.g. Standard GST Invoice"
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
            />
            {errors.templateName && (
              <p className="mt-1 text-xs text-red-500">{errors.templateName}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">
              Template Type <span className="text-red-500">*</span>
            </label>
            <select
              value={form.templateType}
              onChange={(e) => set("templateType", e.target.value as TemplateType)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
            >
              {TEMPLATE_TYPES.map((t) => (
                <option key={t} value={t}>{TEMPLATE_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">Status</label>
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value as "active" | "inactive")}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* ── Branding ── */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Branding</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Primary Colour</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => set("primaryColor", e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded-xl border border-slate-200 bg-white p-1"
                />
                <input
                  value={form.primaryColor}
                  onChange={(e) => set("primaryColor", e.target.value)}
                  placeholder="#2563eb"
                  className="h-9 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
                />
              </div>
              {errors.primaryColor && (
                <p className="mt-1 text-xs text-red-500">{errors.primaryColor}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Secondary Colour</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.secondaryColor}
                  onChange={(e) => set("secondaryColor", e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded-xl border border-slate-200 bg-white p-1"
                />
                <input
                  value={form.secondaryColor}
                  onChange={(e) => set("secondaryColor", e.target.value)}
                  placeholder="#f8fafc"
                  className="h-9 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Font Family</label>
              <select
                value={form.fontFamily}
                onChange={(e) => set("fontFamily", e.target.value as FontFamily)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
              >
                {FONT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Logo ── */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Company Logo</p>
          <div className="flex items-center gap-4">
            {logoPreview ? (
              <div className="relative">
                <img src={logoPreview} alt="Logo" className="h-16 w-16 rounded-xl border border-slate-200 object-contain p-1" />
                <button
                  type="button"
                  onClick={() => { setLogoFile(null); setLogoPreview(""); set("logoUrl", ""); }}
                  className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50">
                <Upload className="h-5 w-5 text-slate-300" />
              </div>
            )}
            <div>
              <SecondaryButton icon={Upload} onClick={() => fileRef.current?.click()}>
                {logoPreview ? "Change Logo" : "Upload Logo"}
              </SecondaryButton>
              <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, SVG · max 2 MB</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
            />
          </div>
        </div>

        {/* ── Content ── */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Content</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Header Text</label>
              <textarea
                value={form.headerText}
                onChange={(e) => set("headerText", e.target.value)}
                rows={2}
                placeholder="Appears at the top of the document"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Footer Text</label>
              <textarea
                value={form.footerText}
                onChange={(e) => set("footerText", e.target.value)}
                rows={2}
                placeholder="Appears at the bottom of the document"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-foreground">Terms & Conditions</label>
              <textarea
                value={form.termsConditions}
                onChange={(e) => set("termsConditions", e.target.value)}
                rows={3}
                placeholder="Payment due within 30 days. Goods once sold will not be taken back..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
              />
            </div>
          </div>
        </div>

        {/* ── Display Options ── */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Display Options</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Toggle checked={form.showLogo} onChange={(v) => set("showLogo", v)} label="Show Company Logo" />
            <Toggle checked={form.showSignature} onChange={(v) => set("showSignature", v)} label="Show Signature Block" />
            <Toggle checked={form.showQrCode} onChange={(v) => set("showQrCode", v)} label="Show QR Code" />
            <Toggle checked={form.showPaymentDetails} onChange={(v) => set("showPaymentDetails", v)} label="Show Payment Instructions" />
            <Toggle checked={form.showBankDetails} onChange={(v) => set("showBankDetails", v)} label="Show Bank Details" />
            <Toggle checked={form.isDefault} onChange={(v) => set("isDefault", v)} label="Set as Default for this type" />
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton onClick={handleSubmit} disabled={busy}>
            {busy ? "Saving…" : isEdit ? "Save Changes" : "Create Template"}
          </PrimaryButton>
        </div>
      </div>
    </ModalShell>
  );
}

// ── Preview Modal ──────────────────────────────────────────────────

function PreviewModal({
  template,
  onClose,
  onSetDefault,
  settingDefault,
}: {
  template: DbTemplate | null;
  onClose: () => void;
  onSetDefault: (t: DbTemplate) => void;
  settingDefault: boolean;
}) {
  if (!template) return null;
  return (
    <ModalShell
      open={template !== null}
      onClose={onClose}
      title={`Preview — ${template.template_name}`}
      wide
    >
      <div className="flex flex-col items-center gap-6">
        <TemplatePreview accentColor={template.primary_color} scale={2.2} />

        <div className="w-full max-w-sm space-y-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 rounded-full" style={{ backgroundColor: template.primary_color }} />
            <p className="text-base font-semibold text-foreground">{template.template_name}</p>
            {template.is_default && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                <Star className="h-2.5 w-2.5" /> Default
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{TEMPLATE_TYPE_LABELS[template.template_type]}</p>
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span>Primary: <span className="font-semibold text-foreground">{template.primary_color}</span></span>
            <span>Font: <span className="font-semibold text-foreground capitalize">{template.font_family}</span></span>
          </div>
          {(template.header_text || template.footer_text) && (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-left text-xs text-muted-foreground space-y-1">
              {template.header_text && <p><span className="font-medium text-foreground">Header:</span> {template.header_text}</p>}
              {template.footer_text && <p><span className="font-medium text-foreground">Footer:</span> {template.footer_text}</p>}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {template.show_logo && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600">Logo</span>}
            {template.show_signature && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600">Signature</span>}
            {template.show_qr_code && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600">QR Code</span>}
            {template.show_payment_details && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600">Payment Info</span>}
            {template.show_bank_details && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600">Bank Details</span>}
          </div>
        </div>

        <div className="flex gap-3">
          {!template.is_default && (
            <PrimaryButton icon={CheckCircle2} onClick={() => onSetDefault(template)} disabled={settingDefault}>
              {settingDefault ? "Setting…" : "Set as Default"}
            </PrimaryButton>
          )}
          <SecondaryButton onClick={onClose}>Close</SecondaryButton>
        </div>
      </div>
    </ModalShell>
  );
}

// ── Delete Confirm Modal ───────────────────────────────────────────

function DeleteModal({
  template,
  onClose,
  onConfirm,
  deleting,
}: {
  template: DbTemplate | null;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
}) {
  return (
    <ModalShell open={template !== null} onClose={onClose} title="Delete Template">
      {template && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Delete &ldquo;{template.template_name}&rdquo;?
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                This action cannot be undone. Any documents using this template will keep their current appearance.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
            <button
              onClick={onConfirm}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-700 disabled:opacity-60"
            >
              {deleting ? "Deleting…" : "Delete Template"}
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

// ── Main Component ─────────────────────────────────────────────────

export function TemplatesTab() {
  const { business } = useBusiness();
  const businessId = business?.id ?? null;

  // ── Data ────────────────────────────────────────────────────────
  const { data: allTemplates = [], isLoading, isError } = useTemplates(businessId);

  const createMutation    = useCreateTemplate(businessId);
  const deleteMutation    = useDeleteTemplate(businessId);
  const duplicateMutation = useDuplicateTemplate(businessId);
  const defaultMutation   = useSetDefaultTemplate(businessId);
  const statusMutation    = useUpdateTemplateStatus(businessId);

  // ── UI state ────────────────────────────────────────────────────
  const [search, setSearch]             = useState("");
  const [typeFilter, setTypeFilter]     = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [defaultFilter, setDefaultFilter] = useState("all");
  const [page, setPage]                 = useState(1);

  const [formOpen, setFormOpen]       = useState(false);
  const [editTarget, setEditTarget]   = useState<DbTemplate | null>(null);
  const [previewTpl, setPreviewTpl]   = useState<DbTemplate | null>(null);
  const [deleteTpl, setDeleteTpl]     = useState<DbTemplate | null>(null);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, typeFilter, statusFilter, defaultFilter]);

  // ── Filtered data ───────────────────────────────────────────────
  const filtered = allTemplates.filter((t) => {
    if (search) {
      const q = search.toLowerCase();
      if (!t.template_name.toLowerCase().includes(q) && !TEMPLATE_TYPE_LABELS[t.template_type].toLowerCase().includes(q))
        return false;
    }
    if (typeFilter !== "all" && t.template_type !== typeFilter) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (defaultFilter === "yes" && !t.is_default) return false;
    if (defaultFilter === "no" && t.is_default) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Stats ───────────────────────────────────────────────────────
  const totalCount    = allTemplates.length;
  const activeCount   = allTemplates.filter((t) => t.status === "active").length;
  const defaultCount  = allTemplates.filter((t) => t.is_default).length;
  const inactiveCount = allTemplates.filter((t) => t.status === "inactive").length;

  // ── Handlers ────────────────────────────────────────────────────
  function handleOpenCreate() {
    setEditTarget(null);
    setFormOpen(true);
  }

  function handleOpenEdit(t: DbTemplate) {
    setEditTarget(t);
    setFormOpen(true);
  }

  async function handleDuplicate(t: DbTemplate) {
    try {
      await duplicateMutation.mutateAsync(t.id);
      toast.success(`"${t.template_name}" duplicated`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Duplicate failed");
    }
  }

  async function handleDelete() {
    if (!deleteTpl) return;
    try {
      await deleteMutation.mutateAsync(deleteTpl.id);
      toast.success("Template deleted");
      setDeleteTpl(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function handleSetDefault(t: DbTemplate) {
    try {
      await defaultMutation.mutateAsync({ id: t.id, templateType: t.template_type });
      toast.success(`"${t.template_name}" set as default for ${TEMPLATE_TYPE_LABELS[t.template_type]}`);
      setPreviewTpl(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to set default");
    }
  }

  async function handleToggleStatus(t: DbTemplate) {
    const next = t.status === "active" ? "inactive" : "active";
    try {
      await statusMutation.mutateAsync({ id: t.id, status: next });
      toast.success(`Template ${next === "active" ? "activated" : "deactivated"}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Status update failed");
    }
  }

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Stats row */}
      {!isLoading && allTemplates.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total Templates", value: totalCount,    color: "text-blue-600",    bg: "bg-blue-50" },
            { label: "Active",          value: activeCount,   color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Defaults Set",    value: defaultCount,  color: "text-violet-600",  bg: "bg-violet-50" },
            { label: "Inactive",        value: inactiveCount, color: "text-slate-500",   bg: "bg-slate-100" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Main card */}
      <SectionCard
        title="Invoice Templates"
        subtitle="Manage visual layouts for invoices, quotations, credit notes and more"
        action={
          <PrimaryButton icon={Plus} onClick={handleOpenCreate}>
            New Template
          </PrimaryButton>
        }
      >
        {/* Filters row */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name or type…"
            className="w-64"
          />
          <Select value={typeFilter} onChange={setTypeFilter} options={TYPE_OPTIONS} className="w-44" />
          <Select value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} className="w-36" />
          <Select value={defaultFilter} onChange={setDefaultFilter} options={DEFAULT_OPTIONS} className="w-40" />
          {(search || typeFilter !== "all" || statusFilter !== "all" || defaultFilter !== "all") && (
            <button
              onClick={() => { setSearch(""); setTypeFilter("all"); setStatusFilter("all"); setDefaultFilter("all"); }}
              className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-500 hover:bg-slate-50"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <TemplateSkeleton key={i} />)}
          </div>
        ) : isError ? (
          <EmptyState
            icon={AlertTriangle}
            title="Failed to load templates"
            subtitle="Check your connection and try again"
          />
        ) : paged.length === 0 ? (
          <EmptyState
            icon={Palette}
            title={allTemplates.length === 0 ? "No templates yet" : "No templates match your filters"}
            subtitle={
              allTemplates.length === 0
                ? "Create your first template to customise the look of your invoices and documents"
                : "Try adjusting your search or filters"
            }
          />
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {paged.map((tpl, i) => (
                <motion.div
                  key={tpl.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, delay: i * 0.04, ease: "easeOut" }}
                  className={`relative flex flex-col rounded-2xl border p-4 transition-all duration-200 hover:shadow-md ${
                    tpl.is_default
                      ? "border-blue-300 bg-blue-50/40 shadow-sm"
                      : tpl.status === "inactive"
                      ? "border-slate-200 bg-slate-50 opacity-70"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  {/* Badges */}
                  <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                    {tpl.is_default && (
                      <div className="flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                        <Star className="h-2.5 w-2.5" /> Default
                      </div>
                    )}
                    <BillingStatusPill status={tpl.status} />
                  </div>

                  {/* Preview thumbnail */}
                  <div className="flex justify-center mb-4">
                    <TemplatePreview accentColor={tpl.primary_color} scale={0.85} />
                  </div>

                  {/* Info */}
                  <div className="mb-1 flex items-center gap-2 pr-16">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: tpl.primary_color }} />
                    <p className="text-sm font-semibold text-foreground truncate">{tpl.template_name}</p>
                  </div>
                  <p className="mb-1 text-xs font-medium text-blue-600">
                    {TEMPLATE_TYPE_LABELS[tpl.template_type]}
                  </p>
                  <p className="mb-4 text-xs text-muted-foreground capitalize">
                    {tpl.font_family} · updated {new Date(tpl.updated_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>

                  {/* Actions */}
                  <div className="mt-auto space-y-2">
                    {/* Row 1: Preview + Edit */}
                    <div className="flex gap-2">
                      <SecondaryButton icon={Eye} onClick={() => setPreviewTpl(tpl)} className="flex-1 justify-center">
                        Preview
                      </SecondaryButton>
                      <SecondaryButton icon={Pencil} onClick={() => handleOpenEdit(tpl)} className="flex-1 justify-center">
                        Edit
                      </SecondaryButton>
                    </div>

                    {/* Row 2: Duplicate + Delete */}
                    <div className="flex gap-2">
                      <SecondaryButton
                        icon={Copy}
                        onClick={() => handleDuplicate(tpl)}
                        className="flex-1 justify-center"
                      >
                        {duplicateMutation.isPending ? "…" : "Duplicate"}
                      </SecondaryButton>
                      <button
                        onClick={() => setDeleteTpl(tpl)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>

                    {/* Row 3: Set Default or Active badge + Activate/Deactivate */}
                    <div className="flex gap-2">
                      {!tpl.is_default ? (
                        <PrimaryButton
                          icon={CheckCircle2}
                          onClick={() => handleSetDefault(tpl)}
                          disabled={defaultMutation.isPending}
                          className="flex-1 justify-center"
                        >
                          Set Default
                        </PrimaryButton>
                      ) : (
                        <div className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Active Default
                        </div>
                      )}
                      <button
                        onClick={() => handleToggleStatus(tpl)}
                        disabled={statusMutation.isPending}
                        title={tpl.status === "active" ? "Deactivate" : "Activate"}
                        className={`flex items-center justify-center rounded-xl border px-3 py-2 transition-colors disabled:opacity-50 ${
                          tpl.status === "active"
                            ? "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                            : "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        }`}
                      >
                        {tpl.status === "active"
                          ? <ToggleRight className="h-4 w-4" />
                          : <ToggleLeft className="h-4 w-4" />
                        }
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        )}
      </SectionCard>

      {/* Modals */}
      <TemplateFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editTarget={editTarget}
        businessId={businessId ?? ""}
      />

      <PreviewModal
        template={previewTpl}
        onClose={() => setPreviewTpl(null)}
        onSetDefault={handleSetDefault}
        settingDefault={defaultMutation.isPending}
      />

      <DeleteModal
        template={deleteTpl}
        onClose={() => setDeleteTpl(null)}
        onConfirm={handleDelete}
        deleting={deleteMutation.isPending}
      />
    </div>
  );
}
