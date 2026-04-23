import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getStripeServer } from '@/lib/stripe';

export async function POST(request) {
  try {
    const stripe = getStripeServer();
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured on server." },
        { status: 500 },
      );
    }

    const body = await request.json();
    const { amount, payerEmail, pageSlug } = body;

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount.' }, { status: 400 });
    }
    if (typeof pageSlug !== "string" || !pageSlug.trim()) {
      return NextResponse.json({ error: "Missing pageSlug." }, { status: 400 });
    }

    const slugTrim = pageSlug.trim();

    let pageId = null;
    let organizationId = null;
    let primaryGl = null;

    const supabaseAdmin = getSupabaseAdmin();
    if (supabaseAdmin) {
      const { data: pageRow } = await supabaseAdmin
        .from("payment_pages")
        .select("id, organization_id, gl_codes")
        .eq("slug", slugTrim)
        .maybeSingle();
      pageId = pageRow?.id ?? null;
      organizationId = pageRow?.organization_id ?? null;
      const gcs = pageRow?.gl_codes;
      primaryGl = Array.isArray(gcs) && gcs.length ? String(gcs[0]) : null;
    }

    const metadata = {
      payer_email: payerEmail ? String(payerEmail) : '',
      page_slug: slugTrim,
      ...(pageId ? { page_id: String(pageId) } : {}),
      ...(organizationId ? { organization_id: String(organizationId) } : {}),
    };

    const piCreate = {
      amount,
      currency: 'usd',
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    };
    if (typeof payerEmail === 'string' && payerEmail.trim()) {
      piCreate.receipt_email = payerEmail.trim();
    }

    const paymentIntent = await stripe.paymentIntents.create(piCreate);

    const amountDollars = paymentIntent.amount ? paymentIntent.amount / 100 : amount / 100;

    const baseRow = {
      amount: amountDollars,
      status: paymentIntent.status,
      stripe_payment_intent_id: paymentIntent.id,
      payer_email: payerEmail ?? null,
      ...(pageId ? { page_id: pageId } : {}),
      ...(organizationId ? { organization_id: organizationId } : {}),
      ...(primaryGl ? { gl_code: primaryGl } : {}),
    };

    if (supabaseAdmin) {
      const richUpsert = await supabaseAdmin
        .from('transactions')
        .upsert(baseRow, { onConflict: 'stripe_payment_intent_id' });

      if (richUpsert.error) {
        const slimRow = {
          amount: amountDollars,
          status: paymentIntent.status,
          ...(pageId ? { page_id: pageId } : {}),
          ...(organizationId ? { organization_id: organizationId } : {}),
        };
        const fallbackInsert = await supabaseAdmin.from('transactions').insert(slimRow);
        if (fallbackInsert.error) {
          console.error('Supabase insert error:', fallbackInsert.error);
        } else {
          console.warn('Supabase schema missing Stripe columns; inserted minimal row.');
        }
      }
    } else {
      console.warn("Supabase env missing; skipping transaction persistence.");
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });

  } catch (error) {
    console.error("Stripe Error:", error);
    return NextResponse.json(
      { error: "Failed to initialize payment." },
      { status: 500 }
    );
  }
}
