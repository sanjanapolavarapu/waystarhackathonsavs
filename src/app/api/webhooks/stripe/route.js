import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req) {
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

  // Handle the specific event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    
    // Stripe amounts are in cents, so we divide by 100 for the log
    console.log(`💰 Payment Succeeded for: $${paymentIntent.amount / 100}`);

    // TODO: Connect this to Supabase later to update your 'Revenue Collected' card
  }

  return NextResponse.json({ received: true });
}