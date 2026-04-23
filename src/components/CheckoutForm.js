'use client';

import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

export default function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();

  const [message, setMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Redirects here after successful payment
        return_url: `${window.location.origin}/pay/success`,
      },
    });

    if (error.type === "card_error" || error.type === "validation_error") {
      setMessage(error.message);
    } else {
      setMessage("An unexpected error occurred.");
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-md mx-auto w-full">
      <PaymentElement id="payment-element" />
      
      <button 
        disabled={isProcessing || !stripe || !elements} 
        id="submit"
        className="bg-blue-600 text-white py-3 px-4 rounded-md font-semibold disabled:opacity-50 mt-4 transition-colors hover:bg-blue-700 w-full"
      >
        <span id="button-text">
          {isProcessing ? "Processing..." : "Pay Now"}
        </span>
      </button>

      {message && (
        <div className="text-red-600 text-sm mt-2 font-medium bg-red-50 p-3 rounded-md border border-red-200" role="alert">
          {message}
        </div>
      )}
    </form>
  );
}