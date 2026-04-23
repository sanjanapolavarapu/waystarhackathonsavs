import type { PaymentPage, Transaction } from "@/lib/qpp-types";
import { getSupabaseClient } from "@/lib/supabase";
import { getSelectedOrgId } from "@/lib/org";
import { fromPaymentPagesRow, toPaymentPagesRow } from "@/lib/paymentPagesDb";
import { fromCustomFieldRow, toCustomFieldRow } from "@/lib/customFieldsDb";

function requireSupabase() {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase not configured");
  return client;
}

function requireOrgId() {
  const orgId = getSelectedOrgId();
  if (!orgId) throw new Error("Select or join an organization to continue.");
  return orgId;
}

async function requireUserId(client: ReturnType<typeof requireSupabase>) {
  const { data, error } = await client.auth.getUser();
  if (error || !data.user?.id) throw new Error("Not signed in.");
  return data.user.id;
}

// Fetch one page with its custom fields by slug (org-scoped)
export async function getPageBySlug(slug: string): Promise<PaymentPage | null> {
  const client = requireSupabase();
  const orgId = requireOrgId();

  const result = await client
    .from("payment_pages")
    .select("*")
    .eq("slug", slug)
    .eq("organization_id", orgId)
    .maybeSingle();

  if (result.error) throw result.error;
  if (!result.data) return null;

  const page = fromPaymentPagesRow(result.data);
  if (!page) return null;

  const fieldsResult = await client
    .from("custom_fields")
    .select("*")
    .eq("page_id", result.data.id)
    .order("display_order", { ascending: true });

  if (fieldsResult.error) throw fieldsResult.error;
  page.fields = (fieldsResult.data ?? [])
    .map((r) => fromCustomFieldRow(r))
    .filter((f): f is NonNullable<typeof f> => Boolean(f));

  return page;
}

// Fetch all pages (org-scoped)
export async function listPages(): Promise<PaymentPage[]> {
  const client = requireSupabase();
  const orgId = requireOrgId();

  const result = await client
    .from("payment_pages")
    .select("*")
    .eq("organization_id", orgId)
    .order("updated_at", { ascending: false });

  if (result.error) throw result.error;
  return (result.data ?? [])
    .map((r) => fromPaymentPagesRow(r))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
}

// Upsert page (org-scoped), then delete+reinsert its custom fields
export async function savePage(page: PaymentPage): Promise<void> {
  const client = requireSupabase();
  const orgId = requireOrgId();
  const userId = await requireUserId(client);

  // Upsert the page row.
  const upsert = await client
    .from("payment_pages")
    .upsert(
      {
        organization_id: orgId,
        admin_id: userId,
        ...toPaymentPagesRow(page),
      },
      { onConflict: "slug" },
    )
    .select("id")
    .eq("organization_id", orgId)
    .eq("slug", page.slug)
    .single();

  if (upsert.error) throw upsert.error;
  const pageId = upsert.data?.id;
  if (!pageId) throw new Error("Failed to save page.");

  // Replace fields.
  const del = await client.from("custom_fields").delete().eq("page_id", pageId);
  if (del.error) throw del.error;

  if (page.fields?.length) {
    const ins = await client
      .from("custom_fields")
      .insert(page.fields.map((f) => toCustomFieldRow(f, pageId)));
    if (ins.error) throw ins.error;
  }
}

// Fetch all transactions, join payment_pages to get slug
export async function listTransactions(): Promise<Transaction[]> {
  const client = requireSupabase();

  const { data, error } = await client
    .from("transactions")
    .select("id, createdAt, status, paymentMethod, amount, payerEmail, glCode, page_id, payment_pages(slug)");
  if (error) throw error;

  const rows = (data ?? []) as Array<{
    id: string;
    createdAt: string;
    status: Transaction["status"];
    paymentMethod: Transaction["paymentMethod"];
    amount: number;
    payerEmail?: string | null;
    glCode?: string | null;
    page_id?: string;
    payment_pages?: { slug?: string | null } | Array<{ slug?: string | null }> | null;
  }>;

  return rows.map((row) => {
    const joined = Array.isArray(row.payment_pages) ? row.payment_pages[0] : row.payment_pages;
    return {
      id: row.id,
      pageSlug: joined?.slug ?? "",
      createdAt: row.createdAt,
      status: row.status,
      paymentMethod: row.paymentMethod,
      amountCents: Math.round(Number(row.amount ?? 0) * 100),
      payerEmail: row.payerEmail ?? undefined,
      glCode: row.glCode ?? undefined,
    };
  });
}
