import { getSupabaseClient } from "@/lib/supabase";

export type PageInsightsMetrics = {
  conversionRate: number;
  mobileRate: number;
  failureRate: number;
  totalVisits: number;
  /** Visits where the payer interacted with the checkout form (tracked on the pay link). */
  checkoutStarted: number;
  totalPaid: number;
  totalFailed: number;
  peakDay: string;
};

/** Loads analytics for a payment page via server API (bypasses RLS that blocks browser reads). */
export async function getPageInsights(pageId: string): Promise<PageInsightsMetrics> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
  if (sessionErr || !sessionData.session?.access_token) {
    throw new Error("Not signed in");
  }

  const res = await fetch(`/api/admin/page-insights?pageId=${encodeURIComponent(pageId)}`, {
    headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
    credentials: "include",
  });

  const raw = await res.text();
  if (!res.ok) {
    throw new Error(raw || `HTTP ${res.status}`);
  }

  return JSON.parse(raw) as PageInsightsMetrics;
}
