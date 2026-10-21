// Shared Finance display types and formatting helpers. Financial records are loaded
// from Supabase by services/finance.ts; this module deliberately contains no samples.

export function fmtINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function fmtDate(value: string): string {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export type PaymentMethod = "Cash" | "UPI" | "Bank Transfer" | "Cheque" | "Card" | "Other";
export type TransactionType = "Income" | "Expense" | "Transfer";
export type TransactionStatus = "Completed" | "Pending" | "Failed" | "Reconciled";
export type ReceivableStatus = "Pending" | "Overdue" | "Partial" | "Paid";
export type PayableStatus = "Upcoming" | "Overdue" | "Partial" | "Paid";

export interface IncomeEntry {
  id: string;
  source: string;
  customer: string;
  reference: string;
  amount: number;
  date: string;
  category: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  gstRate: number;
}
export interface ExpenseEntry {
  id: string;
  vendor: string;
  reference: string;
  amount: number;
  date: string;
  category: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  hasReceipt: boolean;
  gstRate: number;
}
export interface CashbookEntry {
  id: string;
  date: string;
  description: string;
  type: "in" | "out";
  amount: number;
  balance: number;
  reference?: string;
}
export interface BankAccount {
  id: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  accountType: "Current" | "Savings" | "OD" | "Cash";
  balance: number;
  recentTransactions: {
    date: string;
    description: string;
    amount: number;
    type: "credit" | "debit";
  }[];
}
export interface Transaction {
  id: string;
  date: string;
  reference: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  category: string;
  paymentMethod: PaymentMethod;
  description: string;
  account: string;
  accountId?: string;
  transferDirection?: "incoming" | "outgoing";
}
export interface GSTEntry {
  month: string;
  cgst: number;
  sgst: number;
  igst: number;
  collectedGST: number;
  payableGST: number;
  itcClaimed: number;
}
export interface PLEntry {
  month: string;
  revenue: number;
  expenses: number;
  grossProfit: number;
  netProfit: number;
}
export interface Receivable {
  id: string;
  customer: string;
  invoiceNo: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: ReceivableStatus;
  contactPhone: string;
  email: string;
  daysPastDue?: number;
}
export interface Payable {
  id: string;
  supplier: string;
  billNo: string;
  billDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: PayableStatus;
  contactPhone: string;
  daysUntilDue?: number;
  daysPastDue?: number;
}

export const incomeCategories = [
  "Product Sales",
  "Service Revenue",
  "Consulting",
  "Commission",
  "Rental Income",
  "Interest Income",
  "Miscellaneous",
];
export const expenseCategories = [
  "Rent",
  "Electricity",
  "Salary",
  "Fuel",
  "Office Supplies",
  "Marketing",
  "Internet",
  "Software",
  "Travel",
  "Maintenance",
  "Professional Fees",
  "Insurance",
  "Other",
];
