// CRM display types and small format helpers. CRM records are loaded from Supabase.

export type CustomerStatus = "active" | "inactive" | "new" | "at-risk" | "archived";
export type CustomerGroupName =
  "Retail" | "Wholesale" | "Corporate" | "VIP" | "Distributor" | "Dealer";
export type LeadStatus =
  "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
export type LeadSource =
  | "website"
  | "referral"
  | "cold-call"
  | "trade-show"
  | "social-media"
  | "advertisement"
  | "walk-in";
export type LeadPriority = "low" | "medium" | "high";
export type FollowUpStatus = "pending" | "completed" | "overdue";
export type FollowUpPriority = "low" | "medium" | "high";
export type CrmActivityType =
  | "customer-created"
  | "invoice-generated"
  | "payment-received"
  | "customer-updated"
  | "lead-created"
  | "lead-converted"
  | "note-added"
  | "follow-up-scheduled"
  | "follow-up-completed";

export interface CustomerNote {
  id: string;
  text: string;
  author: string;
  date: string;
}
export interface PurchaseRecord {
  id: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
}
export interface CrmCustomer {
  id: string;
  customerCode: string;
  name: string;
  company: string;
  contactPerson: string;
  gstin: string;
  pan: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  billingAddress: string;
  shippingAddress: string;
  group: CustomerGroupName;
  status: CustomerStatus;
  outstandingAmount: number;
  creditLimit: number;
  creditDays: number;
  totalRevenue: number;
  lastPurchase: string;
  createdDate: string;
  rating: number;
  notes: CustomerNote[];
  purchaseHistory: PurchaseRecord[];
}
export interface Lead {
  id: string;
  leadCode: string;
  name: string;
  company: string;
  contactPerson: string;
  phone: string;
  email: string;
  source: LeadSource;
  status: LeadStatus;
  expectedRevenue: number;
  assignedUser: string;
  priority: LeadPriority;
  createdDate: string;
  convertedCustomerId?: string;
}
export interface FollowUp {
  id: string;
  customerId?: string;
  leadId?: string;
  subjectName: string;
  purpose: string;
  date: string;
  time: string;
  priority: FollowUpPriority;
  status: FollowUpStatus;
  notes: string;
}
export interface CrmActivityEvent {
  id: string;
  type: CrmActivityType;
  title: string;
  subtitle: string;
  timestamp: string;
  customerId?: string;
  leadId?: string;
}
export interface CustomerGroupDef {
  id: string;
  name: CustomerGroupName;
  description: string;
  color: string;
}

export const customerGroupDefs: CustomerGroupDef[] = [
  {
    id: "grp-retail",
    name: "Retail",
    description: "Individual and small-shop buyers purchasing at list price.",
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    id: "grp-wholesale",
    name: "Wholesale",
    description: "Bulk buyers with negotiated volume pricing.",
    color: "bg-violet-50 text-violet-700 border-violet-200",
  },
  {
    id: "grp-corporate",
    name: "Corporate",
    description: "Registered businesses with GST billing and credit terms.",
    color: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
  {
    id: "grp-vip",
    name: "VIP",
    description: "High-value customers with priority support.",
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    id: "grp-distributor",
    name: "Distributor",
    description: "Regional distributors reselling across a territory.",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    id: "grp-dealer",
    name: "Dealer",
    description: "Authorized dealers with fixed margin agreements.",
    color: "bg-rose-50 text-rose-700 border-rose-200",
  },
];

export function fmtINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}
export function fmtDate(value: string) {
  if (!value) return "—";
  const date = new Date(value.length <= 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};
export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  website: "Website",
  referral: "Referral",
  "cold-call": "Cold Call",
  "trade-show": "Trade Show",
  "social-media": "Social Media",
  advertisement: "Advertisement",
  "walk-in": "Walk-in",
};
