import type { PaymentPage, Transaction } from "@/lib/qpp-types";
import { getSupabaseClient } from "@/lib/supabase";

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

// Fetch one page with its custom fields by slug
export async function getPageBySlug(slug: string): Promise<PaymentPage | null> {
  const res = await fetch(`/api/admin/payment-pages/${encodeURIComponent(slug)}`, {
    method: "GET",
  });
  if (res.status === 404) return null;
  const json = await jsonOrThrow<{ page: PaymentPage | null }>(res);
  return json.page ?? null;
}

// Fetch all pages with their custom fields
export async function listPages(): Promise<PaymentPage[]> {
  const res = await fetch("/api/admin/payment-pages", { method: "GET" });
  const json = await jsonOrThrow<{ pages: PaymentPage[] }>(res);
  return json.pages ?? [];
}

// Upsert page, then delete+reinsert its custom fields
export async function savePage(page: PaymentPage): Promise<void> {
  // Try update first; if the page doesn't exist yet, fall back to create.
  const put = await fetch(`/api/admin/payment-pages/${encodeURIComponent(page.slug)}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ page }),
  });
  if (put.status !== 404) {
    await jsonOrThrow<{ page: PaymentPage }>(put);
    return;
  }

  const post = await fetch("/api/admin/payment-pages", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ page }),
  });
  await jsonOrThrow<{ page: PaymentPage }>(post);
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
