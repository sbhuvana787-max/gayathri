import { createContext, useContext, useState, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { useBusinessQuery } from "../hooks/useBusinessQuery";

// ── Types ─────────────────────────────────────────────────────────

export interface Business {
  id: string;
  owner_id: string;
  business_name: string | null;
  business_type: string | null;
  logo_url: string | null;
  owner_name: string | null;
  phone: string | null;
  email: string | null;
  gst_number: string | null;
  pan_number: string | null;
  currency: string;
  timezone: string;
  financial_year: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  postal_code: string | null;
  website: string | null;
  description: string | null;
  date_format: string;
  decimal_precision: number;
  invoice_prefix: string;
  invoice_number_format: string;
  tax_enabled: boolean;
  language: string;
  theme: string;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

interface BusinessContextValue {
  business: Business | null;
  businessLoading: boolean;
  businessError: string | null;
  onboardingCompleted: boolean;
  /** Call this after the wizard marks onboarding done so the guard updates immediately */
  setOnboardingCompleted: (value: boolean) => void;
  refetchBusiness: () => Promise<void>;
}

// ── Context ───────────────────────────────────────────────────────

const BusinessContext = createContext<BusinessContextValue | null>(null);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const {
    data: business,
    isLoading: businessLoading,
    error: queryError,
    refetch,
  } = useBusinessQuery(user?.id ?? null);

  // Optimistic flag: the wizard sets this to true immediately on completion
  // so the OnboardingGuard lets the user through before the query re-fetches.
  const [optimisticOnboarding, setOptimisticOnboarding] = useState<{
    userId: string | null;
    value: boolean;
  } | null>(null);

  const onboardingCompleted =
    optimisticOnboarding && optimisticOnboarding.userId === user?.id
      ? optimisticOnboarding.value
      : // If there's a query error (e.g. table not found), send users to the wizard
        // so they see a meaningful save error rather than being silently bypassed.
        queryError != null
        ? false
        : (business?.onboarding_completed ?? false);

  const refetchBusiness = async () => {
    await refetch();
  };
  const setOnboardingCompleted = (value: boolean) => {
    setOptimisticOnboarding({ userId: user?.id ?? null, value });
  };

  return (
    <BusinessContext.Provider
      value={{
        business: business ?? null,
        businessLoading,
        businessError: queryError ? (queryError as Error).message : null,
        onboardingCompleted,
        setOnboardingCompleted,
        refetchBusiness,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness(): BusinessContextValue {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error("useBusiness must be used inside <BusinessProvider>");
  return ctx;
}
