// ── Customer Profile — Supabase-backed ───────────────────────────
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Star,
  Building2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileText,
  MessageSquare,
  Activity,
  AlertCircle,
  Plus,
  ShieldCheck,
  Loader2,
  Trash2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fmtINR, fmtDate } from "@/lib/crm-data";
import {
  SectionCard,
  CrmStatusPill,
  EmptyState,
  Avatar,
  SecondaryButton,
} from "@/components/crm/shared";
import { useCustomerById, useCustomerNotes, useAddCustomerNote } from "@/hooks/useCustomersQuery";
import { useBusiness } from "@/contexts/BusinessContext";
import { useInvoices } from "@/hooks/useInvoicesQuery";
import { usePayments } from "@/hooks/usePaymentsQuery";
import { useCrmActivities } from "@/hooks/useCrmQuery";
import { invoiceBalance, invoiceGrandTotal } from "@/lib/billing-data";

// ── Field display helper ──────────────────────────────────────────

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm text-foreground">{value ?? "—"}</p>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────

function ProfileSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
        <SecondaryButton icon={ArrowLeft} onClick={onBack}>
          Back to Customers
        </SecondaryButton>
        <div className="flex items-center gap-2.5 ml-2">
          <div className="h-10 w-10 rounded-full bg-slate-100 animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-32 rounded bg-slate-100 animate-pulse" />
            <div className="h-3 w-24 rounded bg-slate-100 animate-pulse" />
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
        <div className="flex flex-wrap items-start gap-6">
          <div className="h-14 w-14 rounded-full bg-slate-100 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-48 rounded bg-slate-100 animate-pulse" />
            <div className="h-4 w-32 rounded bg-slate-100 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Profile tab types ─────────────────────────────────────────────

type ProfileTab = "overview" | "purchases" | "outstanding" | "notes" | "activity";

// ── CustomerProfile ───────────────────────────────────────────────

