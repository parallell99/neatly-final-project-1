"use client";

import React, { useState, useEffect } from "react";
import Button from "@/components/ui/buttons/buttons";
import BookingDetailCard from "@/components/booking/BookingDetailCard";
import CreditCardIcon from "@/assets/icons/credit.svg";
import CashIcon from "@/assets/icons/cash.svg"
import CashHandIcon from "@/assets/icons/cash-hand.svg"

const inputBase =
  "w-full px-4 py-3 border border-[#D6D9E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E76B39] focus:border-transparent font-sans text-base text-[#2A2E3F] bg-white";

const tabBase =
  "flex items-center justify-center gap-2 w-[167.5px] h-[60px] py-3 rounded-sm border-2 shadow-lg font-sans text-base font-medium transition-colors lg:w-[322px] lg:h-[80px]";
const tabActive = "border-[#E76B39] text-orange-500 bg-white";
const tabInactive = "border-[#E4E6ED] text-gray-600 bg-white hover:border-gray-400";

export default function PaymentMethodForm({
  onBack,
  onConfirm,
  promotionCode = "",
  promotionDiscount = 0,
  onPromotionChange,
  extras = [],
}) {
  const [method, setMethod] = useState("credit-card");
  const [cardNumber, setCardNumber] = useState("888 9696 8 98 88");
  const [cardOwner, setCardOwner] = useState("Kate Cho");
  const [expiryDate, setExpiryDate] = useState("11/26");
  const [cvc, setCvc] = useState("858");
  const [promoInput, setPromoInput] = useState(promotionCode || "NEATLYNEW400");

  useEffect(() => {
    if (promoInput === "NEATLYNEW400" && promotionDiscount === 0) {
      onPromotionChange?.({ code: "NEATLYNEW400", discount: 400 });
    }
  }, []);

  const handleApplyPromo = () => {
    if (promoInput.trim()) {
      onPromotionChange?.({ code: promoInput.trim(), discount: 400 });
    }
  };

  const handleConfirm = async () => {
    // Simulate payment processing
    try {
      // Simulate API call - randomly succeed or fail for demo
      // In production, replace with actual payment API call
      const paymentSuccess = Math.random() > 0.5; // 50% chance of success for demo
      
      if (paymentSuccess) {
        const cardLastDigits = cardNumber.replace(/\s/g, "").slice(-3);
        onConfirm?.({
          success: true,
          paymentMethod: method === "credit-card" ? "Credit Card" : "Cash",
          cardLastDigits: method === "credit-card" ? cardLastDigits : "",
        });
      } else {
        onConfirm?.({ success: false });
      }
    } catch (error) {
      onConfirm?.({ success: false, error: error.message });
    }
  };

  return (
    <div>
      {/* Payment method tabs */}
      <div className="flex gap-4 mb-8">
        <button
          type="button"
          onClick={() => setMethod("credit-card")}
          className={`${tabBase} ${method === "credit-card" ? tabActive : tabInactive}`}
          aria-pressed={method === "credit-card"}
          aria-label="Pay with Credit Card"
        >
          <CreditCardIcon />
          Credit Card
        </button>
        <button
          type="button"
          onClick={() => setMethod("cash")}
          className={`${tabBase} ${method === "cash" ? tabActive : tabInactive}`}
          aria-pressed={method === "cash"}
          aria-label="Pay with Cash"
        >
          <CashIcon />
          Cash
        </button>
      </div>

      {method === "credit-card" && (
        <>
          <h3 className="font-sans text-[20px] font-semibold text-gray-600 mb-4">
            Credit Card
          </h3>
          <div className="space-y-4 mb-10">
            <div>
              <label
                htmlFor="cardNumber"
                className="block font-sans text-base font-medium text-gray-900 mb-2"
              >
                Card Number
              </label>
              <input
                id="cardNumber"
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="888 9696 8 98 88"
                className={inputBase}
                aria-label="Card number"
              />
            </div>
            <div>
              <label
                htmlFor="cardOwner"
                className="block font-sans text-base font-medium text-gray-900 mb-2"
              >
                Card Owner
              </label>
              <input
                id="cardOwner"
                type="text"
                value={cardOwner}
                onChange={(e) => setCardOwner(e.target.value)}
                placeholder="Card owner name"
                className={inputBase}
                aria-label="Card owner"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="expiryDate"
                  className="block font-sans text-base font-medium text-[#2A2E3F] mb-2"
                >
                  Expiry Date
                </label>
                <input
                  id="expiryDate"
                  type="text"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  placeholder="MM/YY"
                  className={inputBase}
                  aria-label="Expiry date"
                />
              </div>
              <div>
                <label
                  htmlFor="cvc"
                  className="block font-sans text-base font-medium text-gray-900 mb-2"
                >
                  CVC/CVV
                </label>
                <input
                  id="cvc"
                  type="text"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  placeholder="CVC"
                  className={inputBase}
                  aria-label="CVC or CVV"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="promoCode"
                className="block font-sans text-base font-medium text-gray-900 mb-2"
              >
                Promotion Code
              </label>
              <div className="flex gap-2">
                <input
                  id="promoCode"
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder="Enter promotion code"
                  className={inputBase}
                  aria-label="Promotion code"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {method === "cash" && (
        <div>
          <h3 className="font-sans text-[20px] font-semibold text-gray-600 mb-4">
            Cash
          </h3>
          <div className="flex felx-col justify-around items-center bg-[#F1F2F6] rounded-sm mb-6 px-6 py-6 lg:gap-5">
            <CashHandIcon />
            <div className="w-[229px] lg:w-[500px]">
            <p className="font-sans text-base text-[#2A2E3F]">
              Pay at the hotel with cash or cheque. No payment is required until you check in
            </p>
            </div>
          </div>
          <div className="mb-10 border-t border-gray-300">
              <label
                htmlFor="promoCode"
                className="block font-sans text-base text-gray-900 mt-4"
              >
                Promotion Code
              </label>
              <div className="flex gap-2">
                <input
                  id="promoCode"
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder="Enter promotion code"
                  className={inputBase}
                  aria-label="Promotion code"
                />
              </div>
            </div>
        </div>
      )}

      {/* Navigation - Desktop */}
      <div className="hidden lg:flex items-center justify-between mt-8 pt-6">
        <button
          type="button"
          onClick={onBack}
          className="text-[#E76B39] font-sans text-base font-medium hover:text-[#C14817] transition-colors px-0 hover:cursor-pointer"
        >
          Back
        </button>
        <Button
          buttonStyle="primary"
          buttonText="Confirm Booking"
          type="button"
          onClick={handleConfirm}
        />
      </div>

      {/* Mobile */}
      <div className="lg:hidden">
        <BookingDetailCard
          extras={extras}
          promotionCode={promotionCode}
          promotionDiscount={promotionDiscount}
        />
      </div>
      <div className="lg:hidden flex items-center justify-between mt-6 ml-2">
        <button
          type="button"
          onClick={onBack}
          className="text-orange-500 font-sans text-base font-medium hover:text-[#C14817] transition-colors px-0 hover:cursor-pointer"
        >
          Back
        </button>
        <Button
          buttonStyle="primary"
          buttonText="Confirm Booking"
          type="button"
          onClick={handleConfirm}
          className="w-[120px] h-[60px]"
        />
      </div>
    </div>
  );
}
