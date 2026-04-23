import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getStripeServer } from '@/lib/stripe';

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

function toTxStatus(stripeStatus, eventType) {
  const s = String(stripeStatus ?? '').toLowerCase();
  if (eventType === 'payment_intent.succeeded') return 'succeeded';
  if (eventType === 'payment_intent.payment_failed') return 'failed';
  if (eventType === 'payment_intent.canceled') return 'canceled';
  if (s) return s;
  return 'unknown';
}

export async function POST(req) {
  const stripe = getStripeServer();
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured on server." },
      { status: 500 },
    );
  }

  const body = await req.text();
  
  // FIX: Await the headers before calling .get()
  const headerList = await headers();
  const sig = headerList.get('stripe-signature');

  let event;

  try {
    // Verify that the event actually came from Stripe
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error(`❌ Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Update Supabase transaction status based on Stripe event.
  // Note: We only rely on the PaymentIntent id; the row is created during
  // /api/create-payment-intent, and then finalized here.
  if (event.type.startsWith('payment_intent.')) {
    const paymentIntent = event.data.object;
    const txStatus = toTxStatus(paymentIntent.status, event.type);
    const amountDollars = paymentIntent.amount ? paymentIntent.amount / 100 : null;

    const supabaseAdmin = getSupabaseAdmin();
    if (supabaseAdmin) {
      const update = await supabaseAdmin
        .from('transactions')
        .update({
          status: txStatus,
          ...(amountDollars != null ? { amount: amountDollars } : {}),
        })
        .eq('stripe_payment_intent_id', paymentIntent.id);

      if (update.error) {
        // If the schema doesn't have stripe_payment_intent_id yet, fall back to inserting
        // a minimal row so analytics still reflect succeeded payments.
        console.error('Supabase update error:', update.error);
        if (event.type === 'payment_intent.succeeded') {
          const fallback = await supabaseAdmin.from('transactions').insert({
            amount: amountDollars ?? 0,
            status: txStatus,
          });
          if (fallback.error) console.error('Supabase fallback insert error:', fallback.error);
        }
      }
    } else {
      console.warn("Supabase env missing; skipping webhook persistence.");
    }
  }

  return NextResponse.json({ received: true });
}