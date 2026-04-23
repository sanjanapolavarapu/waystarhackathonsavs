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
    // amount must be in CENTS (e.g., $25.00 = 2500)
    const { amount, payerEmail, pageSlug } = body; 

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount.' }, { status: 400 });
    }
    if (typeof pageSlug !== "string" || !pageSlug.trim()) {
      return NextResponse.json({ error: "Missing pageSlug." }, { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, 
      currency: 'usd',
      receipt_email: payerEmail, // Hits the email confirmation stretch goal!
      metadata: {
        payer_email: payerEmail ?? '',
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Persist a transaction row in Supabase so analytics cards can update.
    // We try a "rich" upsert first; if your schema doesn't have these columns yet,
    // we fall back to only the columns we know are queried in the UI.
    const amountDollars = paymentIntent.amount ? paymentIntent.amount / 100 : amount / 100;
    let pageId = null;
    let organizationId = null;

    const supabaseAdmin = getSupabaseAdmin();
    if (supabaseAdmin) {
      const { data: pageRow } = await supabaseAdmin
        .from("payment_pages")
        .select("id, organization_id")
        .eq("slug", pageSlug)
        .maybeSingle();
      pageId = pageRow?.id ?? null;
      organizationId = pageRow?.organization_id ?? null;
    }
    const baseRow = {
      amount: amountDollars,
      status: paymentIntent.status,
      page_slug: pageSlug,
      ...(pageId ? { page_id: pageId } : {}),
      ...(organizationId ? { organization_id: organizationId } : {}),
    };

    const richRow = {
      ...baseRow,
      stripe_payment_intent_id: paymentIntent.id,
      payer_email: payerEmail ?? null,
      currency: paymentIntent.currency ?? 'usd',
    };

    if (supabaseAdmin) {
      const richUpsert = await supabaseAdmin
        .from('transactions')
        .upsert(richRow, { onConflict: 'stripe_payment_intent_id' });

      if (richUpsert.error) {
        const fallbackInsert = await supabaseAdmin.from('transactions').insert(baseRow);
        if (fallbackInsert.error) {
          console.error('Supabase insert error:', fallbackInsert.error);
        } else {
          console.warn('Supabase schema missing Stripe columns; inserted minimal row.');
        }
      }
    } else {
      console.warn("Supabase env missing; skipping transaction persistence.");
    }

    // Return the secret to the frontend so it can render the form
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