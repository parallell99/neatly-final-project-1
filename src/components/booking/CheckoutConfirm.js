"use client";

import React, { useState } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import Button from "@/components/ui/buttons/buttons";
import BookingDetailCard from "@/components/booking/BookingDetailCard";
import axios from "axios";

export default function CheckoutConfirm({
  orderId,
  onBack,
  onConfirm,
  onCreateGuest,
  onSaveAdditionalRequest,
  onSaveRequests,
  onUpdateOrderMeta,
  extras = [],
  standards = [],
  promotionCode = "",
  promotionDiscount = 0,
  promotionIds = [],
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

    try {
      if (onCreateGuest) {
        await onCreateGuest();
      }

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
        const charge = paymentIntent?.charges?.data?.[0];
        const cardDetails = charge?.payment_method_details?.card;

        const cardLastDigits =
          cardDetails?.last4 ??
          paymentIntent?.payment_method?.card?.last4 ??
          "4242";

        const cardBrand =
          cardDetails?.brand ??
          paymentIntent?.payment_method?.card?.brand ??
          "card";

        try {
          if (onSaveAdditionalRequest) {
            await onSaveAdditionalRequest();
          }
        } catch (saveErr) {
          console.error("Failed to save additional request:", saveErr);
        }

        try {
          if (onSaveRequests) {
            await onSaveRequests();
          }
        } catch (reqErr) {
          console.error("Failed to save order requests:", reqErr);
        }

        try {
          if (onUpdateOrderMeta) {
            await onUpdateOrderMeta();
          }
        } catch (metaErr) {
          console.error("Failed to update order meta:", metaErr);
        }

        // อัปเดตสถานะ order ใน DB ให้เหมือน flow cash / saved card
        try {
          const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
          if (token && orderId) {
            await axios.patch(
              "/api/booking/update-payment-status",
              {
                orderId,
                status: "paid",
                paymentMethod: "card",
                cardLast4: cardLastDigits,
                cardBrand,
                promotionIds,
              },
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }
            );
          }
        } catch (updateErr) {
          console.error("Failed to update order status after new card payment:", updateErr);
        }

        onConfirm?.({
          success: true,
          paymentMethod: "Credit Card",
          cardLastDigits,
          cardBrand,
        });
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage(err?.message ?? "Something went wrong");
      onConfirm?.({ success: false });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="stripe-payment-element">
        <PaymentElement options={{ wallets: { link: "never" } }} />
      </div>
      {errorMessage && (
        <p className="text-red-500 text-sm font-sans">{errorMessage}</p>
      )}
      <div className="lg:hidden mt-6">
        <BookingDetailCard
          orderId={orderId}
          extras={extras}
          standards={standards}
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
          buttonText={isLoading ? "Processing..." : "Confirm booking"}
          type="submit"
          disabled={!stripe || isLoading}
          className="lg:w-auto"
        />
      </div>
    </form>
  );
}
