import { DatabaseBackup, Upload } from "lucide-react";
import { SectionCard, PrimaryButton, SecondaryButton } from "@/components/settings/shared";
import { toast } from "sonner";

export function BackupRestoreTab() {
  function runBackup() {
    toast.error("Backup is unavailable until a secure server-side backup provider is configured.");
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        This section is UI only — no data is actually backed up, exported, or restored yet.
      </div>

      <SectionCard
        title="Manual Backup"
        subtitle="Create an on-demand snapshot of your business data"
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
            <DatabaseBackup className="h-4 w-4 text-blue-600" />
          </div>
        }
      >
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-foreground">Run a manual backup now</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Scheduled backups are unavailable until server-side backup storage is configured.
            </p>
          </div>
          <PrimaryButton icon={DatabaseBackup} onClick={runBackup}>
            Run Manual Backup
          </PrimaryButton>
        </div>
      </SectionCard>

      <SectionCard
        title="Restore"
        subtitle="Restore your business data from a previous backup"
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50">
            <Upload className="h-4 w-4 text-violet-600" />
          </div>
        }
      >
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <p className="text-sm text-muted-foreground max-w-md">
            Upload a backup file to restore your data to a previous state. This is a placeholder —
            restore functionality is not yet active.
          </p>
          <SecondaryButton icon={Upload}>Upload Backup File</SecondaryButton>
        </div>
      </SectionCard>

      <SectionCard title="Recent Backups" subtitle="Last 5 backup snapshots" noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-6 py-3">Created</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                  No backup records are available.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
