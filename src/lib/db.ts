import { supabase } from "@/lib/supabase";
import type { CustomField, PaymentPage, Transaction } from "@/lib/qpp-types";

type PaymentPageRow = {
  id: string;
  slug: string;
  is_active: boolean;
  title: string;
  description?: string | null;
  branding_color: string;
  logo_url?: string | null;
  header_message?: string | null;
  footer_message?: string | null;
  amount_mode: PaymentPage["amountMode"];
  fixed_amount?: number | null;
  min_amount?: number | null;
  max_amount?: number | null;
  gl_codes?: string[] | null;
  email_subject?: string | null;
  email_template?: string | null;
  updated_at?: string | null;
  created_at: string;
};

type CustomFieldRow = {
  id: string;
  page_id: string;
  field_name: string;
  field_type: CustomField["type"];
  is_required: boolean;
  placeholder?: string | null;
  helperText?: string | null;
  options?: string[] | null;
  display_order: number;
  created_at?: string;
};

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }
  return supabase;
}

function dollarsToCents(value?: number | null) {
  if (value == null) return undefined;
  return Math.round(value * 100);
}

function centsToDollars(value?: number) {
  if (value == null) return null;
  return value / 100;
}

function mapPageRowToPaymentPage(row: PaymentPageRow, fields: CustomFieldRow[]): PaymentPage {
  return {
    id: row.id,
    slug: row.slug,
    isActive: row.is_active,
    title: row.title,
    subtitle: row.description ?? undefined,
    brandColor: row.branding_color,
    logoUrl: row.logo_url ?? undefined,
    headerMessage: row.header_message ?? undefined,
    footerMessage: row.footer_message ?? undefined,
    amountMode: row.amount_mode,
    fixedAmountCents: dollarsToCents(row.fixed_amount),
    minAmountCents: dollarsToCents(row.min_amount),
    maxAmountCents: dollarsToCents(row.max_amount),
    glCodes: row.gl_codes ?? [],
    emailSubjectTemplate: row.email_subject ?? undefined,
    emailBodyTemplate: row.email_template ?? undefined,
    fields: fields
      .map(
        (field) =>
          ({
            id: field.id,
            label: field.field_name,
            type: field.field_type,
            required: field.is_required,
            placeholder: field.placeholder ?? undefined,
            helperText: field.helperText ?? undefined,
            options: field.options ?? [],
            order: field.display_order,
            createdAt: field.created_at,
          }) as CustomField,
      )
      .sort((a, b) => a.order - b.order),
    updatedAt: row.updated_at ?? row.created_at,
    createdAt: row.created_at,
  };
}

function mapPageToRow(page: PaymentPage) {
  return {
    id: page.id,
    slug: page.slug,
    is_active: page.isActive,
    title: page.title,
    description: page.subtitle ?? null,
    branding_color: page.brandColor,
    logo_url: page.logoUrl ?? null,
    header_message: page.headerMessage ?? null,
    footer_message: page.footerMessage ?? null,
    amount_mode: page.amountMode,
    fixed_amount: centsToDollars(page.fixedAmountCents),
    min_amount: centsToDollars(page.minAmountCents),
    max_amount: centsToDollars(page.maxAmountCents),
    gl_codes: page.glCodes,
    email_subject: page.emailSubjectTemplate ?? null,
    email_template: page.emailBodyTemplate ?? null,
    created_at: page.createdAt,
  };
}

function mapFieldToRow(field: CustomField & { createdAt?: string }, pageId: string): CustomFieldRow {
  return {
    id: field.id,
    page_id: pageId,
    field_name: field.label,
    field_type: field.type,
    is_required: field.required,
    placeholder: field.placeholder ?? null,
    helperText: field.helperText ?? null,
    options: field.options ?? [],
    display_order: field.order,
    created_at: field.createdAt,
  };
}

// Fetch one page with its custom fields by slug
export async function getPageBySlug(slug: string): Promise<PaymentPage | null> {
  const client = requireSupabase();

  const { data: pageRow, error: pageError } = await client
    .from("payment_pages")
    .select("*")
    .eq("slug", slug)
    .maybeSingle<PaymentPageRow>();

  if (pageError) throw pageError;
  if (!pageRow) return null;

  const { data: fieldRows, error: fieldsError } = await client
    .from("custom_fields")
    .select("*")
    .eq("page_id", pageRow.id)
    .order("display_order", { ascending: true })
    .returns<CustomFieldRow[]>();

  if (fieldsError) throw fieldsError;

  return mapPageRowToPaymentPage(pageRow, fieldRows ?? []);
}

// Fetch all pages with their custom fields
export async function listPages(): Promise<PaymentPage[]> {
  const client = requireSupabase();

  const { data: pageRows, error: pagesError } = await client
    .from("payment_pages")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<PaymentPageRow[]>();
  if (pagesError) throw pagesError;

  const { data: fieldRows, error: fieldsError } = await client
    .from("custom_fields")
    .select("*")
    .order("display_order", { ascending: true })
    .returns<CustomFieldRow[]>();
  if (fieldsError) throw fieldsError;

  const fieldsByPageId = new Map<string, CustomFieldRow[]>();
  for (const field of fieldRows ?? []) {
    const existing = fieldsByPageId.get(field.page_id) ?? [];
    existing.push(field);
    fieldsByPageId.set(field.page_id, existing);
  }

  return (pageRows ?? []).map((row) => mapPageRowToPaymentPage(row, fieldsByPageId.get(row.id) ?? []));
}

// Upsert page, then delete+reinsert its custom fields
export async function savePage(page: PaymentPage): Promise<void> {
  const client = requireSupabase();

  const { error: upsertError } = await client.from("payment_pages").upsert(mapPageToRow(page));
  if (upsertError) throw upsertError;

  const { error: deleteError } = await client.from("custom_fields").delete().eq("page_id", page.id);
  if (deleteError) throw deleteError;

  const rows = page.fields.map((field) => mapFieldToRow(field, page.id));
  if (rows.length > 0) {
    const { error: insertError } = await client.from("custom_fields").insert(rows);
    if (insertError) throw insertError;
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
