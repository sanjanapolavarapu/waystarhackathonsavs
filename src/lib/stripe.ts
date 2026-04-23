import Stripe from "stripe";

export function getStripeServer() {
  const key = process.env.STRIPE_SECRET_KEY;
  // IMPORTANT: don't throw at import-time / build-time.
  // API routes should handle missing env vars gracefully.
  if (!key) return null;
  return new Stripe(key, {
    apiVersion: "2026-03-25.dahlia",
    typescript: true,
  });
}

