'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutForm from './CheckoutForm'; 

// Load Stripe outside of component render to avoid recreating the object
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function PaymentWrapper({ clientSecret, returnUrl }) {
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