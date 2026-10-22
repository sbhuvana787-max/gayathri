/* Supabase is not generated with database row types in this project. */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { FileText, FileSpreadsheet, Printer, Download, CheckCircle2 } from "lucide-react";
import { exportableReports } from "@/lib/reports-data";
import { SectionCard, PrimaryButton, SecondaryButton } from "../shared";
import { useReportsSnapshot } from "@/hooks/useReportsSnapshot";
import { toast } from "sonner";

type Format = "pdf" | "excel" | "csv" | "print";

export function ExportCenterTab() {
  const snapshot = useReportsSnapshot();
  const [lastExport, setLastExport] = useState<{ report: string; format: Format } | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(report: string) {
    setSelected((s) => (s.includes(report) ? s.filter((r) => r !== report) : [...s, report]));
  }

  function exportOne(report: string, format: Format) {
    if (!snapshot.data) {
      if (snapshot.isError) toast.error("Could not load report data.");
      return;
    }
    if (format === "print" || format === "pdf") {
      printRows(report, reportRows(report, snapshot.data));
      setLastExport({ report, format });
      return;
    }
    downloadRows(
      reportRows(report, snapshot.data),
      report.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      format,
    );
    setLastExport({ report, format });
  }

  function exportSelected(format: Format) {
    if (selected.length === 0) return;
    if (format === "print" || format === "pdf") {
      if (!snapshot.data) {
        if (snapshot.isError) toast.error("Could not load report data.");
        return;
      }
      printRows(
        `${selected.length} selected reports`,
        selected.flatMap((report) =>
          reportRows(report, snapshot.data!).map((row) => ({ report, ...row })),
        ),
      );
      setLastExport({ report: `${selected.length} selected reports`, format });
      return;
    }
    if (!snapshot.data) {
      if (snapshot.isError) toast.error("Could not load report data.");
      return;
    }
    const rows = selected.flatMap((report) =>
      reportRows(report, snapshot.data!).map((row) => ({ report, ...row })),
    );
    downloadRows(rows, `${selected.length}-reports`, format);
    setLastExport({ report: `${selected.length} selected reports`, format });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Export Center</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Export any report as PDF, Excel, or CSV, or send straight to print. Select multiple
          reports to batch-export.
        </p>
      </div>

      {lastExport && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>
            <span className="font-semibold">{lastExport.report}</span> exported as{" "}
            <span className="font-semibold uppercase">{lastExport.format}</span>.
          </span>
        </div>
      )}

      <SectionCard
        title="Batch Export"
        subtitle={`${selected.length} report${selected.length === 1 ? "" : "s"} selected`}
        action={
          <div className="flex gap-2">
            <SecondaryButton icon={Printer} onClick={() => exportSelected("print")}>
              Print
            </SecondaryButton>
            <SecondaryButton icon={Download} onClick={() => exportSelected("csv")}>
              CSV
            </SecondaryButton>
            <SecondaryButton icon={FileSpreadsheet} onClick={() => exportSelected("excel")}>
              Excel
            </SecondaryButton>
            <PrimaryButton icon={FileText} onClick={() => exportSelected("pdf")}>
              PDF
            </PrimaryButton>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {exportableReports.map((report) => {
            const active = selected.includes(report);
            return (
              <button
                key={report}
                onClick={() => toggle(report)}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
                  active
                    ? "border-[color:var(--brand-electric)] bg-indigo-50/60 text-foreground"
                    : "border-slate-200 bg-white text-foreground hover:bg-slate-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-400" />
                  {report}
                </span>
                <span
                  className={`h-4 w-4 rounded-full border-2 ${active ? "border-[color:var(--brand-electric)] bg-[color:var(--brand-electric)]" : "border-slate-300"}`}
                />
              </button>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Quick Export" subtitle="Export a single report instantly" noPadding>
        <div className="divide-y divide-slate-100">
          {exportableReports.map((report) => (
            <div key={report} className="flex items-center justify-between px-6 py-3">
              <span className="text-sm font-medium text-foreground">{report}</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => exportOne(report, "print")}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                  title="Print"
                >
                  <Printer className="h-4 w-4" />
                </button>
                <button
                  onClick={() => exportOne(report, "csv")}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                  title="Export CSV"
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  onClick={() => exportOne(report, "excel")}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                  title="Export Excel"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                </button>
                <button
                  onClick={() => exportOne(report, "pdf")}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                  title="Export PDF"
                >
                  <FileText className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function reportRows(
  report: string,
  data: NonNullable<ReturnType<typeof useReportsSnapshot>["data"]>,
): Record<string, unknown>[] {
  const invoiceAmount = (invoice: any) =>
    (invoice.invoice_items ?? []).reduce((sum: number, item: any) => {
      const net =
        Number(item.quantity || 0) *
        Number(item.unit_price || 0) *
        (1 - Number(item.discount_percent || 0) / 100);
      return sum + net * (1 + Number(item.gst_percent || 0) / 100);
    }, 0);
  switch (report) {
    case "Billing Report":
      return data.invoices.map((invoice) => ({
        invoice_number: invoice.invoice_number,
        invoice_date: invoice.invoice_date,
        status: invoice.status,
        payment_status: invoice.payment_status,
        amount: invoiceAmount(invoice),
        amount_paid: invoice.amount_paid,
        outstanding: Math.max(0, invoiceAmount(invoice) - Number(invoice.amount_paid || 0)),
      }));
    case "Inventory Report":
      return data.products;
    case "CRM Report":
      return data.leads;
    case "Finance Report":
      return data.transactions;
    case "Customer Report":
      return data.customers;
    case "Product Report":
      return data.products;
    case "GST Report":
      return data.invoices
        .filter((invoice) => !["draft", "cancelled"].includes(invoice.status))
        .map((invoice) => ({
          invoice_number: invoice.invoice_number,
          date: invoice.invoice_date,
          taxable_amount: (invoice.invoice_items ?? []).reduce(
            (sum, item) =>
              sum +
              Number(item.quantity || 0) *
                Number(item.unit_price || 0) *
                (1 - Number(item.discount_percent || 0) / 100),
            0,
          ),
          tax_amount: (invoice.invoice_items ?? []).reduce((sum, item) => {
            const net =
              Number(item.quantity || 0) *
              Number(item.unit_price || 0) *
              (1 - Number(item.discount_percent || 0) / 100);
            return sum + (net * Number(item.gst_percent || 0)) / 100;
          }, 0),
          interstate: invoice.is_inter_state,
        }));
    case "Sales Report":
      return data.invoices
        .filter((invoice) => !["draft", "cancelled"].includes(invoice.status))
        .map((invoice) => ({
          invoice_number: invoice.invoice_number,
          invoice_date: invoice.invoice_date,
          customer_id: invoice.customer_id,
          amount: invoiceAmount(invoice),
          status: invoice.status,
        }));
    default:
      return [
        ...data.invoices.map((row) => ({ record_type: "invoice", ...row })),
        ...data.payments.map((row) => ({ record_type: "payment", ...row })),
        ...data.bills.map((row) => ({ record_type: "purchase_bill", ...row })),
      ];
  }
}

function rowsToCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const cell = (value: unknown) => {
    const text =
      typeof value === "object" && value !== null ? JSON.stringify(value) : String(value ?? "");
    return `"${text.replaceAll('"', '""')}"`;
  };
  return [
    columns.map(cell).join(","),
    ...rows.map((row) => columns.map((key) => cell(row[key])).join(",")),
  ].join("\r\n");
}

function downloadRows(rows: Record<string, unknown>[], name: string, format: "csv" | "excel") {
  const content = format === "excel" ? rowsToExcelHtml(rows) : rowsToCsv(rows);
  const blob = new Blob([content], {
    type: format === "excel" ? "application/vnd.ms-excel;charset=utf-8" : "text/csv;charset=utf-8",
  });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = `${name}.${format === "excel" ? "xls" : "csv"}`;
  link.click();
  URL.revokeObjectURL(href);
}

function printRows(title: string, rows: Record<string, unknown>[]) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    toast.error("Allow pop-ups to print this report.");
    return;
  }
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const escape = (value: unknown) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  printWindow.document.write(
    `<html><head><title>${escape(title)}</title><style>body{font:14px Arial,sans-serif;padding:24px}h1{font-size:20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:6px;text-align:left;vertical-align:top}th{background:#f2f2f2}</style></head><body><h1>${escape(title)}</h1><table><thead><tr>${columns.map((column) => `<th>${escape(column)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${columns.map((column) => `<td>${escape(typeof row[column] === "object" && row[column] !== null ? JSON.stringify(row[column]) : row[column])}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`,
  );
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function rowsToExcelHtml(rows: Record<string, unknown>[]) {
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const cell = (value: unknown) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  return `<table><thead><tr>${columns.map((column) => `<th>${cell(column)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${columns.map((column) => `<td>${cell(row[column])}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}
