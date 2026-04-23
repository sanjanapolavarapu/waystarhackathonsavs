import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getStripeServer } from '@/lib/stripe';
import { sendEmail } from '@/lib/email';
import { DEFAULT_EMAIL_SUBJECT, DEFAULT_EMAIL_TEMPLATE, parseEmailTemplate } from '@/lib/email-template';

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

function toTxStatus(stripeStatus, eventType) {
  const s = String(stripeStatus ?? '').toLowerCase();
  if (eventType === 'payment_intent.succeeded') return 'succeeded';
  if (eventType === 'payment_intent.payment_failed') return 'failed';
  if (eventType === 'payment_intent.canceled') return 'canceled';
  if (s) return s;
  return 'unknown';
}

function centsToUsd(amount) {
  const n = Number(amount ?? 0);
  return Number.isFinite(n) ? n / 100 : 0;
}

function fmtMoneyUsd(amount) {
  const n = Number(amount ?? 0);
  if (!Number.isFinite(n)) return '$0.00';
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

function getPayerEmail(paymentIntent) {
  const direct = paymentIntent?.receipt_email || paymentIntent?.metadata?.payer_email;
  if (typeof direct === 'string' && direct.trim()) return direct.trim();

  const charges = paymentIntent?.charges?.data;
  if (Array.isArray(charges) && charges.length) {
    const charge = charges[0];
    const email =
      charge?.billing_details?.email ||
      charge?.receipt_email ||
      charge?.payment_method_details?.card?.billing_details?.email;
    if (typeof email === 'string' && email.trim()) return email.trim();
  }

  return null;
}

async function getPageEmailConfig({ supabaseAdmin, pageSlug }) {
  if (!supabaseAdmin || !pageSlug) return null;
  const res = await supabaseAdmin
    .from('payment_pages')
    .select('title, email_subject, email_template')
    .eq('slug', pageSlug)
    .maybeSingle();
  if (res.error || !res.data) return null;
  return {
    title: res.data.title || 'Payment Page',
    subject: res.data.email_subject || DEFAULT_EMAIL_SUBJECT,
    template: res.data.email_template || DEFAULT_EMAIL_TEMPLATE,
  };
}

async function sendReceiptEmail({ supabaseAdmin, paymentIntent }) {
  const to = getPayerEmail(paymentIntent);
  if (!to) return { ok: false, reason: 'missing_email' };

  const pageSlug = String(paymentIntent?.metadata?.page_slug ?? '').trim();
  const pageCfg = await getPageEmailConfig({ supabaseAdmin, pageSlug });

  const amountText = fmtMoneyUsd(centsToUsd(paymentIntent?.amount_received ?? paymentIntent?.amount ?? 0));
  const createdAt = paymentIntent?.created
    ? new Date(paymentIntent.created * 1000)
    : new Date();
  const title = pageCfg?.title || 'Payment';
  const subject = pageCfg?.subject || DEFAULT_EMAIL_SUBJECT;
  const template = pageCfg?.template || DEFAULT_EMAIL_TEMPLATE;

  const body = parseEmailTemplate(template, {
    payer_name: 'Customer',
    amount: amountText,
    transaction_id: String(paymentIntent?.id ?? ''),
    date: createdAt.toLocaleDateString(),
    title,
    custom_fields: {},
  });

  await sendEmail({
    to,
    subject,
    html: body.replaceAll('\n', '<br />'),
  });

  return { ok: true };
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

    if (event.type === 'payment_intent.succeeded') {
      try {
        await sendReceiptEmail({ supabaseAdmin: getSupabaseAdmin(), paymentIntent });
      } catch (e) {
        console.error('Receipt email send failed:', e?.message || e);
        // Don't fail the webhook for email issues.
      }
    }
  }

  return NextResponse.json({ received: true });
}