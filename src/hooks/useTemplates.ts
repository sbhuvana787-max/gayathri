/**
 * useTemplates — React Query hooks for the Billing Templates module.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { templatesService } from "../services/templates";
import type { DbTemplate, TemplateInput, TemplateStatus, TemplateType } from "../services/templates";

// ── Query keys ─────────────────────────────────────────────────────

export const templateKeys = {
  all: ["templates"] as const,
  byBusiness: (businessId: string) => ["templates", businessId] as const,
};

// ── Fetch ──────────────────────────────────────────────────────────

export function useTemplates(businessId: string | null) {
  return useQuery({
    queryKey: businessId ? templateKeys.byBusiness(businessId) : templateKeys.all,
    queryFn: () => templatesService.getAll(businessId!),
    enabled: !!businessId,
    staleTime: 1000 * 60, // 1 min
  });
}

// ── Create ─────────────────────────────────────────────────────────

export function useCreateTemplate(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TemplateInput) =>
      templatesService.create(input, businessId!),
    onSuccess: () => {
      if (businessId) qc.invalidateQueries({ queryKey: templateKeys.byBusiness(businessId) });
    },
  });
}

// ── Update ─────────────────────────────────────────────────────────

export function useUpdateTemplate(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TemplateInput }) =>
      templatesService.update(id, input, businessId!),
    onSuccess: () => {
      if (businessId) qc.invalidateQueries({ queryKey: templateKeys.byBusiness(businessId) });
    },
  });
}

// ── Delete ─────────────────────────────────────────────────────────

export function useDeleteTemplate(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => templatesService.delete(id),
    onSuccess: () => {
      if (businessId) qc.invalidateQueries({ queryKey: templateKeys.byBusiness(businessId) });
    },
  });
}

// ── Duplicate ──────────────────────────────────────────────────────

export function useDuplicateTemplate(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => templatesService.duplicate(id, businessId!),
    onSuccess: () => {
      if (businessId) qc.invalidateQueries({ queryKey: templateKeys.byBusiness(businessId) });
    },
  });
}

// ── Set Default ────────────────────────────────────────────────────

export function useSetDefaultTemplate(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, templateType }: { id: string; templateType: TemplateType }) =>
      templatesService.setDefault(id, businessId!, templateType),
    onMutate: async ({ id, templateType }) => {
      if (!businessId) return;
      await qc.cancelQueries({ queryKey: templateKeys.byBusiness(businessId) });
      const previous = qc.getQueryData<DbTemplate[]>(templateKeys.byBusiness(businessId));
      qc.setQueryData<DbTemplate[]>(templateKeys.byBusiness(businessId), (old) =>
        (old ?? []).map((t) =>
          t.template_type === templateType
            ? { ...t, is_default: t.id === id }
            : t
        )
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (businessId && ctx?.previous) {
        qc.setQueryData<DbTemplate[]>(templateKeys.byBusiness(businessId), ctx.previous);
      }
    },
    onSettled: () => {
      if (businessId) qc.invalidateQueries({ queryKey: templateKeys.byBusiness(businessId) });
    },
  });
}

// ── Update Status ──────────────────────────────────────────────────

export function useUpdateTemplateStatus(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TemplateStatus }) =>
      templatesService.updateStatus(id, status),
    onMutate: async ({ id, status }) => {
      if (!businessId) return;
      await qc.cancelQueries({ queryKey: templateKeys.byBusiness(businessId) });
      const previous = qc.getQueryData<DbTemplate[]>(templateKeys.byBusiness(businessId));
      qc.setQueryData<DbTemplate[]>(templateKeys.byBusiness(businessId), (old) =>
        (old ?? []).map((t) => (t.id === id ? { ...t, status } : t))
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (businessId && ctx?.previous) {
        qc.setQueryData<DbTemplate[]>(templateKeys.byBusiness(businessId), ctx.previous);
      }
    },
    onSettled: () => {
      if (businessId) qc.invalidateQueries({ queryKey: templateKeys.byBusiness(businessId) });
    },
  });
}

// ── Upload Logo ────────────────────────────────────────────────────

export function useUploadTemplateLogo(businessId: string | null) {
  return useMutation({
    mutationFn: (file: File) => templatesService.uploadLogo(file, businessId!),
  });
}
