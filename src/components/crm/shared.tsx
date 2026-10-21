// ── Shared UI primitives for the CRM module ─────────────────────────
// Re-exports the generic UI atoms already established by the Inventory
// module (same design language: rounded-2xl white cards, slate borders,
// brand gradient accents) and adds CRM-specific pieces (lead/customer
// status pills, priority badges).

import type { ReactNode } from "react";
import { Flag } from "lucide-react";

export {
  SectionCard,
  StatTile,
  SearchInput,
  Select,
  Pagination,
  PrimaryButton,
  SecondaryButton,
  EmptyState,
  fmtDate,
} from "@/components/inventory/shared";

const statusStyles: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive: "bg-slate-100 text-slate-600 border-slate-200",
  archived: "bg-slate-100 text-slate-500 border-slate-200",
  new: "bg-blue-50 text-blue-700 border-blue-200",
  "at-risk": "bg-red-50 text-red-700 border-red-200",
  contacted: "bg-blue-50 text-blue-700 border-blue-200",
  qualified: "bg-cyan-50 text-cyan-700 border-cyan-200",
  proposal: "bg-violet-50 text-violet-700 border-violet-200",
  negotiation: "bg-amber-50 text-amber-700 border-amber-200",
  won: "bg-emerald-50 text-emerald-700 border-emerald-200",
  lost: "bg-slate-100 text-slate-500 border-slate-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  overdue: "bg-red-50 text-red-700 border-red-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export function CrmStatusPill({ status, label }: { status: string; label?: string }) {
  const cls = statusStyles[status] ?? "bg-slate-100 text-slate-600 border-slate-200";
  const text = label ?? status.replace(/-/g, " ");
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${cls}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {text}
    </span>
  );
}

const priorityStyles: Record<string, string> = {
  low: "text-slate-500",
  medium: "text-amber-600",
  high: "text-red-600",
};

export function PriorityBadge({ priority }: { priority: "low" | "medium" | "high" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold capitalize ${priorityStyles[priority]}`}
    >
      <Flag className="h-3 w-3" />
      {priority}
    </span>
  );
}

export function Checkbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="h-4 w-4 rounded border-slate-300 text-[color:var(--brand-electric)] focus:ring-[color:var(--brand-electric)]"
      onClick={(e) => e.stopPropagation()}
    />
  );
}

export function ModalShell({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative max-h-[90vh] w-full ${wide ? "max-w-4xl" : "max-w-lg"} overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const dims =
    size === "sm"
      ? "h-8 w-8 text-[11px]"
      : size === "lg"
        ? "h-14 w-14 text-lg"
        : "h-10 w-10 text-sm";
  return (
    <div
      className={`flex ${dims} shrink-0 items-center justify-center rounded-full bg-[image:var(--gradient-brand)] font-semibold text-white`}
    >
      {initials}
    </div>
  );
}
