import { useMemo } from "react";
import { useFinanceData } from "@/hooks/useFinanceData";
import { invoiceTotal, type FinanceAccount } from "@/services/finance";
import type {
  BankAccount,
  CashbookEntry,
  ExpenseEntry,
  GSTEntry,
  IncomeEntry,
  Payable,
  Receivable,
  Transaction,
} from "@/lib/finance-data";

const cents = (n: number) => Math.round((Number(n) || 0) * 100) / 100;
const methodLabel = (s: string): IncomeEntry["paymentMethod"] | "Other" =>
  (
    ({
      cash: "Cash",
      upi: "UPI",
      "bank-transfer": "Bank Transfer",
      neft: "Bank Transfer",
      rtgs: "Bank Transfer",
      cheque: "Cheque",
      card: "Card",
    }) as Record<string, IncomeEntry["paymentMethod"]>
  )[s] ?? "Other";
const toAccount = (account: FinanceAccount, txns: Transaction[]): BankAccount => {
  const accountRows = txns.filter(
    (t) =>
      t.accountId === account.id &&
      t.date >= account.opening_balance_date &&
      (t.status === "Completed" || t.status === "Reconciled"),
  );
  const rows = accountRows.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const balance = cents(
    account.opening_balance +
      accountRows
        .filter((t) => t.status !== "Failed")
        .reduce(
          (sum, t) =>
            sum +
            (t.type === "Income" || (t.type === "Transfer" && t.transferDirection === "incoming")
              ? t.amount
              : t.type === "Expense" || t.type === "Transfer"
                ? -t.amount
                : 0),
          0,
        ),
  );
  return {
    id: account.id,
    bankName: account.bank_name,
    accountHolder: account.account_holder,
    accountNumber: account.account_number_masked,
    ifsc: account.ifsc,
    accountType: account.account_type,
    balance,
    recentTransactions: rows.map((t) => ({
      date: t.date,
      description: t.description,
      amount: t.amount,
      type:
        t.type === "Income" || (t.type === "Transfer" && t.transferDirection === "incoming")
          ? "credit"
          : "debit",
    })),
  };
};

