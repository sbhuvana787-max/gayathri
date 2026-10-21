import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Landmark, PlusCircle, X, CreditCard, Eye, ArrowLeftRight } from "lucide-react";
import { fmtINR, fmtDate } from "@/lib/finance-data";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useFinanceModel } from "@/hooks/useFinanceModel";
import {
  SectionCard,
  StatTile,
  StatusPill,
  PrimaryButton,
  SecondaryButton,
  TableWrapper,
  Th,
  Td,
} from "@/components/finance/shared";

const BANK_COLORS: Record<string, { header: string; badge: string }> = {
  "HDFC Bank": { header: "from-indigo-600 to-blue-500", badge: "bg-indigo-100 text-indigo-700" },
  "ICICI Bank": { header: "from-orange-500 to-amber-400", badge: "bg-orange-100 text-orange-700" },
  "SBI Bank": { header: "from-blue-700 to-blue-500", badge: "bg-blue-100 text-blue-700" },
};

export function BankAccountsTab() {
  const { model, isLoading, isError, error } = useFinanceModel();
  const finance = useFinanceData();
  const bankAccounts = model.bankAccounts;
  const totalBankBalance = model.totalBankBalance;
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [viewAllBank, setViewAllBank] = useState<string | null>(null);
  const [operationError, setOperationError] = useState("");
  const [accountForm, setAccountForm] = useState({
    bankName: "",
    accountHolder: "",
    accountNumber: "",
    ifsc: "",
    accountType: "Current" as "Current" | "Savings" | "OD" | "Cash",
    balance: "0",
    openingDate: new Date().toISOString().slice(0, 10),
  });
  const [transferForm, setTransferForm] = useState({
    fromAccountId: "",
    toAccountId: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    reference: "",
    notes: "",
  });

  async function addAccount() {
    const balance = Number(accountForm.balance);
    if (!accountForm.bankName.trim() || !Number.isFinite(balance)) {
      setOperationError("Enter an account name and valid opening balance.");
      return;
    }
    try {
      await finance.createAccount.mutateAsync({
        bank_name: accountForm.bankName.trim(),
        account_holder: accountForm.accountHolder.trim(),
        account_number_masked: accountForm.accountNumber.trim(),
        ifsc: accountForm.ifsc.trim().toUpperCase(),
        account_type: accountForm.accountType,
        opening_balance: Math.round(balance * 100) / 100,
        opening_balance_date: accountForm.openingDate,
        is_active: true,
      });
      setAccountForm({
        bankName: "",
        accountHolder: "",
        accountNumber: "",
        ifsc: "",
        accountType: "Current",
        balance: "0",
        openingDate: new Date().toISOString().slice(0, 10),
      });
      setShowAddDialog(false);
      setOperationError("");
    } catch (e) {
      setOperationError((e as Error).message || "Unable to create bank account.");
    }
  }

  async function submitTransfer() {
    const amount = Number(transferForm.amount);
    const source = bankAccounts.find((account) => account.id === transferForm.fromAccountId);
    if (
      !source ||
      !transferForm.toAccountId ||
      source.id === transferForm.toAccountId ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !transferForm.date
    ) {
      setOperationError("Choose two different accounts, a date, and an amount greater than zero.");
      return;
    }
    if (source.accountType !== "OD" && amount > source.balance) {
      setOperationError("The transfer amount exceeds the source account balance.");
      return;
    }
    try {
      await finance.createTransfer.mutateAsync({ ...transferForm, amount });
      setTransferForm({
        fromAccountId: "",
        toAccountId: "",
        amount: "",
        date: new Date().toISOString().slice(0, 10),
        reference: "",
        notes: "",
      });
      setShowTransferDialog(false);
      setOperationError("");
    } catch (e) {
      setOperationError((e as Error).message || "Unable to record transfer.");
    }
  }

  if (isLoading)
    return (
      <p className="rounded-xl border bg-white p-6 text-sm text-muted-foreground">
        Loading bank accounts…
      </p>
    );
  if (isError)
    return (
      <p
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700"
      >
        Unable to load bank accounts: {(error as Error).message}
      </p>
    );

  const activeCount = bankAccounts.length;

  return (
    <div className="space-y-6">
      {operationError && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {operationError}
        </p>
      )}
      {/* Stat Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatTile
          label="Total Bank Balance"
          value={fmtINR(totalBankBalance)}
          sub="Across all accounts"
          icon={Landmark}
          bg="bg-indigo-50"
          iconColor="text-indigo-600"
          index={0}
        />
        <StatTile
          label="No. of Accounts"
          value={String(bankAccounts.length)}
          sub="Linked bank accounts"
          icon={Building2}
          bg="bg-emerald-50"
          iconColor="text-emerald-600"
          index={1}
        />
        <StatTile
          label="Active Accounts"
          value={String(activeCount)}
          sub="Currently operational"
          icon={CreditCard}
          bg="bg-blue-50"
          iconColor="text-blue-600"
          index={2}
        />
      </div>

      {/* Header with Add Account */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Bank Accounts</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage and monitor all linked bank accounts
          </p>
        </div>
        <div className="flex gap-2">
          <SecondaryButton icon={ArrowLeftRight} onClick={() => setShowTransferDialog(true)}>
            Transfer Money
          </SecondaryButton>
          <PrimaryButton icon={PlusCircle} onClick={() => setShowAddDialog(true)}>
            Add Account
          </PrimaryButton>
        </div>
      </div>

      {/* Account Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {bankAccounts.map((account, idx) => {
          const colors = BANK_COLORS[account.bankName] ?? {
            header: "from-slate-600 to-slate-500",
            badge: "bg-slate-100 text-slate-700",
          };
          return (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.07, ease: "easeOut" }}
              className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col"
            >
              {/* Colored Header Strip */}
              <div className={`bg-gradient-to-r ${colors.header} px-5 py-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{account.bankName}</p>
                      <p className="text-[11px] text-white/75">{account.ifsc}</p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${colors.badge}`}
                  >
                    {account.accountType}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="flex-1 p-5 space-y-4">
                {/* Account Info */}
                <div>
                  <p className="text-xs text-muted-foreground">Account Holder</p>
                  <p className="text-sm font-medium text-foreground mt-0.5">
                    {account.accountHolder}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Account Number</p>
                    <p className="text-sm font-mono font-medium text-foreground mt-0.5">
                      {account.accountNumber}
                    </p>
                  </div>
                </div>

                {/* Balance */}
                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-xs text-muted-foreground">Current Balance</p>
                  <p className="text-xl font-bold text-foreground mt-1">
                    {fmtINR(account.balance)}
                  </p>
                </div>

                {/* Recent Transactions */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Recent Transactions
                  </p>
                  <div className="space-y-0">
                    {account.recentTransactions.slice(0, 5).map((txn, ti) => (
                      <div
                        key={ti}
                        className="flex items-center justify-between border-b border-slate-50 py-2 last:border-0"
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="text-xs font-medium text-foreground truncate">
                            {txn.description}
                          </p>
                          <p className="text-[11px] text-muted-foreground">{fmtDate(txn.date)}</p>
                        </div>
                        <span
                          className={`text-xs font-semibold whitespace-nowrap ${
                            txn.type === "credit" ? "text-emerald-600" : "text-red-500"
                          }`}
                        >
                          {txn.type === "credit" ? "+" : "-"}
                          {fmtINR(txn.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-100 px-5 py-3">
                <SecondaryButton
                  icon={Eye}
                  onClick={() => setViewAllBank(account.id)}
                  className="w-full justify-center"
                >
                  View All Transactions
                </SecondaryButton>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Total Balance Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25, ease: "easeOut" }}
        className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Total Bank Balance Summary</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Combined balance across all {bankAccounts.length} linked accounts
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground">{fmtINR(totalBankBalance)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">As of today</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {bankAccounts.map((acc) => {
            const pct = Math.round((acc.balance / totalBankBalance) * 100);
            return (
              <div
                key={acc.id}
                className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-foreground">{acc.bankName}</p>
                  <span className="text-[11px] text-muted-foreground">{pct}%</span>
                </div>
                <p className="text-sm font-bold text-foreground">{fmtINR(acc.balance)}</p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200">
                  <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Add Account Dialog (placeholder) */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
          >
            <button
              onClick={() => setShowAddDialog(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                <Building2 className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Add Bank Account</h3>
                <p className="text-xs text-muted-foreground">Link a new bank account</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="col-span-2 text-xs text-muted-foreground">
                Account / bank name
                <input
                  value={accountForm.bankName}
                  onChange={(e) => setAccountForm((v) => ({ ...v, bankName: e.target.value }))}
                  className="mt-1 h-9 w-full rounded-lg border px-3 text-sm text-foreground"
                  required
                />
              </label>
              <label className="text-xs text-muted-foreground">
                Account holder
                <input
                  value={accountForm.accountHolder}
                  onChange={(e) => setAccountForm((v) => ({ ...v, accountHolder: e.target.value }))}
                  className="mt-1 h-9 w-full rounded-lg border px-3 text-sm text-foreground"
                />
              </label>
              <label className="text-xs text-muted-foreground">
                Masked account number
                <input
                  value={accountForm.accountNumber}
                  onChange={(e) => setAccountForm((v) => ({ ...v, accountNumber: e.target.value }))}
                  className="mt-1 h-9 w-full rounded-lg border px-3 text-sm text-foreground"
                  placeholder="•••• 1234"
                />
              </label>
              <label className="text-xs text-muted-foreground">
                IFSC
                <input
                  value={accountForm.ifsc}
                  onChange={(e) => setAccountForm((v) => ({ ...v, ifsc: e.target.value }))}
                  className="mt-1 h-9 w-full rounded-lg border px-3 text-sm text-foreground"
                />
              </label>
              <label className="text-xs text-muted-foreground">
                Type
                <select
                  value={accountForm.accountType}
                  onChange={(e) =>
                    setAccountForm((v) => ({
                      ...v,
                      accountType: e.target.value as "Current" | "Savings" | "OD" | "Cash",
                    }))
                  }
                  className="mt-1 h-9 w-full rounded-lg border bg-white px-3 text-sm text-foreground"
                >
                  <option>Current</option>
                  <option>Savings</option>
                  <option>OD</option>
                  <option>Cash</option>
                </select>
              </label>
              <label className="text-xs text-muted-foreground">
                Opening balance
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={accountForm.balance}
                  onChange={(e) => setAccountForm((v) => ({ ...v, balance: e.target.value }))}
                  className="mt-1 h-9 w-full rounded-lg border px-3 text-sm text-foreground"
                />
              </label>
              <label className="text-xs text-muted-foreground">
                Opening balance date
                <input
                  type="date"
                  value={accountForm.openingDate}
                  onChange={(e) => setAccountForm((v) => ({ ...v, openingDate: e.target.value }))}
                  className="mt-1 h-9 w-full rounded-lg border px-3 text-sm text-foreground"
                />
              </label>
            </div>
            <div className="mt-4 flex justify-end">
              <div className="flex gap-2">
                <SecondaryButton onClick={() => setShowAddDialog(false)}>Cancel</SecondaryButton>
                <PrimaryButton
                  onClick={() => void addAccount()}
                  disabled={finance.createAccount.isPending}
                >
                  Save Account
                </PrimaryButton>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {showTransferDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold">Transfer between accounts</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  The source and destination entries are recorded together.
                </p>
              </div>
              <button
                aria-label="Close transfer dialog"
                onClick={() => setShowTransferDialog(false)}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 space-y-3">
              <label className="block text-xs text-muted-foreground">
                From account
                <select
                  value={transferForm.fromAccountId}
                  onChange={(e) =>
                    setTransferForm((v) => ({ ...v, fromAccountId: e.target.value }))
                  }
                  className="mt-1 h-10 w-full rounded-lg border bg-white px-3 text-sm text-foreground"
                >
                  <option value="">Select source</option>
                  {(finance.data?.accounts ?? [])
                    .filter((a) => a.is_active)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.bank_name} · {a.account_number_masked}
                      </option>
                    ))}
                </select>
              </label>
              <label className="block text-xs text-muted-foreground">
                To account
                <select
                  value={transferForm.toAccountId}
                  onChange={(e) => setTransferForm((v) => ({ ...v, toAccountId: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-lg border bg-white px-3 text-sm text-foreground"
                >
                  <option value="">Select destination</option>
                  {(finance.data?.accounts ?? [])
                    .filter((a) => a.is_active)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.bank_name} · {a.account_number_masked}
                      </option>
                    ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-muted-foreground">
                  Amount
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={transferForm.amount}
                    onChange={(e) => setTransferForm((v) => ({ ...v, amount: e.target.value }))}
                    className="mt-1 h-10 w-full rounded-lg border px-3 text-sm text-foreground"
                  />
                </label>
                <label className="text-xs text-muted-foreground">
                  Date
                  <input
                    type="date"
                    value={transferForm.date}
                    onChange={(e) => setTransferForm((v) => ({ ...v, date: e.target.value }))}
                    className="mt-1 h-10 w-full rounded-lg border px-3 text-sm text-foreground"
                  />
                </label>
              </div>
              <label className="block text-xs text-muted-foreground">
                Reference (optional)
                <input
                  value={transferForm.reference}
                  onChange={(e) => setTransferForm((v) => ({ ...v, reference: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-lg border px-3 text-sm text-foreground"
                />
              </label>
              <label className="block text-xs text-muted-foreground">
                Notes (optional)
                <input
                  value={transferForm.notes}
                  onChange={(e) => setTransferForm((v) => ({ ...v, notes: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-lg border px-3 text-sm text-foreground"
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <SecondaryButton onClick={() => setShowTransferDialog(false)}>Cancel</SecondaryButton>
              <PrimaryButton
                icon={ArrowLeftRight}
                onClick={() => void submitTransfer()}
                disabled={
                  finance.createTransfer.isPending ||
                  (finance.data?.accounts.filter((a) => a.is_active).length ?? 0) < 2
                }
              >
                Record Transfer
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {/* View All Transactions Dialog */}
      {viewAllBank && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
          >
            <button
              onClick={() => setViewAllBank(null)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
            {(() => {
              const acc = bankAccounts.find((a) => a.id === viewAllBank);
              if (!acc) return null;
              return (
                <>
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    {acc.bankName} — All Transactions
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">{acc.accountNumber}</p>
                  <TableWrapper>
                    <thead>
                      <tr>
                        <Th>Date</Th>
                        <Th>Description</Th>
                        <Th right>Amount</Th>
                        <Th>Type</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {model.transactions
                        .filter((t) => t.accountId === acc.id)
                        .map((txn) => (
                          <tr key={txn.id}>
                            <Td>
                              <span className="text-xs text-muted-foreground">
                                {fmtDate(txn.date)}
                              </span>
                            </Td>
                            <Td>
                              <span className="text-xs">{txn.description}</span>
                            </Td>
                            <Td right>
                              <span
                                className={`text-xs font-semibold ${txn.type === "Income" || (txn.type === "Transfer" && txn.transferDirection === "incoming") ? "text-emerald-600" : "text-red-500"}`}
                              >
                                {txn.type === "Income" ||
                                (txn.type === "Transfer" && txn.transferDirection === "incoming")
                                  ? "+"
                                  : "-"}
                                {fmtINR(txn.amount)}
                              </span>
                            </Td>
                            <Td>
                              <StatusPill
                                status={
                                  txn.type === "Transfer"
                                    ? `Transfer ${txn.transferDirection === "incoming" ? "In" : "Out"}`
                                    : txn.type
                                }
                              />
                            </Td>
                          </tr>
                        ))}
                    </tbody>
                  </TableWrapper>
                  <div className="mt-4 flex justify-end">
                    <SecondaryButton onClick={() => setViewAllBank(null)}>Close</SecondaryButton>
                  </div>
                </>
              );
            })()}
          </motion.div>
        </div>
      )}
    </div>
  );
}
