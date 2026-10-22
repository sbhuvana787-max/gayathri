import { useQuery } from "@tanstack/react-query";
import { useBusiness } from "@/contexts/BusinessContext";
import { reportsService } from "@/services/reports";

export function useReportsSnapshot() {
  const { business } = useBusiness();
  return useQuery({
    queryKey: ["reports", business?.id],
    queryFn: () => reportsService.snapshot(business!.id),
    enabled: Boolean(business?.id),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}
