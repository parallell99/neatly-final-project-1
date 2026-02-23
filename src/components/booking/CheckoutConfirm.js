"use client";

import React, { useState } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import Button from "@/components/ui/buttons/buttons";
import BookingDetailCard from "@/components/booking/BookingDetailCard";

const inputBase =
  "w-full px-4 py-3 border border-[#D6D9E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E76B39] focus:border-transparent font-sans text-base text-[#2A2E3F] bg-white";

export default function CheckoutConfirm({
  onBack,
  onConfirm,
  extras = [],
  promotionCode = "",
  promotionDiscount = 0,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [promoInput, setPromoInput] = useState(promotionCode || "NEATLYNEW400");

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
      <div className="mb-6">
        <label
          htmlFor="promoCodeCard"
          className="block font-sans text-base font-medium text-gray-900 mb-2"
        >
          Promotion Code
        </label>
        <input
          id="promoCodeCard"
          type="text"
          value={promoInput}
          onChange={(e) => setPromoInput(e.target.value)}
          placeholder="Enter promotion code"
          className={inputBase}
          aria-label="Promotion code"
        />
      </div>
      <div className="lg:hidden">
        <BookingDetailCard
          extras={extras}
          promotionCode={promotionCode}
          promotionDiscount={promotionDiscount}
        />
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
          buttonText={isLoading ? "Processing..." : "Comfirm booking"}
          type="submit"
          disabled={!stripe || isLoading}
          className="lg:w-auto"
        />
      </div>
    </form>
  );
}