export function useFinanceModel() {
  const query = useFinanceData();
  const model = useMemo(() => {
    const snapshot = query.data;
    const rawTransactions = snapshot?.transactions ?? [];
    const payments = snapshot?.payments ?? [];
    const invoices = snapshot?.invoices ?? [];
    const bills = snapshot?.bills ?? [];
    const billPayments = snapshot?.billPayments ?? [];

    const income: IncomeEntry[] = [
      ...payments
        .filter((p) => p.status !== "refunded")
        .map((p) => ({
          id: p.id,
          source: p.invoice_id ? "Invoice payment" : "Other receipt",
          customer: p.customers?.name ?? "—",
          reference: p.transaction_ref || p.invoices?.invoice_number || p.payment_number,
          amount: cents(p.amount),
          date: p.payment_date,
          category: p.invoice_id ? "Sales collection" : "Other income",
          paymentMethod: methodLabel(p.mode),
          notes: p.notes ?? "",
          gstRate: 0,
        })),
      ...rawTransactions
        .filter(
          (t) =>
            t.transaction_type === "income" &&
            (t.status === "completed" || t.status === "reconciled"),
        )
        .map((t) => ({
          id: t.id,
          source: t.category,
          customer: t.counterparty,
          reference: t.reference || "",
          amount: cents(t.amount),
          date: t.transaction_date,
          category: t.category,
          paymentMethod: methodLabel(t.payment_method),
          notes: t.notes,
          gstRate: t.gst_rate,
        })),
    ].sort((a, b) => b.date.localeCompare(a.date));

    const expenses: ExpenseEntry[] = [
      ...payments
        .filter((p) => p.status === "refunded")
        .map((p) => ({
          id: p.id,
          vendor: p.customers?.name ?? "Customer refund",
          reference: p.transaction_ref || p.invoices?.invoice_number || p.payment_number,
          amount: cents(p.amount),
          date: p.payment_date,
          category: "Customer refund",
          paymentMethod: methodLabel(p.mode),
          notes: "Refund recorded against the original receipt",
          hasReceipt: false,
          gstRate: 0,
        })),
      ...rawTransactions
        .filter(
          (t) =>
            t.transaction_type === "expense" &&
            (t.status === "completed" || t.status === "reconciled"),
        )
        .map((t) => ({
          id: t.id,
          vendor: t.counterparty,
          reference: t.reference || "",
          amount: cents(t.amount),
          date: t.transaction_date,
          category: t.category,
          paymentMethod: methodLabel(t.payment_method),
          notes: t.notes,
          hasReceipt: t.has_receipt,
          gstRate: t.gst_rate,
        })),
      ...billPayments.map((p) => ({
        id: p.id,
        vendor: p.purchase_bills?.suppliers?.name ?? "Supplier",
        reference: p.purchase_bills?.bill_number ?? "",
        amount: cents(p.amount),
        date: p.payment_date,
        category: "Supplier bill payment",
        paymentMethod: methodLabel(p.payment_method),
        notes: "Payment recorded against supplier bill",
        hasReceipt: false,
        gstRate: 0,
      })),
    ].sort((a, b) => b.date.localeCompare(a.date));

    const transactionRows: Transaction[] = [
      ...payments.flatMap((p): Transaction[] => {
        const amount = cents(p.amount);
        const reference = p.transaction_ref || p.invoices?.invoice_number || p.payment_number;
        const customer = p.customers?.name ?? "customer";
        const invoice = p.invoices?.invoice_number ? ` · ${p.invoices.invoice_number}` : "";
        const account =
          snapshot?.accounts.find((a) => a.id === p.bank_account_id)?.bank_name ?? "Unassigned";
        const common = {
          date: p.payment_date,
          reference,
          amount,
          status: "Completed" as const,
          paymentMethod: methodLabel(p.mode),
          account,
          accountId: p.bank_account_id ?? undefined,
        };
        if (p.status === "refunded") {
          // Billing stores a refund by changing the original payment status. Keep
          // the receipt and its reversal as separate ledger legs so bank balance
          // remains unchanged while gross cash movements remain visible.
          return [
            {
              ...common,
              id: `${p.id}:receipt`,
              type: "Income" as const,
              category: "Sales collection",
              description: `Original receipt from ${customer}${invoice}`,
            },
            {
              ...common,
              id: `${p.id}:refund`,
              type: "Expense" as const,
              category: "Customer refund",
              description: `Refund to ${customer}${invoice}`,
            },
          ];
        }
        return [
          {
            ...common,
            id: p.id,
            type: "Income" as const,
            category: p.invoice_id ? "Sales collection" : "Other receipt",
            description: `Receipt from ${customer}${invoice}`,
          },
        ];
      }),
      ...rawTransactions
        .filter((t) => t.status !== "voided" && t.status !== "failed")
        .flatMap((t): Transaction[] => {
          const status: Transaction["status"] =
            t.status === "pending"
              ? "Pending"
              : t.status === "reconciled"
                ? "Reconciled"
                : "Completed";
          const amount = cents(t.amount);
          const description = t.description || t.counterparty || t.category;
          if (t.transaction_type === "transfer") {
            const from = snapshot?.accounts.find((a) => a.id === t.bank_account_id);
            const to = snapshot?.accounts.find((a) => a.id === t.transfer_to_account_id);
            return [
              {
                id: `${t.id}:out`,
                date: t.transaction_date,
                reference: t.reference || "",
                type: "Transfer" as const,
                amount,
                status,
                category: t.category,
                paymentMethod: "Bank Transfer" as const,
                description: `${description} · to ${to?.bank_name ?? "account"}`,
                account: from?.bank_name ?? "Unassigned",
                accountId: t.bank_account_id ?? undefined,
                transferDirection: "outgoing" as const,
              },
              {
                id: `${t.id}:in`,
                date: t.transaction_date,
                reference: t.reference || "",
                type: "Transfer" as const,
                amount,
                status,
                category: t.category,
                paymentMethod: "Bank Transfer" as const,
                description: `${description} · from ${from?.bank_name ?? "account"}`,
                account: to?.bank_name ?? "Unassigned",
                accountId: t.transfer_to_account_id ?? undefined,
                transferDirection: "incoming" as const,
              },
            ];
          }
          return [
            {
              id: t.id,
              date: t.transaction_date,
              reference: t.reference || "",
              type: t.transaction_type === "income" ? ("Income" as const) : ("Expense" as const),
              amount,
              status,
              category: t.category,
              paymentMethod: methodLabel(t.payment_method),
              description,
              account:
                snapshot?.accounts.find((a) => a.id === t.bank_account_id)?.bank_name ??
                "Unassigned",
              accountId: t.bank_account_id ?? undefined,
            },
          ];
        }),
      ...billPayments.map((p) => ({
        id: p.id,
        date: p.payment_date,
        reference: p.purchase_bills?.bill_number ?? "",
        type: "Expense" as const,
        amount: cents(p.amount),
        status: "Completed" as const,
        category: "Supplier bill payment",
        paymentMethod: methodLabel(p.payment_method),
        description: p.purchase_bills?.suppliers?.name ?? "Supplier bill payment",
        account:
          snapshot?.accounts.find((a) => a.id === p.bank_account_id)?.bank_name ?? "Unassigned",
        accountId: p.bank_account_id ?? undefined,
      })),
    ].sort((a, b) => b.date.localeCompare(a.date));

    const receivables: Receivable[] = invoices
      .map((inv) => {
        const total = invoiceTotal(inv);
        const paid = Math.min(total, cents(inv.amount_paid));
        const outstanding = cents(Math.max(0, total - paid));
        const overdue =
          outstanding > 0 && !!inv.due_date && inv.due_date < new Date().toISOString().slice(0, 10);
        const status: Receivable["status"] =
          outstanding <= 0 ? "Paid" : paid > 0 ? "Partial" : overdue ? "Overdue" : "Pending";
        return {
          id: inv.id,
          customer: inv.customers?.name ?? "Customer",
          invoiceNo: inv.invoice_number,
          invoiceDate: inv.invoice_date,
          dueDate: inv.due_date ?? inv.invoice_date,
          totalAmount: total,
          paidAmount: paid,
          outstandingAmount: outstanding,
          status,
          contactPhone: inv.customers?.phone ?? "",
          email: inv.customers?.email ?? "",
        };
      })
      .filter((r) => r.outstandingAmount > 0);

    const payables: Payable[] = bills.map((b) => {
      const paid = Math.min(cents(b.total), cents(b.amount_paid));
      const outstanding = cents(Math.max(0, b.total - paid));
      const overdue = outstanding > 0 && b.due_date < new Date().toISOString().slice(0, 10);
      return {
        id: b.id,
        supplier: b.suppliers?.name ?? "Supplier",
        billNo: b.bill_number,
        billDate: b.bill_date,
        dueDate: b.due_date,
        totalAmount: cents(b.total),
        paidAmount: paid,
        outstandingAmount: outstanding,
        status: outstanding <= 0 ? "Paid" : paid > 0 ? "Partial" : overdue ? "Overdue" : "Upcoming",
        contactPhone: b.suppliers?.phone ?? "",
      };
    });

    const accounts = (snapshot?.accounts ?? []).map((a) => toAccount(a, transactionRows));
    const bankBalance = cents(accounts.reduce((sum, account) => sum + account.balance, 0));
    const today = new Date().toISOString().slice(0, 10);
    const month = today.slice(0, 7);
    const todayIncome = cents(
      transactionRows
        .filter(
          (t) =>
            t.type === "Income" &&
            t.date === today &&
            (t.status === "Completed" || t.status === "Reconciled"),
        )
        .reduce((s, t) => s + t.amount, 0),
    );
    const todayExpenses = cents(
      transactionRows
        .filter(
          (t) =>
            t.type === "Expense" &&
            t.date === today &&
            (t.status === "Completed" || t.status === "Reconciled"),
        )
        .reduce((s, t) => s + t.amount, 0),
    );
    const monthIncome = cents(
      income.filter((i) => i.date.startsWith(month)).reduce((s, i) => s + i.amount, 0),
    );
    const monthExpenses = cents(
      expenses.filter((i) => i.date.startsWith(month)).reduce((s, i) => s + i.amount, 0),
    );

    const cashAccount = snapshot?.accounts.find((a) => a.account_type === "Cash");
    const cashTransactions = transactionRows
      .filter(
        (t) =>
          (cashAccount ? t.accountId === cashAccount.id : t.paymentMethod === "Cash") &&
          (t.status === "Completed" || t.status === "Reconciled") &&
          (!cashAccount || t.date >= cashAccount.opening_balance_date),
      )
      .sort((a, b) => a.date.localeCompare(b.date));
    let balance = cashAccount?.opening_balance ?? 0;
    const cashbook: CashbookEntry[] = cashTransactions
      .map((t) => {
        balance = cents(
          balance +
            (t.type === "Income" || (t.type === "Transfer" && t.transferDirection === "incoming")
              ? t.amount
              : t.type === "Expense" || t.type === "Transfer"
                ? -t.amount
                : 0),
        );
        const type: CashbookEntry["type"] =
          t.type === "Income" || (t.type === "Transfer" && t.transferDirection === "incoming")
            ? "in"
            : "out";
        return {
          id: t.id,
          date: t.date,
          description: t.description,
          type,
          amount: t.amount,
          balance,
          reference: t.reference,
        };
      })
      .reverse();
    const cashIn = cents(cashbook.reduce((s, e) => s + (e.type === "in" ? e.amount : 0), 0));
    const cashOut = cents(cashbook.reduce((s, e) => s + (e.type === "out" ? e.amount : 0), 0));
    const openingCashBalance = cashAccount?.opening_balance ?? 0;
    const closingCashBalance = cents(openingCashBalance + cashIn - cashOut);

    const monthMap = new Map<
      string,
      {
        income: number;
        expenses: number;
        gst: number;
        itc: number;
        cgst: number;
        sgst: number;
        igst: number;
      }
    >();
    const monthBucket = (key: string) => {
      const value = monthMap.get(key) ?? {
        income: 0,
        expenses: 0,
        gst: 0,
        itc: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
      };
      monthMap.set(key, value);
      return value;
    };
    for (const p of payments) {
      const key = p.payment_date.slice(0, 7);
      const v = monthBucket(key);
      if (p.status === "refunded") v.expenses += p.amount;
      else v.income += p.amount;
    }
    for (const t of rawTransactions.filter(
      (t) => t.status === "completed" || t.status === "reconciled",
    )) {
      const key = t.transaction_date.slice(0, 7);
      const v = monthBucket(key);
      const taxIncluded = (t.amount * t.gst_rate) / (100 + t.gst_rate);
      if (t.transaction_type === "income") {
        v.income += t.amount;
        v.gst += cents(taxIncluded);
      }
      if (t.transaction_type === "expense") {
        v.expenses += t.amount;
        v.itc += cents(taxIncluded);
      }
    }
    for (const bp of billPayments) {
      const key = bp.payment_date.slice(0, 7);
      monthBucket(key).expenses += bp.amount;
    }
    for (const inv of invoices) {
      const v = monthBucket(inv.invoice_date.slice(0, 7));
      const tax = cents(
        inv.invoice_items.reduce((sum, it) => {
          const base = cents(it.quantity * it.unit_price * (1 - it.discount_percent / 100));
          return sum + cents((base * it.gst_percent) / 100);
        }, 0),
      );
      v.gst += tax;
      if (inv.is_inter_state) v.igst += tax;
      else {
        const half = cents(tax / 2);
        v.cgst += half;
        v.sgst += cents(tax - half);
      }
    }
    for (const bill of bills) monthBucket(bill.bill_date.slice(0, 7)).itc += cents(bill.gst_amount);
    const nowDate = new Date();
    const monthKeys = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(nowDate.getFullYear(), nowDate.getMonth() - (11 - index), 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthBucket(key);
      return key;
    });
    const plData = monthKeys.map((key) => {
      const v = monthMap.get(key)!;
      const date = new Date(`${key}-01T00:00:00`);
      const revenue = cents(v.income);
      const expensesAmount = cents(v.expenses);
      const net = cents(revenue - expensesAmount);
      return {
        month: date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
        revenue,
        expenses: expensesAmount,
        grossProfit: net,
        netProfit: net,
      };
    });
    const gstSummary: GSTEntry[] = monthKeys.map((key) => {
      const v = monthMap.get(key)!;
      return {
        month: new Date(`${key}-01T00:00:00`).toLocaleDateString("en-IN", {
          month: "short",
          year: "numeric",
        }),
        cgst: cents(v.cgst),
        sgst: cents(v.sgst),
        igst: cents(v.igst),
        collectedGST: cents(v.gst),
        payableGST: cents(Math.max(0, v.gst - v.itc)),
        itcClaimed: cents(v.itc),
      };
    });
    const currentMonthGST = gstSummary.find(
      (g) =>
        g.month ===
        new Date(`${month}-01T00:00:00`).toLocaleDateString("en-IN", {
          month: "short",
          year: "numeric",
        }),
    ) ?? { month, cgst: 0, sgst: 0, igst: 0, collectedGST: 0, payableGST: 0, itcClaimed: 0 };
    const currentPL = plData[plData.length - 1] ?? {
      month: "—",
      revenue: 0,
      expenses: 0,
      grossProfit: 0,
      netProfit: 0,
    };
    const fiscalStartMonth = snapshot?.settings?.financial_year_start_month ?? 4;
    const fiscalStartYear =
      nowDate.getMonth() + 1 >= fiscalStartMonth
        ? nowDate.getFullYear()
        : nowDate.getFullYear() - 1;
    const fiscalStart = `${fiscalStartYear}-${String(fiscalStartMonth).padStart(2, "0")}`;
    const ytdRows = monthKeys.filter((key) => key >= fiscalStart).map((key) => monthMap.get(key)!);
    const ytdRevenue = cents(ytdRows.reduce((s, p) => s + p.income, 0));
    const ytdExpenses = cents(ytdRows.reduce((s, p) => s + p.expenses, 0));
    const ytdNetProfit = cents(ytdRevenue - ytdExpenses);
    const expenseByCategory = [...new Set(expenses.map((e) => e.category))].map((name) => ({
      name,
      value: cents(expenses.filter((e) => e.category === name).reduce((s, e) => s + e.amount, 0)),
    }));
    const totalReceivables = cents(receivables.reduce((s, r) => s + r.outstandingAmount, 0));
    const overdueReceivables = cents(
      receivables
        .filter((r) => r.status === "Overdue")
        .reduce((s, r) => s + r.outstandingAmount, 0),
    );
    const totalPayables = cents(payables.reduce((s, p) => s + p.outstandingAmount, 0));
    const overduePayables = cents(
      payables.filter((p) => p.status === "Overdue").reduce((s, p) => s + p.outstandingAmount, 0),
    );
    const revenueTrend = plData.map((p) => ({
      month: p.month,
      revenue: p.revenue,
      expenses: p.expenses,
    }));
    const cashFlowData = plData.map((p) => ({
      month: p.month,
      cashFlow: cents(p.revenue - p.expenses),
    }));
    const totalBankBalance = bankBalance;
    return {
      incomeEntries: income,
      expenseEntries: expenses,
      cashbookEntries: cashbook,
      openingCashBalance,
      cashIn,
      cashOut,
      closingCashBalance,
      bankAccounts: accounts,
      totalBankBalance,
      transactions: transactionRows,
      gstSummary,
      currentMonthGST,
      plData,
      currentPL,
      ytdRevenue,
      ytdExpenses,
      ytdNetProfit,
      receivables,
      totalReceivables,
      overdueReceivables,
      payables,
      totalPayables,
      overduePayables,
      todayIncome,
      todayExpenses,
      todayNetProfit: cents(todayIncome - todayExpenses),
      cashBalance: closingCashBalance,
      bankBalance,
      expenseByCategory,
      revenueTrend,
      cashFlowData,
      monthIncome,
      monthExpenses,
    };
  }, [query.data]);
  return { ...query, model };
}
