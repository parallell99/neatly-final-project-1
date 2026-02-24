"use client";

import React, { useState } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import Button from "@/components/ui/buttons/buttons";
import BookingDetailCard from "@/components/booking/BookingDetailCard";

export default function CheckoutConfirm({
  orderId,
  onBack,
  onConfirm,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsLoading(true);
    setErrorMessage("");

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message ?? "Payment failed");
      onConfirm?.({ success: false });
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      onConfirm?.({
        success: true,
        paymentMethod: "Credit Card",
        cardLastDigits: paymentIntent?.payment_method?.card?.last4 ?? "4242",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {errorMessage && (
        <p className="text-red-500 text-sm font-sans">{errorMessage}</p>
      )}
      <div className="lg:hidden">
        <BookingDetailCard orderId={orderId} />
      </div>
      <div className="flex items-center justify-between mt-6 ml-2">
        <button
          type="button"
          onClick={onBack}
          className="text-orange-500 font-sans text-base font-medium hover:text-[#C14817] transition-colors px-0 hover:cursor-pointer"
        >
          Back
        </button>
        <Button
          buttonStyle="primary"
          buttonText={isLoading ? "Processing..." : "Confirm booking"}
          type="submit"
          disabled={!stripe || isLoading}
          className="lg:w-auto"
        />
      </div>
    </form>
  );
}
