import { randomUUID } from "node:crypto";

import {
  DEFAULT_EMAIL_SUBJECT,
  DEFAULT_EMAIL_TEMPLATE,
  parseEmailTemplate,
} from "@/lib/email-template";
import { sendEmail } from "@/lib/email";
import { getPageBySlug } from "@/lib/mock-qpp";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getStripeServer } from "@/lib/stripe";

export type SendPaymentReceiptInput = {
  pageSlug: string;
  amountDollars: number;
  payerName: string;
  payerEmail: string;
  paymentMethod?: "card" | "wallet" | "ach";
  customResponses?: Record<string, string>;
  transactionId?: string;
  /** When set, skips send if Stripe metadata already has qpp_receipt_sent=1 */
  paymentIntentId?: string;
};

export type SendPaymentReceiptResult =
  | { ok: true; transactionId: string; emailPreviewUrl: string | null; alreadySent?: boolean }
  | { ok: false; error: string; transactionId?: string };

type PageConfig = {
  id?: string;
  title: string;
  glCodes: string[];
  emailSubject: string;
  emailTemplate: string;
};

async function getPageConfig(pageSlug: string): Promise<PageConfig | null> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const result = await supabase
      .from("payment_pages")
      .select("id, title, gl_codes, email_subject, email_template, gl_code")
      .eq("slug", pageSlug)
      .maybeSingle();

    if (result.data) {
      const glCodesFromArray = Array.isArray(result.data.gl_codes) ? result.data.gl_codes : [];
      const legacyGlCode = typeof result.data.gl_code === "string" ? result.data.gl_code : "";

      return {
        id: result.data.id ?? undefined,
        title: result.data.title ?? "Payment Page",
        glCodes: glCodesFromArray.length > 0 ? glCodesFromArray : legacyGlCode ? [legacyGlCode] : [],
        emailSubject: result.data.email_subject || DEFAULT_EMAIL_SUBJECT,
        emailTemplate: result.data.email_template || DEFAULT_EMAIL_TEMPLATE,
      };
    }
  }

  const mock = getPageBySlug(pageSlug);
  if (!mock) return null;
  return {
    title: mock.title,
    glCodes: mock.glCodes,
    emailSubject: mock.emailSubjectTemplate || DEFAULT_EMAIL_SUBJECT,
    emailTemplate: mock.emailBodyTemplate || DEFAULT_EMAIL_TEMPLATE,
  };
}

async function markReceiptSent(paymentIntentId: string) {
  const stripe = getStripeServer();
  if (!stripe) return;
  try {
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    const meta = (pi.metadata ?? {}) as Record<string, string>;
    if (meta.qpp_receipt_sent === "1") return;
    await stripe.paymentIntents.update(paymentIntentId, {
      metadata: { ...meta, qpp_receipt_sent: "1" },
    });
  } catch {
    /* best-effort */
  }
}

async function wasReceiptAlreadySent(paymentIntentId: string): Promise<boolean> {
  const stripe = getStripeServer();
  if (!stripe) return false;
  try {
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    return (pi.metadata ?? {}).qpp_receipt_sent === "1";
  } catch {
    return false;
  }
}

function parseCustomResponsesFromMetadata(meta: Record<string, string>): Record<string, string> {
  const raw = meta.custom_responses?.trim();
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>)
        .filter(([, v]) => typeof v === "string")
        .map(([k, v]) => [k, v as string]),
    );
  } catch {
    return {};
  }
}

/** Build receipt input from a Stripe PaymentIntent (redirect / webhook paths). */
export function receiptInputFromPaymentIntent(pi: {
  id: string;
  amount: number | null;
  receipt_email?: string | null;
  metadata?: Record<string, string> | null;
}): SendPaymentReceiptInput | null {
  const meta = (pi.metadata ?? {}) as Record<string, string>;
  const pageSlug = meta.page_slug?.trim();
  if (!pageSlug) return null;

  const payerEmail =
    (meta.payer_email && String(meta.payer_email).trim()) ||
    (pi.receipt_email && String(pi.receipt_email).trim()) ||
    "";

  return {
    pageSlug,
    amountDollars: pi.amount != null ? pi.amount / 100 : 0,
    payerName: meta.payer_name?.trim() || "Customer",
    payerEmail,
    paymentMethod: "card",
    customResponses: parseCustomResponsesFromMetadata(meta),
    paymentIntentId: pi.id,
  };
}

export async function sendPaymentReceipt(
  input: SendPaymentReceiptInput,
): Promise<SendPaymentReceiptResult> {
  const payerEmail = input.payerEmail.trim();
  if (!payerEmail) {
    return { ok: false, error: "missing_payer_email" };
  }

  if (input.paymentIntentId && (await wasReceiptAlreadySent(input.paymentIntentId))) {
    return {
      ok: true,
      transactionId: input.transactionId ?? input.paymentIntentId,
      emailPreviewUrl: null,
      alreadySent: true,
    };
  }

  const pageConfig = await getPageConfig(input.pageSlug);
  if (!pageConfig) {
    return { ok: false, error: "page_not_found" };
  }

  const transactionId = input.transactionId ?? randomUUID();
  const now = new Date();
  const amountText = input.amountDollars.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });
  const customResponses = input.customResponses ?? {};
  const normalizedCustomFields = Object.fromEntries(
    Object.entries(customResponses).map(([k, v]) => [
      k.toLowerCase().trim().replaceAll(/\s+/g, "_"),
      v,
    ]),
  );

  const subject = pageConfig.emailSubject || DEFAULT_EMAIL_SUBJECT;
  const parsedBody = parseEmailTemplate(pageConfig.emailTemplate || DEFAULT_EMAIL_TEMPLATE, {
    payer_name: input.payerName,
    amount: amountText,
    transaction_id: transactionId,
    date: now.toLocaleDateString(),
    title: pageConfig.title,
    custom_fields: normalizedCustomFields,
  });

  const emailResult = await sendEmail({
    to: payerEmail,
    subject,
    html: parsedBody.replaceAll("\n", "<br />"),
  }).catch((error) => ({
    error: error instanceof Error ? error.message : "email_failed",
  }));

  if ("error" in emailResult) {
    return { ok: false, error: emailResult.error, transactionId };
  }

  if (input.paymentIntentId) {
    await markReceiptSent(input.paymentIntentId);
  }

  return {
    ok: true,
    transactionId,
    emailPreviewUrl: emailResult.previewUrl ?? null,
  };
}
