import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { crmService } from "../services/crm";

const keys = {
  leads: (businessId: string) => ["crm-leads", businessId] as const,
  followUps: (businessId: string) => ["crm-follow-ups", businessId] as const,
  activities: (businessId: string) => ["crm-activities", businessId] as const,
  settings: (businessId: string) => ["crm-settings", businessId] as const,
};

export function useCrmLeads(businessId: string | null) {
  return useQuery({
    queryKey: businessId ? keys.leads(businessId) : ["crm-leads"],
    queryFn: () => crmService.getLeads(businessId!),
    enabled: !!businessId,
  });
}
export function useCrmFollowUps(businessId: string | null) {
  return useQuery({
    queryKey: businessId ? keys.followUps(businessId) : ["crm-follow-ups"],
    queryFn: () => crmService.getFollowUps(businessId!),
    enabled: !!businessId,
  });
}
export function useCrmActivities(businessId: string | null) {
  return useQuery({
    queryKey: businessId ? keys.activities(businessId) : ["crm-activities"],
    queryFn: () => crmService.getActivities(businessId!),
    enabled: !!businessId,
  });
}
export function useCrmSettings(businessId: string | null) {
  return useQuery({
    queryKey: businessId ? keys.settings(businessId) : ["crm-settings"],
    queryFn: () => crmService.getSettings(businessId!),
    enabled: !!businessId,
  });
}

export function useSaveCrmLead(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      payload,
      id,
    }: {
      payload: Parameters<typeof crmService.saveLead>[1];
      id?: string;
    }) => crmService.saveLead(businessId!, payload, id),
    onSuccess: () => {
      if (businessId) {
        qc.invalidateQueries({ queryKey: keys.leads(businessId) });
        qc.invalidateQueries({ queryKey: keys.activities(businessId) });
      }
    },
  });
}
export function useDeleteCrmLead(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: crmService.deleteLead,
    onSuccess: () => {
      if (businessId) qc.invalidateQueries({ queryKey: keys.leads(businessId) });
    },
  });
}
export function useConvertCrmLead(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (leadId: string) => crmService.convertLead(businessId!, leadId),
    onSuccess: () => {
      if (businessId) {
        qc.invalidateQueries({ queryKey: keys.leads(businessId) });
        qc.invalidateQueries({ queryKey: keys.activities(businessId) });
        qc.invalidateQueries({ queryKey: ["customers", businessId] });
      }
    },
  });
}
export function useSaveCrmFollowUp(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      payload,
      id,
    }: {
      payload: Parameters<typeof crmService.saveFollowUp>[1];
      id?: string;
    }) => crmService.saveFollowUp(businessId!, payload, id),
    onSuccess: () => {
      if (businessId) {
        qc.invalidateQueries({ queryKey: keys.followUps(businessId) });
        qc.invalidateQueries({ queryKey: keys.activities(businessId) });
      }
    },
  });
}
export function useDeleteCrmFollowUp(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: crmService.deleteFollowUp,
    onSuccess: () => {
      if (businessId) qc.invalidateQueries({ queryKey: keys.followUps(businessId) });
    },
  });
}
export function useSaveCrmSettings(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof crmService.saveSettings>[1]) =>
      crmService.saveSettings(businessId!, payload),
    onSuccess: () => {
      if (businessId) qc.invalidateQueries({ queryKey: keys.settings(businessId) });
    },
  });
}
