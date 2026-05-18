import type { PaymentPage, Transaction } from "@/lib/qpp-types";
import { getSupabaseClient } from "@/lib/supabase";
import { fromPaymentPagesRow } from "@/lib/paymentPagesDb";
import { fromCustomFieldRow } from "@/lib/customFieldsDb";
import { getSelectedOrgId } from "@/lib/org";

async function jsonOrThrow<T>(res: Response): Promise<T> {
  const json = (await res.json().catch(() => ({}))) as unknown;
  if (!res.ok) {
    const msg =
      typeof (json as { error?: unknown } | null)?.error === "string"
        ? String((json as { error?: string }).error)
        : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json as T;
}

function requireSupabase() {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase not configured");
  return client;
}

// Fetch one page with its custom fields by slug (org-scoped)
export async function getPageBySlug(slug: string): Promise<PaymentPage | null> {
  const client = requireSupabase();

  const orgId = getSelectedOrgId();
  if (!orgId) throw new Error("Select or join an organization to continue.");

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
  const orgId = getSelectedOrgId();
  if (!orgId) throw new Error("Select or join an organization to continue.");

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

/**
 * Persist from the admin UI via server routes (service role + correct field_type mapping).
 * Browser Supabase writes often fail under RLS; the API matches the admin editor expectations.
 */
export async function savePage(page: PaymentPage): Promise<PaymentPage> {
  const orgId = getSelectedOrgId();
  if (!orgId) throw new Error("Select or join an organization to continue.");

  const slug = encodeURIComponent(page.slug);
  const putRes = await fetch(`/api/admin/payment-pages/${slug}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "x-org-id": orgId },
    body: JSON.stringify({ page }),
    credentials: "same-origin",
  });

  if (putRes.ok) {
    const body = (await putRes.json()) as { page?: PaymentPage; error?: string };
    if (body.page) return body.page;
    throw new Error(body.error || "Save failed: empty response from server.");
  }

  if (putRes.status === 404) {
    const postRes = await fetch("/api/admin/payment-pages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-org-id": orgId },
      body: JSON.stringify({ page }),
      credentials: "same-origin",
    });
    const body = await jsonOrThrow<{ page?: PaymentPage }>(postRes);
    if (!body.page) throw new Error("Create failed: empty response from server.");
    return body.page;
  }

  const errBody = (await putRes.json().catch(() => ({}))) as { error?: string };
  throw new Error(errBody.error || `Failed to save page (${putRes.status})`);
}

/** Permanently delete a payment page and its related records (org-scoped). */
export async function deletePage(slug: string): Promise<void> {
  const orgId = getSelectedOrgId();
  if (!orgId) throw new Error("Select or join an organization to continue.");

  const res = await fetch(`/api/admin/payment-pages/${encodeURIComponent(slug)}`, {
    method: "DELETE",
    headers: { "x-org-id": orgId },
    credentials: "same-origin",
  });

  await jsonOrThrow<{ ok?: boolean }>(res);
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
