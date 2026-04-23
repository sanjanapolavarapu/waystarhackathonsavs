import { NextResponse } from "next/server";

import { getStripeServer } from "@/lib/stripe";

export async function GET(req: Request) {
  const stripe = getStripeServer();
  if (!stripe) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 500 });
  }

  const url = new URL(req.url);
  const pi = url.searchParams.get("pi")?.trim() ?? "";
  if (!pi) {
    return NextResponse.json({ error: "missing_payment_intent" }, { status: 400 });
  }

  try {
    const intent = await stripe.paymentIntents.retrieve(pi, { expand: ["latest_charge"] });
    const charge = (intent.latest_charge ?? null) as
      | (import("stripe").Stripe.Charge & { payment_method_details?: unknown })
      | null;

    return NextResponse.json({
      paymentIntent: {
        id: intent.id,
        status: intent.status,
        amount: intent.amount,
        amount_received: intent.amount_received,
        currency: intent.currency,
        created: intent.created,
        receipt_email: intent.receipt_email,
        payment_method_types: intent.payment_method_types,
        // best-effort summary for UI (may be null depending on method)
        charge: charge
          ? {
              id: charge.id,
              status: charge.status,
              billing_details: charge.billing_details,
              payment_method_details: charge.payment_method_details ?? null,
            }
          : null,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "stripe_retrieve_failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

