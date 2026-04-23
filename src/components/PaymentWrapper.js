'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutForm from './CheckoutForm'; 

// Load Stripe outside of component render to avoid recreating the object
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise =
  typeof stripePublishableKey === 'string' && stripePublishableKey.trim().length > 0
    ? loadStripe(stripePublishableKey)
    : null;

export default function PaymentWrapper({ clientSecret, returnUrl }) {
  if (!stripePromise) {
    return (
      <div
        className="text-red-600 text-sm mt-2 font-medium bg-red-50 p-3 rounded-md border border-red-200"
        role="alert"
      >
        Stripe checkout is not configured. Set <span className="font-mono">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</span>.
      </div>
    );
  }

  const options = {
    clientSecret: clientSecret,
    appearance: {
      theme: 'stripe', // P1 can customize this later to match QPP branding!
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm returnUrl={returnUrl} />
    </Elements>
  );
}