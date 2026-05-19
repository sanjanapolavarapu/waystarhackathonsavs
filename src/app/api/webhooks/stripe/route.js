import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import {
  receiptInputFromPaymentIntent,
  sendPaymentReceipt,
} from '@/lib/send-payment-receipt';
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

function paymentMethodLabel(paymentIntent) {
  const types = paymentIntent.payment_method_types;
  if (Array.isArray(types) && types.length) return types.join('+');
  if (paymentIntent.payment_method) return 'card';
  return null;
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

  const headerList = await headers();
  const sig = headerList.get('stripe-signature');

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error(`❌ Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type.startsWith('payment_intent.')) {
    const paymentIntent = event.data.object;
    const txStatus = toTxStatus(paymentIntent.status, event.type);
    const amountDollars = paymentIntent.amount ? paymentIntent.amount / 100 : null;
    const meta = paymentIntent.metadata || {};
    const organization_id = meta.organization_id || null;
    let page_id = meta.page_id || null;
    const page_slug_meta = meta.page_slug || null;

    const supabaseAdmin = getSupabaseAdmin();
    if (supabaseAdmin && !page_id && page_slug_meta) {
      const { data: pr } = await supabaseAdmin
        .from('payment_pages')
        .select('id')
        .eq('slug', page_slug_meta)
        .maybeSingle();
      page_id = pr?.id ? String(pr.id) : null;
    }

    const payer_email =
      (meta.payer_email && String(meta.payer_email).trim()) ||
      paymentIntent.receipt_email ||
      null;
    const pm = paymentMethodLabel(paymentIntent);

    if (supabaseAdmin) {
      const updatePayload = {
        status: txStatus,
        ...(amountDollars != null ? { amount: amountDollars } : {}),
        ...(pm ? { payment_method: pm } : {}),
        ...(organization_id ? { organization_id } : {}),
        ...(page_id ? { page_id } : {}),
        ...(payer_email ? { payer_email } : {}),
      };

      const update = await supabaseAdmin
        .from('transactions')
        .update(updatePayload)
        .eq('stripe_payment_intent_id', paymentIntent.id);

      if (update.error) {
        console.error('Supabase update error:', update.error);
        if (event.type === 'payment_intent.succeeded') {
          const fallback = await supabaseAdmin.from('transactions').insert({
            stripe_payment_intent_id: paymentIntent.id,
            amount: amountDollars ?? 0,
            status: txStatus,
            organization_id: organization_id || null,
            page_id: page_id || null,
            payer_email,
            payment_method: pm,
          });
          if (fallback.error) console.error('Supabase fallback insert error:', fallback.error);
        }
      }
    } else {
      console.warn("Supabase env missing; skipping webhook persistence.");
    }

    if (event.type === 'payment_intent.succeeded') {
      const receiptInput = receiptInputFromPaymentIntent(paymentIntent);
      if (receiptInput?.payerEmail) {
        const emailResult = await sendPaymentReceipt(receiptInput);
        if (!emailResult.ok) {
          console.error('Receipt email failed:', emailResult.error);
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
