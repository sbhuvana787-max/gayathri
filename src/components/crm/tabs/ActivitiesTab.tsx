// ── Activities Tab ────────────────────────────────────────────────
import { useState } from "react";
import { motion } from "framer-motion";
import {
  UserPlus,
  FileText,
  IndianRupee,
  UserCog,
  Target,
  UserCheck,
  StickyNote,
  CalendarClock,
  CalendarCheck,
  Activity,
  Search,
} from "lucide-react";
import { type CrmActivityType, type CrmActivityEvent } from "@/lib/crm-data";
import { SectionCard, SearchInput, Select, EmptyState } from "@/components/crm/shared";
import { useBusiness } from "@/contexts/BusinessContext";
import { useCrmActivities } from "@/hooks/useCrmQuery";
import { useCustomers } from "@/hooks/useCustomersQuery";
import { useInvoices } from "@/hooks/useInvoicesQuery";
import { usePayments } from "@/hooks/usePaymentsQuery";

const REFERENCE_DATE = new Date().toISOString().slice(0, 10);
const YESTERDAY = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

type ActivityIconDef = { icon: React.ElementType; bg: string; color: string };

function activityIcon(type: CrmActivityType): ActivityIconDef {
  switch (type) {
    case "customer-created":
      return { icon: UserPlus, bg: "bg-blue-50", color: "text-blue-600" };
    case "invoice-generated":
      return { icon: FileText, bg: "bg-indigo-50", color: "text-indigo-600" };
    case "payment-received":
      return { icon: IndianRupee, bg: "bg-emerald-50", color: "text-emerald-600" };
    case "customer-updated":
      return { icon: UserCog, bg: "bg-amber-50", color: "text-amber-600" };
    case "lead-created":
      return { icon: Target, bg: "bg-violet-50", color: "text-violet-600" };
    case "lead-converted":
      return { icon: UserCheck, bg: "bg-cyan-50", color: "text-cyan-600" };
    case "note-added":
      return { icon: StickyNote, bg: "bg-yellow-50", color: "text-yellow-600" };
    case "follow-up-scheduled":
      return { icon: CalendarClock, bg: "bg-orange-50", color: "text-orange-600" };
    case "follow-up-completed":
      return { icon: CalendarCheck, bg: "bg-teal-50", color: "text-teal-600" };
    default:
      return { icon: Activity, bg: "bg-slate-100", color: "text-slate-600" };
  }
}

const TYPE_LABELS: Record<CrmActivityType, string> = {
  "customer-created": "Customer Created",
  "invoice-generated": "Invoice Generated",
  "payment-received": "Payment Received",
  "customer-updated": "Customer Updated",
  "lead-created": "Lead Created",
  "lead-converted": "Lead Converted",
  "note-added": "Note Added",
  "follow-up-scheduled": "Follow-up Scheduled",
  "follow-up-completed": "Follow-up Completed",
};

function formatDateLabel(dateStr: string): string {
  dateStr = dateStr.slice(0, 10);
  if (dateStr === REFERENCE_DATE) return "Today";
  if (dateStr === YESTERDAY) return "Yesterday";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function groupByDate(
  events: CrmActivityEvent[],
): { date: string; label: string; events: CrmActivityEvent[] }[] {
  const map = new Map<string, CrmActivityEvent[]>();
  for (const ev of events) {
    const date = ev.timestamp.slice(0, 10);
    if (!map.has(date)) map.set(date, []);
    map.get(date)!.push(ev);
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, evs]) => ({ date, label: formatDateLabel(date), events: evs }));
}

const ALL_TYPES = Object.keys(TYPE_LABELS) as CrmActivityType[];

