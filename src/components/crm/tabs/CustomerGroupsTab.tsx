// ── Customer Groups Tab ───────────────────────────────────────────
import { useState } from "react";
import { motion } from "framer-motion";
import { Users, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  customerGroupDefs,
  fmtINR,
  fmtDate,
  type CustomerGroupName,
  type CrmCustomer,
} from "@/lib/crm-data";
import { SectionCard, EmptyState, CrmStatusPill, Avatar } from "@/components/crm/shared";
import { useBusiness } from "@/contexts/BusinessContext";
import { useCustomers } from "@/hooks/useCustomersQuery";
import { useInvoices } from "@/hooks/useInvoicesQuery";
import { invoiceBalance, invoiceGrandTotal } from "@/lib/billing-data";

// ── CustomerGroupsTab ─────────────────────────────────────────────
export function CustomerGroupsTab() {
  const [expandedGroup, setExpandedGroup] = useState<CustomerGroupName | null>(null);
  const { business } = useBusiness();
  const { data: customers = [], isLoading, error } = useCustomers(business?.id ?? null);
  const { data: invoices = [] } = useInvoices(business?.id ?? null);
  const realCustomers: CrmCustomer[] = customers.map((c) => {
    const docs = invoices.filter(
      (inv) => inv.customerId === c.id && inv.status !== "cancelled" && inv.status !== "draft",
    );
    return {
      id: c.id,
      customerCode: c.customer_code,
      name: c.name,
      company: c.company_name ?? "",
      contactPerson: c.contact_person ?? "",
      gstin: c.gst_number ?? "",
      pan: c.pan_number ?? "",
      phone: c.phone,
      email: c.email ?? "",
      city: c.city ?? "",
      state: c.state ?? "",
      billingAddress: c.address ?? "",
      shippingAddress: c.shipping_address ?? "",
      group: (c.customer_group || "Retail") as CustomerGroupName,
      status: c.status as CrmCustomer["status"],
      outstandingAmount:
        Number(c.opening_balance) +
        docs.reduce((sum, inv) => sum + Math.max(0, invoiceBalance(inv)), 0),
      creditLimit: Number(c.credit_limit),
      creditDays: c.credit_days,
      totalRevenue: docs.reduce((sum, inv) => sum + invoiceGrandTotal(inv), 0),
      lastPurchase: docs.reduce((d, inv) => (inv.createdDate > d ? inv.createdDate : d), ""),
      createdDate: c.created_at.slice(0, 10),
      rating: c.rating,
      notes: [],
      purchaseHistory: [],
    };
  });

  const groupMembers: CrmCustomer[] = expandedGroup
    ? realCustomers.filter((c) => c.group === expandedGroup)
    : [];
  const membersFor = (name: string) => realCustomers.filter((c) => c.group === name);
  const statsFor = (name: string) => {
    const rows = membersFor(name);
    return {
      customerCount: rows.length,
      revenue: rows.reduce((sum, row) => sum + row.totalRevenue, 0),
      outstanding: rows.reduce((sum, row) => sum + row.outstandingAmount, 0),
    };
  };

  return (
    <div className="space-y-6">
      {isLoading && <p className="text-sm text-muted-foreground">Loading customer groups…</p>}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          Could not load customers: {(error as Error).message}
        </p>
      )}
      {/* Group Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {customerGroupDefs.map((grp, i) => {
          const stats = statsFor(grp.name);
          const isExpanded = expandedGroup === grp.name;
          return (
            <motion.div
              key={grp.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.3, ease: "easeOut" }}
              className={`rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${
                isExpanded
                  ? "border-[color:var(--brand-electric)] ring-1 ring-[color:var(--brand-electric)]"
                  : "border-slate-200"
              }`}
              onClick={() => setExpandedGroup(isExpanded ? null : grp.name)}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${grp.color}`}
                    >
                      {grp.name}
                    </span>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                      {grp.description}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                    <Users className="h-5 w-5 text-slate-500" />
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{stats.customerCount}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Customers</p>
                  </div>
                  <div className="text-center border-x border-slate-100">
                    <p className="text-lg font-bold text-foreground">{fmtINR(stats.revenue)}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Revenue</p>
                  </div>
                  <div className="text-center">
                    <p
                      className={`text-lg font-bold ${stats.outstanding > 0 ? "text-red-600" : "text-emerald-600"}`}
                    >
                      {stats.outstanding > 0 ? fmtINR(stats.outstanding) : "Nil"}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium">Outstanding</p>
                  </div>
                </div>

                {/* Toggle hint */}
                <p className="mt-3 text-center text-[10px] font-medium text-[color:var(--brand-electric)] transition-opacity">
                  {isExpanded ? "Click to collapse" : "Click to view members"}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Members list — shown when a group is expanded */}
      {expandedGroup && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <SectionCard
            title={`${expandedGroup} — Members`}
            subtitle={`${groupMembers.length} customer${groupMembers.length !== 1 ? "s" : ""} in this group`}
            action={
              <button
                onClick={() => setExpandedGroup(null)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            }
            noPadding
          >
            {groupMembers.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No customers in this group"
                subtitle="Assign customers to this group to see them here."
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/60">
                        <TableHead className="pl-6">Customer</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>Total Revenue</TableHead>
                        <TableHead>Outstanding</TableHead>
                        <TableHead>Last Purchase</TableHead>
                        <TableHead className="pr-6">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupMembers.map((c, i) => (
                        <motion.tr
                          key={c.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.02 * i, duration: 0.2 }}
                          className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors"
                        >
                          <TableCell className="pl-6">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={c.name} size="sm" />
                              <div>
                                <p className="text-xs font-semibold text-foreground">{c.name}</p>
                                <p className="text-[11px] text-muted-foreground">
                                  {c.customerCode}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-xs text-foreground max-w-[120px] truncate">
                              {c.company || "—"}
                            </p>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{c.city}</TableCell>
                          <TableCell className="text-xs font-semibold text-foreground">
                            {fmtINR(c.totalRevenue)}
                          </TableCell>
                          <TableCell>
                            {c.outstandingAmount > 0 ? (
                              <span className="text-xs font-semibold text-red-600">
                                {fmtINR(c.outstandingAmount)}
                              </span>
                            ) : (
                              <span className="text-xs text-emerald-600 font-medium">Nil</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {fmtDate(c.lastPurchase)}
                          </TableCell>
                          <TableCell className="pr-6">
                            <CrmStatusPill status={c.status} />
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="border-t border-slate-100 px-6 py-3">
                  <p className="text-xs text-muted-foreground">
                    {groupMembers.length} member{groupMembers.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </>
            )}
          </SectionCard>
        </motion.div>
      )}
    </div>
  );
}