export function CustomerProfile({
  customerId,
  onBack,
}: {
  customerId: string;
  onBack: () => void;
}) {
  const { business } = useBusiness();
  const businessId = business?.id ?? null;

  const { data: customer, isLoading, error } = useCustomerById(customerId);
  const { data: dbNotes = [], isLoading: notesLoading } = useCustomerNotes(customerId);
  const { data: allInvoices = [], isLoading: invoicesLoading } = useInvoices(businessId);
  const { data: allPayments = [] } = usePayments(businessId);
  const { data: allActivities = [] } = useCrmActivities(businessId);
  const addNoteMutation = useAddCustomerNote(customerId);

  const [tab, setTab] = useState<ProfileTab>("overview");
  const [noteInput, setNoteInput] = useState("");

  // ── Loading ───────────────────────────────────────────────────

  if (isLoading) return <ProfileSkeleton onBack={onBack} />;

  // ── Error ─────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Customers
        </button>
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          Failed to load customer: {(error as Error).message}
        </div>
      </div>
    );
  }

  // ── Not found ─────────────────────────────────────────────────

  if (!customer) {
    return (
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Customers
        </button>
        <EmptyState
          icon={AlertCircle}
          title="Customer not found"
          subtitle="This customer profile could not be found."
        />
      </div>
    );
  }

  // ── Derived values ────────────────────────────────────────────

  const displayNotes = dbNotes.map((n) => ({
    id: n.id,
    text: n.text,
    author: n.author,
    date: n.created_at.slice(0, 10),
  }));

  const customerInvoices = allInvoices.filter(
    (invoice) =>
      invoice.customerId === customerId &&
      invoice.status !== "cancelled" &&
      invoice.status !== "draft",
  );
  const customerPayments = allPayments.filter((payment) => payment.customerId === customerId);
  const customerActivities = allActivities.filter((event) => event.customer_id === customerId);
  const totalOutstanding =
    Number(customer.opening_balance) +
    customerInvoices.reduce((sum, invoice) => sum + Math.max(0, invoiceBalance(invoice)), 0);
  const customerRevenue = customerInvoices.reduce(
    (sum, invoice) => sum + invoiceGrandTotal(invoice),
    0,
  );
  const creditRemaining = Math.max(0, customer.credit_limit - totalOutstanding);

  async function addNote() {
    const text = noteInput.trim();
    if (!text) return;
    const authorName = business?.owner_name ?? "You";
    await addNoteMutation.mutateAsync({ text, author: authorName });
    setNoteInput("");
  }

  const tabs: { key: ProfileTab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "purchases", label: "Purchase History" },
    { key: "outstanding", label: "Outstanding" },
    { key: "notes", label: "Notes" },
    { key: "activity", label: "Activity" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="space-y-4"
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
        <SecondaryButton icon={ArrowLeft} onClick={onBack}>
          Back to Customers
        </SecondaryButton>
        <div className="flex items-center gap-2.5 ml-2">
          <Avatar name={customer.name} size="md" />
          <div>
            <p className="text-sm font-bold text-foreground">{customer.name}</p>
            <p className="text-xs text-muted-foreground">
              {customer.customer_code} · {customer.company_name || "—"}
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <CrmStatusPill status={customer.status} />
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
            {customer.customer_group}
          </span>
        </div>
      </div>

      {/* Hero card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
        <div className="flex flex-wrap items-start gap-6">
          <Avatar name={customer.name} size="lg" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-foreground">{customer.name}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{customer.company_name || "—"}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <CrmStatusPill status={customer.status} />
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                {customer.customer_group}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < customer.rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-slate-200 fill-slate-200"
                  }`}
                />
              ))}
              <span className="ml-1 text-xs text-muted-foreground">{customer.rating}/5</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-center">
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-xs text-muted-foreground">Total Revenue</p>
              <p className="mt-0.5 text-sm font-bold text-foreground">{fmtINR(customerRevenue)}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-xs text-muted-foreground">Outstanding</p>
              <p
                className={`mt-0.5 text-sm font-bold ${
                  totalOutstanding > 0 ? "text-red-600" : "text-emerald-600"
                }`}
              >
                {totalOutstanding > 0 ? fmtINR(totalOutstanding) : "Nil"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-xs text-muted-foreground">Credit Limit</p>
              <p className="mt-0.5 text-sm font-bold text-foreground">
                {fmtINR(customer.credit_limit)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-xs text-muted-foreground">Credit Days</p>
              <p className="mt-0.5 text-sm font-bold text-foreground">{customer.credit_days}d</p>
            </div>
          </div>
        </div>
      </div>

      {/* Inner tab nav */}
      <div className="flex gap-1 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
              tab === t.key
                ? "bg-[image:var(--gradient-brand)] text-white shadow-sm"
                : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionCard
            title="Business Information"
            action={<Building2 className="h-4 w-4 text-muted-foreground" />}
          >
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Company" value={customer.company_name} />
              <Field label="Contact Person" value={customer.contact_person} />
              <Field label="Customer Code" value={customer.customer_code} />
              <Field label="Group" value={customer.customer_group} />
              <Field label="Created Date" value={fmtDate(customer.created_at.slice(0, 10))} />
              <Field label="Last Updated" value={fmtDate(customer.updated_at.slice(0, 10))} />
            </div>
          </SectionCard>

          <SectionCard
            title="Contact Details"
            action={<Phone className="h-4 w-4 text-muted-foreground" />}
          >
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Phone" value={customer.phone} />
              <Field label="Email" value={customer.email} />
              <Field label="City" value={customer.city} />
              <Field label="State" value={customer.state} />
            </div>
          </SectionCard>

          <SectionCard
            title="GST Information"
            action={<ShieldCheck className="h-4 w-4 text-muted-foreground" />}
          >
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field label="GSTIN" value={customer.gst_number} />
              <Field label="PAN" value={customer.pan_number} />
            </div>
          </SectionCard>

          <SectionCard
            title="Credit Terms"
            action={<CreditCard className="h-4 w-4 text-muted-foreground" />}
          >
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Credit Limit" value={fmtINR(customer.credit_limit)} />
              <Field label="Credit Days" value={`${customer.credit_days} days`} />
              <Field label="Opening Balance" value={fmtINR(customer.opening_balance)} />
              <Field label="Credit Available" value={fmtINR(creditRemaining)} />
            </div>
          </SectionCard>

          <SectionCard
            title="Billing Address"
            action={<MapPin className="h-4 w-4 text-muted-foreground" />}
          >
            <p className="text-sm text-foreground leading-relaxed">{customer.address || "—"}</p>
          </SectionCard>

          <SectionCard
            title="Shipping Address"
            action={<MapPin className="h-4 w-4 text-muted-foreground" />}
          >
            <p className="text-sm text-foreground leading-relaxed">
              {customer.shipping_address || "—"}
            </p>
          </SectionCard>
        </div>
      )}

      {/* ── Purchase History ── */}
      {tab === "purchases" && (
        <SectionCard
          title="Purchase History"
          subtitle="Invoices associated with this shared Billing customer record"
          action={<FileText className="h-4 w-4 text-muted-foreground" />}
        >
          {invoicesLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading invoices…</p>
          ) : customerInvoices.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No purchases yet"
              subtitle="Invoices for this customer will appear here."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{fmtDate(invoice.createdDate)}</TableCell>
                      <TableCell>
                        <CrmStatusPill status={invoice.paymentStatus} />
                      </TableCell>
                      <TableCell className="text-right">
                        {fmtINR(invoiceGrandTotal(invoice))}
                      </TableCell>
                      <TableCell className="text-right">
                        {fmtINR(Math.max(0, invoiceBalance(invoice)))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </SectionCard>
      )}

      {/* ── Outstanding ── */}
      {tab === "outstanding" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
              <p className="text-xs text-red-600 font-semibold">Total Outstanding</p>
              <p className="mt-1 text-2xl font-bold text-red-700">{fmtINR(totalOutstanding)}</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
              <p className="text-xs text-amber-600 font-semibold">Credit Limit</p>
              <p className="mt-1 text-2xl font-bold text-amber-700">
                {fmtINR(customer.credit_limit)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <p className="text-xs text-slate-600 font-semibold">Credit Remaining</p>
              <p className="mt-1 text-2xl font-bold text-slate-700">{fmtINR(creditRemaining)}</p>
            </div>
          </div>
          <SectionCard
            title="Pending / Overdue Invoices"
            subtitle="Calculated from Billing invoice totals and payments"
          >
            {customerInvoices.filter((invoice) => invoiceBalance(invoice) > 0).length === 0 ? (
              <EmptyState
                icon={AlertCircle}
                title="No outstanding payments"
                subtitle="No invoice balances are currently due."
              />
            ) : (
              <div className="space-y-3">
                {customerInvoices
                  .filter((invoice) => invoiceBalance(invoice) > 0)
                  .map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          Due {fmtDate(invoice.dueDate || invoice.createdDate)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-amber-700">
                        {fmtINR(invoiceBalance(invoice))}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {/* ── Notes ── */}
      {tab === "notes" && (
        <SectionCard
          title="Customer Notes"
          subtitle="Internal notes and comments"
          action={<MessageSquare className="h-4 w-4 text-muted-foreground" />}
        >
          {/* Add note */}
          <div className="flex gap-2 mb-5">
            <input
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !addNoteMutation.isPending && addNote()}
              placeholder="Add a note and press Enter..."
              disabled={addNoteMutation.isPending}
              className="h-9 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition-colors focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)] placeholder:text-slate-400 disabled:opacity-50"
            />
            <button
              onClick={addNote}
              disabled={addNoteMutation.isPending || !noteInput.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[image:var(--gradient-brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {addNoteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add
            </button>
          </div>

          {notesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="h-4 w-3/4 rounded bg-slate-200 animate-pulse" />
                  <div className="mt-2 h-3 w-24 rounded bg-slate-200 animate-pulse" />
                </div>
              ))}
            </div>
          ) : displayNotes.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No notes yet"
              subtitle="Add your first note above."
            />
          ) : (
            <div className="space-y-3">
              {displayNotes.map((note, i) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.03 * i, duration: 0.2 }}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                >
                  <p className="text-sm text-foreground">{note.text}</p>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    {note.author} · {fmtDate(note.date)}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
          {addNoteMutation.error && (
            <p role="alert" className="mt-3 text-sm text-red-700">
              {(addNoteMutation.error as Error).message}
            </p>
          )}
        </SectionCard>
      )}

      {/* ── Activity ── */}
      {tab === "activity" && (
        <SectionCard
          title="Activity Timeline"
          subtitle="CRM notes and Billing history for this customer"
          action={<Activity className="h-4 w-4 text-muted-foreground" />}
        >
          {customerActivities.length === 0 &&
          customerPayments.length === 0 &&
          customerInvoices.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No activity recorded"
              subtitle="Invoices, payments, and CRM updates will appear here."
            />
          ) : (
            <div className="space-y-3">
              {[
                ...customerActivities.map((event) => ({
                  id: event.id,
                  title: event.title,
                  detail: event.details,
                  date: event.occurred_at,
                })),
                ...customerInvoices.map((invoice) => ({
                  id: "inv-" + invoice.id,
                  title: "Invoice " + invoice.invoiceNumber,
                  detail: "Billing · " + invoice.paymentStatus,
                  date: invoice.createdDate,
                })),
                ...customerPayments.map((payment) => ({
                  id: "pay-" + payment.id,
                  title: "Payment " + payment.paymentNumber,
                  detail: payment.currency + " " + payment.amount.toLocaleString(),
                  date: payment.date,
                })),
              ]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((event) => (
                  <div key={event.id} className="rounded-lg border border-slate-100 p-3">
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.detail} · {fmtDate(event.date.slice(0, 10))}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </SectionCard>
      )}
    </motion.div>
  );
}
