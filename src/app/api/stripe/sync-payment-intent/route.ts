import { NextResponse } from "next/server";

import {
  receiptInputFromPaymentIntent,
  sendPaymentReceipt,
} from "@/lib/send-payment-receipt";
import { getStripeServer } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

function mapTxStatus(stripeStatus: string | undefined) {
  const s = String(stripeStatus ?? "").toLowerCase();
  if (s === "succeeded") return "succeeded";
  if (s === "processing" || s === "requires_capture") return s;
  if (s === "requires_payment_method" || s === "requires_confirmation" || s === "requires_action")
    return s;
  if (s === "canceled") return "canceled";
  if (s === "payment_failed") return "failed";
  return s || "unknown";
}

/**
 * After Stripe redirects to /pay/success, the client calls this so `transactions`
 * reflects the final PaymentIntent status even when webhooks are not configured (local dev).
 */
export async function POST(req: Request) {
  const stripe = getStripeServer();
  const admin = getSupabaseAdmin();
  if (!stripe || !admin) {
    return NextResponse.json({ ok: false, error: "stripe_or_db_unconfigured" }, { status: 503 });
  }

  const body = (await req.json().catch(() => null)) as { paymentIntentId?: string } | null;
  const piId = typeof body?.paymentIntentId === "string" ? body.paymentIntentId.trim() : "";
  if (!piId || !piId.startsWith("pi_")) {
    return NextResponse.json({ ok: false, error: "invalid_payment_intent_id" }, { status: 400 });
  }

  let pi;
  try {
    pi = await stripe.paymentIntents.retrieve(piId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "retrieve_failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }

  const meta = (pi.metadata ?? {}) as Record<string, string>;
  const page_slug_meta = meta.page_slug?.trim() || null;
  const organization_idRaw = meta.organization_id?.trim();
  const page_idRaw = meta.page_id?.trim();
  const organization_id = organization_idRaw || null;
  let resolved_page_id = page_idRaw || null;

  if (!resolved_page_id && page_slug_meta) {
    const { data: pr } = await admin
      .from("payment_pages")
      .select("id")
      .eq("slug", page_slug_meta)
      .maybeSingle();
    resolved_page_id = pr?.id ? String(pr.id) : null;
  }

  const payer_email =
    (meta.payer_email && String(meta.payer_email).trim()) || pi.receipt_email || null;
  const amountDollars = pi.amount != null ? pi.amount / 100 : 0;
  const txStatus = mapTxStatus(pi.status);
  const types = pi.payment_method_types;
  const pm =
    Array.isArray(types) && types.length > 0
      ? types.join("+")
      : pi.payment_method
        ? "card"
        : null;

  let primaryGl: string | null = null;
  if (page_slug_meta) {
    const { data: pageRow } = await admin
      .from("payment_pages")
      .select("gl_codes")
      .eq("slug", page_slug_meta)
      .maybeSingle();
    const gcs = pageRow?.gl_codes as unknown;
    primaryGl = Array.isArray(gcs) && gcs.length ? String(gcs[0]) : null;
  }

  const { data: existing } = await admin
    .from("transactions")
    .select("id")
    .eq("stripe_payment_intent_id", piId)
    .maybeSingle();

  const baseUpdate = {
    status: txStatus,
    amount: amountDollars,
    ...(pm ? { payment_method: pm } : {}),
    ...(organization_id ? { organization_id } : {}),
    ...(resolved_page_id ? { page_id: resolved_page_id } : {}),
    ...(payer_email ? { payer_email } : {}),
    ...(primaryGl ? { gl_code: primaryGl } : {}),
  };

  if (existing?.id) {
    const { error } = await admin.from("transactions").update(baseUpdate).eq("stripe_payment_intent_id", piId);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
  } else {
    const { error } = await admin.from("transactions").insert({
      stripe_payment_intent_id: piId,
      ...baseUpdate,
    });
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
  }

  let receipt:
    | { sent: true; emailPreviewUrl: string | null; alreadySent?: boolean }
    | { sent: false; error: string }
    | null = null;

  if (txStatus === "succeeded") {
    const receiptInput = receiptInputFromPaymentIntent(pi);
    if (receiptInput?.payerEmail) {
      const emailResult = await sendPaymentReceipt(receiptInput);
      if (emailResult.ok) {
        receipt = {
          sent: true,
          emailPreviewUrl: emailResult.emailPreviewUrl,
          alreadySent: emailResult.alreadySent,
        };
      } else {
        receipt = { sent: false, error: emailResult.error };
      }
    } else {
      receipt = { sent: false, error: "missing_payer_email" };
    }
  }

  return NextResponse.json({ ok: true, status: txStatus, receipt });
}
