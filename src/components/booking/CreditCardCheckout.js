"use client";

import React, { useState } from "react";
import Button from "@/components/ui/buttons/buttons";
import CreditCardIcon from "@/assets/icons/credit.svg?url";
import CheckoutConfirm from "@/components/booking/CheckoutConfirm";
import BookingDetailCard from "@/components/booking/BookingDetailCard";
import { useStripe, Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

export default function CreditCardCheckout({
  orderId,
  savedCards,
  setSavedCards,
  selectedCardId,
  useNewCard,
  setUseNewCard,
  setSelectedCardId,
  onBack,
  onConfirm,
  onCreateGuest,
  clientSecret,
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
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showReauth, setShowReauth] = useState(false);
  const [password, setPassword] = useState("");
  const [reauthError, setReauthError] = useState(null);

  const handleConfirmSavedCard = () => {
    setShowReauth(true);
  };

  const confirmStripePayment = async () => {
    if (!stripe || !clientSecret) return;

    setIsLoading(true);

    try {
      if (onCreateGuest) {
        await onCreateGuest();
      }

      const { error, paymentIntent } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: selectedCardId,
        });

      if (error) {
        setErrorMessage(error.message);
        onConfirm?.({ success: false });
        return;
      }
      if (paymentIntent?.status === "succeeded") {
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

        // เตรียมเลขท้ายบัตรและแบรนด์: เอาจาก paymentIntent ถ้าไม่มีใช้จาก savedCards
        const selectedCard = savedCards.find((c) => c.id === selectedCardId);
        const charge = paymentIntent?.charges?.data?.[0];
        const cardDetails = charge?.payment_method_details?.card;

        const cardLastDigitsFromPI = cardDetails?.last4 ?? "";
        const cardLastDigits =
          cardLastDigitsFromPI || selectedCard?.card?.last4 || "888";

        const cardBrandFromPI = cardDetails?.brand ?? "";
        const cardBrand =
          cardBrandFromPI || selectedCard?.card?.brand || "card";

        // อัปเดตสถานะ order ให้เหมือนกรณีชำระเงินสด พร้อมเก็บเลขท้ายบัตรและแบรนด์
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
          console.error("Failed to update order status after card payment:", updateErr);
        }

        onConfirm?.({
          success: true,
          paymentMethod: "Credit Card",
          cardLastDigits,
          cardBrand,
        });
      }
    } catch (err) {
      if (err?.message) setErrorMessage(err.message);
      onConfirm?.({ success: false });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReverify = async () => {
    try {
      await axios.post(
        "/api/auth/reverify",
        { password },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setShowReauth(false);

      await confirmStripePayment();

    } catch (err) {
      setReauthError("Incorrect password");
    }
  };

  const handleDeleteCard = async (id) => {
    try {
      await axios.delete("/api/stripe/detach-payment-method", {
        data: { paymentMethodId: id },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setSavedCards((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Failed to delete card", err);
    }
  };

  return (
    <div>
      <h3 className="font-sans text-[20px] font-semibold text-gray-600 mb-4">
        Credit Card
      </h3>
      <div className="space-y-3">
        {savedCards.map((card) => {
          const isSelected = !useNewCard && selectedCardId === card.id;
          return (
            <div
              key={card.id}
              className={`flex items-center gap-4 w-full px-4 py-3 rounded-lg border-2 transition-all font-sans text-base text-[#2A2E3F] bg-white ${isSelected
                ? "border-[#E76B39] bg-orange-50/50 shadow-sm"
                : "border-[#E4E6ED] hover:border-gray-400 hover:bg-gray-50/50"
                }`}
            >
              <label className="flex items-center gap-4 flex-1 cursor-pointer min-w-0">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={isSelected}
                  onChange={() => {
                    setUseNewCard(false);
                    setSelectedCardId(card.id);
                  }}
                  className="w-4 h-4 text-[#E76B39] border-gray-300 focus:ring-[#E76B39] shrink-0"
                />
                <img src={CreditCardIcon} className="w-5 h-5 text-gray-100 shrink-0" alt="" aria-hidden />
                <span className="font-normal">
                  •••• {card.card.last4}
                </span>
                <span className="text-gray-500 capitalize">
                  {card.card.brand}
                </span>
              </label>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleDeleteCard(card.id);
                }}
                className="text-red-500 text-sm font-medium hover:text-red-600 shrink-0"
              >
                Remove
              </button>
            </div>
          );
        })}
        <label
          className={`flex items-center gap-4 w-full px-4 py-3 rounded-lg border-2 cursor-pointer transition-all font-sans text-base text-[#2A2E3F] bg-white ${useNewCard
            ? "border-[#E76B39] bg-orange-50/50 shadow-sm"
            : "border-[#E4E6ED] hover:border-gray-400 hover:bg-gray-50/50"
            }`}
        >
          <input
            type="radio"
            name="paymentMethod"
            checked={useNewCard}
            onChange={() => setUseNewCard(true)}
            className="w-4 h-4 text-[#E76B39] border-gray-300 focus:ring-[#E76B39]"
          />
          <img src={CreditCardIcon} className="w-5 h-5 text-gray-500 shrink-0" alt="" aria-hidden />
          <span className="font-normal">Use new card</span>
        </label>
      </div>

      <div className="flex flex-col gap-10 mt-4">
      {(useNewCard || savedCards.length === 0) && clientSecret ? (
        <Elements
          stripe={stripePromise}
          options={{ clientSecret, locale: "en" }}
        >
          <div className="border rounded-lg p-4 mt-4">
            <p className="font-semibold mb-3">Enter new card details</p>
            <CheckoutConfirm
              orderId={orderId}
              onBack={onBack}
              onConfirm={onConfirm}
              onCreateGuest={onCreateGuest}
              onSaveAdditionalRequest={onSaveAdditionalRequest}
              onSaveRequests={onSaveRequests}
              onUpdateOrderMeta={onUpdateOrderMeta}
              extras={extras}
              standards={standards}
              promotionCode={promotionCode}
              promotionDiscount={promotionDiscount}
            />
          </div>
        </Elements>
      ) : (
        <div className="flex flex-col items-center justify-between mt-8 pt-6">
          {errorMessage && (
            <p className="text-red-500 text-sm font-sans">{errorMessage}</p>
          )}
          <div className="lg:hidden w-full mt-6">
            <BookingDetailCard
              orderId={orderId}
              extras={extras}
              standards={standards}
              promotionCode={promotionCode}
              promotionDiscount={promotionDiscount}
            />
          </div>
          <div className="flex flex-row gap-22 mt-10 lg:gap-100">
          <button
            type="button"
            onClick={onBack}
            className="text-[#E76B39] font-sans text-base font-medium hover:text-[#C14817] transition-colors px-0 hover:cursor-pointer"
          >
            Back
          </button>
          <Button
            buttonStyle="primary"
            buttonText={isLoading ? "Processing..." : "Confirm booking"}
            type="button"
            onClick={handleConfirmSavedCard}
            disabled={!stripe || isLoading}
          />
          </div>
          
        </div>
      )}
      {showReauth && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[400px] shadow-xl">
            <h3 className="text-lg font-semibold mb-4">
              Confirm your password
            </h3>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setReauthError(null);
              }}
              className="w-full border rounded-lg px-4 py-2 mb-3"
            />

            {reauthError && (
              <p className="text-red-500 text-sm mb-2">
                {reauthError}
              </p>
            )}

            <div className="flex justify-end gap-10 mt-4">
              <button
                onClick={() => {
                  setShowReauth(false);
                  setPassword("");
                }}
                className="text-gray-700 hover:cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleReverify}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:cursor-pointer"
              >
                Confirm & Pay
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
