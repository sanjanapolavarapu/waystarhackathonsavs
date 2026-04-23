import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with your secret key from .env.local
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const body = await request.json();
    // amount must be in CENTS (e.g., $25.00 = 2500)
    const { amount, payerEmail } = body; 

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, 
      currency: 'usd',
      receipt_email: payerEmail, // Hits the email confirmation stretch goal!
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Return the secret to the frontend so it can render the form
    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
    
  } catch (error) {
    console.error("Stripe Error:", error);
    return NextResponse.json(
      { error: "Failed to initialize payment." }, 
      { status: 500 }
    );
  }
}