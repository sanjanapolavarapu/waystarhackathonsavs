import type { PaymentPage } from "@/lib/qpp-types";

// This repo's UI uses the `PaymentPage` shape, but your Supabase table can vary.
// We map between the UI model and the existing `payment_pages` schema your team uses.

type AnyRow = Record<string, unknown>;

function pick<T>(row: AnyRow, keys: string[]): T | undefined {
  for (const k of keys) {
    if (row[k] !== undefined) return row[k] as T;
  }
  return undefined;
}

export function fromPaymentPagesRow(row: AnyRow): PaymentPage | null {
  const slug = pick<string>(row, ["slug"]);
  if (!slug) return null;

  const id = pick<string>(row, ["id"]) ?? slug;
  const isActive = pick<boolean>(row, ["is_active", "isActive"]) ?? true;

  const title = pick<string>(row, ["title"]) ?? slug;
  const subtitle = pick<string>(row, ["subtitle"]) ?? pick<string>(row, ["description"]);
  const brandColor =
    pick<string>(row, ["brand_color", "brandColor"]) ??
    pick<string>(row, ["branding_color", "brandingColor"]) ??
    "#0EA5E9";
  const logoUrl = pick<string>(row, ["logo_url", "logoUrl"]);
  const headerMessage = pick<string>(row, ["header_message", "headerMessage"]);
  const footerMessage = pick<string>(row, ["footer_message", "footerMessage"]);

  const rawAmountMode = pick<string>(row, ["amount_mode", "amountMode"]) ?? "fixed";
  const amountMode: PaymentPage["amountMode"] =
    rawAmountMode === "fixed" || rawAmountMode === "FIXED"
      ? "FIXED"
      : rawAmountMode === "range" || rawAmountMode === "RANGE"
        ? "RANGE"
        : "USER_ENTERED";

  const fixedAmount = pick<number | string>(row, ["fixed_amount", "fixedAmount"]);
  const minAmount = pick<number | string>(row, ["min_amount", "minAmount"]);
  const maxAmount = pick<number | string>(row, ["max_amount", "maxAmount"]);

  const fixedAmountCents =
    fixedAmount == null ? undefined : Math.round(Number(fixedAmount) * 100);
  const minAmountCents =
    minAmount == null ? undefined : Math.round(Number(minAmount) * 100);
  const maxAmountCents =
    maxAmount == null ? undefined : Math.round(Number(maxAmount) * 100);

  const glCodes = (pick<string[] | null>(row, ["gl_codes", "glCodes"]) ?? []) as string[];
  const glCodeSingle = pick<string>(row, ["gl_code", "glCode"]);
  const allGlCodes = glCodeSingle ? Array.from(new Set([glCodeSingle, ...glCodes])) : glCodes;

  const emailSubjectTemplate =
    pick<string>(row, ["email_subject", "emailSubject"]) ??
    "Payment Confirmation";
  const emailBodyTemplate =
    pick<string>(row, ["email_template", "emailTemplate"]) ??
    undefined;

  // Your current `payment_pages` schema doesn’t include a JSON fields column.
  // If your team stores fields in a separate table, we’ll load them elsewhere.
  const fields = [] as PaymentPage["fields"];

  const createdAt =
    pick<string>(row, ["created_at", "createdAt"]) ?? new Date().toISOString();
  const updatedAt =
    pick<string>(row, ["updated_at", "updatedAt"]) ?? createdAt;

  return {
    id,
    slug,
    isActive,
    title,
    subtitle,
    brandColor,
    logoUrl,
    headerMessage,
    footerMessage,
    amountMode,
    fixedAmountCents,
    minAmountCents,
    maxAmountCents,
    glCodes: allGlCodes,
    emailSubjectTemplate,
    emailBodyTemplate,
    fields,
    createdAt,
    updatedAt,
  };
}

export function toPaymentPagesRow(page: PaymentPage) {
  const amount_mode =
    page.amountMode === "FIXED"
      ? "fixed"
      : page.amountMode === "RANGE"
        ? "range"
        : "user_entered";

  return {
    slug: page.slug,
    is_active: page.isActive,
    title: page.title,
    subtitle: page.subtitle ?? null,
    description: page.subtitle ?? null,
    branding_color: page.brandColor,
    logo_url: page.logoUrl ?? null,
    header_message: page.headerMessage ?? null,
    footer_message: page.footerMessage ?? null,
    amount_mode,
    fixed_amount: page.fixedAmountCents != null ? page.fixedAmountCents / 100 : null,
    min_amount: page.minAmountCents != null ? page.minAmountCents / 100 : null,
    max_amount: page.maxAmountCents != null ? page.maxAmountCents / 100 : null,
    gl_codes: page.glCodes ?? [],
    email_subject: page.emailSubjectTemplate ?? null,
    email_template: page.emailBodyTemplate ?? null,
    updated_at: new Date().toISOString(),
  };
}

