import { fromCustomFieldRow } from "@/lib/customFieldsDb";
import { getPageBySlug } from "@/lib/mock-qpp";
import { fromPaymentPagesRow } from "@/lib/paymentPagesDb";
import type { PaymentPage } from "@/lib/qpp-types";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

/** Load a public payment page by slug (Supabase, then mock fallback). */
export async function getPublicPaymentPage(slug: string): Promise<PaymentPage | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return getPageBySlug(slug);

  const result = await supabase
    .from("payment_pages")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (result.error || !result.data) return getPageBySlug(slug);

  const page = fromPaymentPagesRow(result.data);
  if (!page) return getPageBySlug(slug);

  const fieldsResult = await supabase
    .from("custom_fields")
    .select("*")
    .eq("page_id", result.data.id)
    .order("display_order", { ascending: true });

  if (!fieldsResult.error) {
    page.fields = (fieldsResult.data ?? [])
      .map((r) => fromCustomFieldRow(r))
      .filter((f): f is NonNullable<typeof f> => Boolean(f));
  }

  return page;
}
