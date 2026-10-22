import { useEffect, useMemo } from "react";
import { useReportsSnapshot } from "@/hooks/useReportsSnapshot";
import { buildReportModel } from "@/lib/report-model";
import { toast } from "sonner";

export function useReportModel() {
  const query = useReportsSnapshot();
  const model = useMemo(() => (query.data ? buildReportModel(query.data) : null), [query.data]);
  useEffect(() => {
    if (query.error)
      toast.error("Reports could not be loaded. Check your connection and report schema.");
  }, [query.error]);
  return { ...query, model };
}