export function ActivitiesTab() {
  const { business } = useBusiness();
  const businessId = business?.id ?? null;
  const { data: activityRows = [], isLoading, error } = useCrmActivities(businessId);
  const { data: customers = [] } = useCustomers(businessId);
  const { data: invoices = [] } = useInvoices(businessId);
  const { data: payments = [] } = usePayments(businessId);
  const customerNames = new Map(customers.map((c) => [c.id, c.name]));
  const crmEvents: CrmActivityEvent[] = activityRows.map((row) => ({
    id: row.id,
    type: row.activity_type as CrmActivityType,
    title: row.title,
    subtitle: row.details || customerNames.get(row.customer_id ?? "") || "CRM record",
    timestamp: row.occurred_at,
    customerId: row.customer_id ?? undefined,
    leadId: row.lead_id ?? undefined,
  }));
  const billingEvents: CrmActivityEvent[] = [
    ...invoices
      .filter((inv) => inv.customerId)
      .map((inv) => ({
        id: "invoice-" + inv.id,
        type: "invoice-generated" as const,
        title: "Invoice " + inv.invoiceNumber,
        subtitle: customerNames.get(inv.customerId) ?? "Customer",
        timestamp: inv.createdDate + "T12:00:00.000Z",
        customerId: inv.customerId,
      })),
    ...payments
      .filter((payment) => payment.customerId && payment.status === "received")
      .map((payment) => ({
        id: "payment-" + payment.id,
        type: "payment-received" as const,
        title: "Payment " + payment.paymentNumber,
        subtitle:
          (customerNames.get(payment.customerId) ?? "Customer") +
          " · " +
          payment.currency +
          " " +
          payment.amount.toLocaleString(),
        timestamp: payment.date + "T12:00:00.000Z",
        customerId: payment.customerId,
      })),
  ];
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  let filtered = [...crmEvents, ...billingEvents];
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (e) => e.title.toLowerCase().includes(q) || e.subtitle.toLowerCase().includes(q),
    );
  }
  if (filterType !== "all") {
    filtered = filtered.filter((e) => e.type === filterType);
  }

  const grouped = groupByDate(filtered);

  const typeOptions = [
    { value: "all", label: "All Activity Types" },
    ...ALL_TYPES.map((t) => ({ value: t, label: TYPE_LABELS[t] })),
  ];

  return (
    <div className="space-y-6">
      {isLoading && <p className="text-sm text-muted-foreground">Loading activity…</p>}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          Could not load activity: {(error as Error).message}
        </p>
      )}
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search activities…" />
        <Select value={filterType} onChange={setFilterType} options={typeOptions} />
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} event{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Timeline */}
      {grouped.length === 0 && (
        <EmptyState
          icon={Search}
          title="No activity found"
          subtitle="Try adjusting your search or filter."
        />
      )}

      <div className="space-y-6">
        {grouped.map((group, gi) => (
          <SectionCard
            key={group.date}
            title={group.label}
            subtitle={`${group.events.length} event${group.events.length !== 1 ? "s" : ""}`}
          >
            <div className="relative space-y-0">
              {/* Vertical line */}
              <div className="absolute left-[18px] top-0 bottom-0 w-px bg-slate-100" />

              {group.events.map((ev, i) => {
                const { icon: Icon, bg, color } = activityIcon(ev.type);
                const timeStr = new Date(ev.timestamp).toLocaleTimeString("en-IN", {
                  day: "2-digit",
                  month: "short",
                });
                return (
                  <motion.div
                    key={ev.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: gi * 0.05 + i * 0.04, duration: 0.25 }}
                    className="relative flex items-start gap-4 pb-4 last:pb-0"
                  >
                    {/* Icon dot */}
                    <div
                      className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-white shadow-sm ${bg}`}
                    >
                      <Icon className={`h-4 w-4 ${color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground leading-snug">
                            {ev.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{ev.subtitle}</p>
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-1">
                          <span className="text-[10px] font-medium text-muted-foreground">
                            {timeStr}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${bg} ${color} border-current/20`}
                          >
                            {TYPE_LABELS[ev.type]}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </SectionCard>
        ))}
      </div>
    </div>
  );
}
