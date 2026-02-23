"use client";

import React, { useState, useEffect } from "react";
import Button from "@/components/ui/buttons/buttons";
import CreditCardIcon from "@/assets/icons/credit.svg?url";
import CashIcon from "@/assets/icons/cash.svg?url";
import CashHandIcon from "@/assets/icons/cash-hand.svg?url";
import CheckoutConfirm from "@/components/booking/CheckoutConfirm";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

const inputBase =
  "w-full px-4 py-3 border border-[#D6D9E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E76B39] focus:border-transparent font-sans text-base text-[#2A2E3F] bg-white";

const tabBase =
  "flex items-center justify-center gap-2 w-[167.5px] h-[60px] py-3 rounded-sm border-2 shadow-lg font-sans text-base font-medium transition-colors lg:w-[322px] lg:h-[80px]";
const tabActive = "border-[#E76B39] text-orange-500 bg-white";
const tabInactive = "border-[#E4E6ED] text-gray-600 bg-white hover:border-gray-400";

const ROOM_PRICE = 2500;
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function PaymentMethodForm({
  onBack,
  onConfirm,
  promotionCode = "",
  promotionDiscount = 0,
  onPromotionChange,
  extras = [],
  user,
  orderId,
}) {
  const [method, setMethod] = useState("credit-card");
  const [promoInput, setPromoInput] = useState(promotionCode || "NEATLYNEW400");
  const [clientSecret, setClientSecret] = useState("");

  const extrasTotal = extras.reduce((sum, e) => sum + (e.price ?? 0), 0);
  const totalBaht = Math.max(0, ROOM_PRICE + extrasTotal - promotionDiscount);
  const amountSatang = Math.round(totalBaht * 100);

  useEffect(() => {
    if (promoInput === "NEATLYNEW400" && promotionDiscount === 0) {
      onPromotionChange?.({ code: "NEATLYNEW400", discount: 400 });
    }
  }, []);

  useEffect(() => {
    if (method !== "credit-card") return;
    if (!user) return;
  
    const initPayment = async () => {
      try {
        let stripeCustomerId = user.stripe_customer_id;
  
        // ✅ ถ้ายังไม่มี customer → สร้างก่อน
        if (!stripeCustomerId) {
          const customerRes = await fetch("/api/payment/create-customer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              email: user.email,
              name: [user.first_name, user.last_name].filter(Boolean).join(" ") || undefined,
            }),
          });

          const customer = await customerRes.json();
          if (!customerRes.ok || !customer?.id) {
            throw new Error(customer?.error || "Failed to create Stripe customer");
          }
          stripeCustomerId = customer.id;
        }
  
        // ✅ แล้วค่อยสร้าง Payment Intent
        const paymentRes = await fetch("/api/payment/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: amountSatang,
            stripeCustomerId,
            userId: user.id,
            orderId: orderId || "pending",
          }),
        });
  
        const data = await paymentRes.json();
        setClientSecret(data.clientSecret ?? "");
      } catch (err) {
        console.error("Payment init error:", err);
        setClientSecret("");
      }
    };
  
    initPayment();
  }, [method, amountSatang, user, orderId]);

  const handleCashConfirm = () => {
    onConfirm?.({
      success: true,
      paymentMethod: "Cash",
      cardLastDigits: "",
    });
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
          <img src={CreditCardIcon} className="w-6 h-6" alt="" aria-hidden />
          Credit Card
        </button>
        <button
          type="button"
          onClick={() => setMethod("cash")}
          className={`${tabBase} ${method === "cash" ? tabActive : tabInactive}`}
          aria-pressed={method === "cash"}
          aria-label="Pay with Cash"
        >
          <img src={CashIcon} className="w-6 h-6" alt="" aria-hidden />
          Cash
        </button>
      </div>

      {method === "credit-card" && (
        <div>
          <h3 className="font-sans text-[20px] font-semibold text-gray-600 mb-4">
            Credit Card
          </h3>
          {clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutConfirm
                onBack={onBack}
                onConfirm={onConfirm}
                extras={extras}
                promotionCode={promotionCode}
                promotionDiscount={promotionDiscount}
              />
            </Elements>
          ) : (
            <p className="text-gray-500 font-sans">Loading payment form…</p>
          )}
        </div>
      )}

      {method === "cash" && (
        <div>
          <h3 className="font-sans text-[20px] font-semibold text-gray-600 mb-4">
            Cash
          </h3>
          <div className="flex felx-col justify-around items-center bg-[#F1F2F6] rounded-sm mb-6 px-6 py-6 lg:gap-5">
            <img src={CashHandIcon} className="w-6 h-6" alt="" aria-hidden />
            <div className="w-[229px] lg:w-[500px]">
              <p className="font-sans text-base text-[#2A2E3F]">
                Pay at the hotel with cash or cheque. No payment is required until you check in
              </p>
            </div>
          </div>
          <div className="mb-10 border-t border-gray-300">
            <label
              htmlFor="promoCodeCash"
              className="block font-sans text-base text-gray-900 mt-4"
            >
              Promotion Code
            </label>
            <div className="flex gap-2">
              <input
                id="promoCodeCash"
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

      {/* Navigation - Desktop (Confirm only for Cash) */}
      <div className="hidden lg:flex items-center justify-between mt-8 pt-6">
        {method === "cash" && (
          <>
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
            onClick={handleCashConfirm}
          />
          </>
        )}
      </div>

      <div className="lg:hidden flex items-center justify-between mt-6 ml-2">
        {method === "cash" && (
          <>
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
              onClick={handleCashConfirm}
            />
          </>
        )}
      </div>
    </div>
  );
}
