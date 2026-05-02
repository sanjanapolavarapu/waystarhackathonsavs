'use client';

import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import confetti from 'canvas-confetti';

export default function CheckoutForm({ returnUrl }) {
  const stripe = useStripe();
  const elements = useElements();

  const [message, setMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setMessage(null);

    // Confirm payment but only redirect when required (3DS, bank auth, etc).
    // This lets us show a fun success moment for instant-confirm methods.
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: returnUrl || `${window.location.origin}/pay/success`,
      },
    });

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message);
      } else {
        setMessage("An unexpected error occurred.");
      }
      setIsProcessing(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      setIsSuccess(true);
      setMessage("Payment successful! Redirecting…");

      confetti({
        particleCount: 160,
        spread: 80,
        startVelocity: 36,
        origin: { y: 0.65 },
        colors: ['#8b5cf6', '#10b981', '#3b82f6', '#0ea5e9'],
      });

      setTimeout(() => {
        // Best-effort: finalize transaction + email receipt (hackathon flow).
        try {
          const raw = window.sessionStorage.getItem("qpp_pending_payment");
          if (raw) {
            const payload = JSON.parse(raw);
            window.sessionStorage.removeItem("qpp_pending_payment");
            void fetch("/api/payments/complete", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(payload),
            });
          }
        } catch {
          // ignore
        }

        const base = returnUrl || `${window.location.origin}/pay/success`;
        const url = new URL(base, window.location.origin);
        url.searchParams.set("pi", paymentIntent.id);
        window.location.assign(url.toString());
      }, 1200);
      return;
    }

    // For any non-redirected non-succeeded state, send the user to the success page
    // which can show a consistent post-payment UX (and Stripe will prevent false positives).
    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-md mx-auto w-full">
      <PaymentElement id="payment-element" />
      
      <button 
        disabled={isProcessing || isSuccess || !stripe || !elements} 
        id="submit"
        className={[
          "bg-blue-600 text-white py-3 px-4 rounded-md font-semibold disabled:opacity-50 mt-4 transition-colors hover:bg-blue-700 w-full",
          isSuccess ? "scale-[1.01]" : "",
        ].join(" ")}
      >
        <span id="button-text">
          {isSuccess ? "Confirmed!" : isProcessing ? "Processing..." : "Pay Now"}
        </span>
      </button>

      {message && (
        <div
          className={[
            "text-sm mt-2 font-medium p-3 rounded-md border",
            isSuccess ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-red-600 bg-red-50 border-red-200",
          ].join(" ")}
          role="alert"
        >
          {message}
        </div>
      )}
    </form>
  );
}