"use client";

import React, { useState, useEffect, useRef } from "react";
import Button from "@/components/ui/buttons/buttons";
import CreditCardIcon from "@/assets/icons/credit.svg";
import CashIcon from "@/assets/icons/cash.svg";
import CashHandIcon from "@/assets/icons/cash-hand.svg";
import CreditCardCheckout from "@/components/booking/CreditCardCheckout";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import axios from "axios";

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
  standards = [],
  user,
  orderId,
  guestData,
  additionalRequest = "",
  promotionId = null,
}) {
  const [method, setMethod] = useState("credit-card");
  const [promoInput, setPromoInput] = useState(promotionCode || "");
  const [promoError, setPromoError] = useState("");
  const [promoCorrect, setPromoCorrect] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [savedCards, setSavedCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [useNewCard, setUseNewCard] = useState(false);

  const hasCreatedPI = useRef(false);

  const extrasTotal = extras.reduce((sum, e) => sum + (e.price ?? 0), 0);
  // มอง promotionDiscount เป็นเปอร์เซ็นต์ (discount_percentage)
  const promoPercent = Number(promotionDiscount || 0) || 0;
  const subtotal = ROOM_PRICE + extrasTotal;
  const promoAmount = promoPercent > 0 ? (subtotal * promoPercent) / 100 : 0;
  const totalBaht = Math.max(0, subtotal - promoAmount);
  const amountSatang = Math.round(totalBaht * 100);
  const storageKey =
    typeof window !== "undefined" && orderId
      ? `booking:payment:${orderId}`
      : "booking:payment:default";

  // Restore local payment-method UI state on refresh
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem(storageKey);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      if (parsed.method === "credit-card" || parsed.method === "cash") {
        setMethod(parsed.method);
      }
      if (typeof parsed.promoInput === "string") {
        setPromoInput(parsed.promoInput);
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Persist local payment-method UI state
  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload = {
      method,
      promoInput,
    };
    window.sessionStorage.setItem(storageKey, JSON.stringify(payload));
  }, [method, promoInput, storageKey]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const currentCode = promoInput.trim();

      if (!currentCode) {
        onPromotionChange?.({ code: "", discount: 0 });
        setPromoError("");
        setPromoCorrect("");
        return;
      }

      try {
        const params = new URLSearchParams();
        params.set("code", currentCode);

        const res = await fetch(`/api/booking/promotion?${params.toString()}`);

        if (!res.ok) {
          onPromotionChange?.({ code: "", discount: 0 });
          setPromoError("*This promotional code is invalid or has expired");
          setPromoCorrect("");
          return;
        }

        const data = await res.json();

        if (cancelled) return;

        const promo = data?.promotion ?? null;
        if (!promo) {
          onPromotionChange?.({ code: "", discount: 0 });
          setPromoError("*This promotional code is invalid or has expired");
          setPromoCorrect("");
          return;
        }

        // ใช้เปอร์เซ็นต์จาก discount_percentage เป็นหลัก
        const discountValue =
          promo.discount_percentage ??
          promo.fixed_amount ??
          promo.amount ??
          promo.discount ??
          0;

        const discountNumber = Number(discountValue) || 0;

        onPromotionChange?.({
          code: promo.name ?? currentCode,
          discount: discountNumber,
          promotionId: promo.id ?? null,
        });

        setPromoError("");
        setPromoCorrect(
          "This promotional code has been successfully applied."
        );
      } catch (err) {
        console.error("Failed to load promotion:", err);
        if (!cancelled) {
          onPromotionChange?.({ code: "", discount: 0 });
          setPromoError("This promotional code is invalid or has expired");
          setPromoCorrect("");
        }
      }
    };

    const timeoutId = setTimeout(run, 400);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [promoInput]);

  const handleCreatePaymentIntent = async () => {
    if (clientSecret) return; // 🔥 กันยิงซ้ำ

    try {
      let stripeCustomerId = user?.stripe_customer_id ?? null;

      const res = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          stripeCustomerId,
        }),
      });

      const text = await res.text();
      console.log("raw response:", text);

      if (!res.ok) {
        return;
      }

      const data = JSON.parse(text);


      if (!res.ok) {
        console.error(data.error);
        return;
      }

      setClientSecret(data.clientSecret);
    } catch (err) {
      console.error("Create PI error:", err);
    }
  };
  useEffect(() => {
    if (method === "credit-card" && orderId && !hasCreatedPI.current) {
      hasCreatedPI.current = true;
      handleCreatePaymentIntent();
    }
  }, [method, orderId]);

  useEffect(() => {
    if (method !== "credit-card") {
      setClientSecret("");
      hasCreatedPI.current = false;
    }
  }, [method]);

  useEffect(() => {
    if (!user?.stripe_customer_id) return;

    axios
      .get("/api/stripe/payment-methods", {
        params: { stripeCustomerId: user.stripe_customer_id },
      })
      .then((res) => {
        setSavedCards(res.data);
        if (res.data.length > 0) {
          setSelectedCardId(res.data[0].id);
        }
      })
      .catch((err) => {
        console.error("Error fetching saved cards:", err);
      });
  }, [user]);

  const [guestId, setGuestId] = useState(null);

  const handleCreateGuest = async () => {
    if (!guestData?.first_name || !guestData?.last_name || !guestData?.email || !guestData?.phone) {
      throw new Error("Guest information is required");
    }
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Unauthorized");

    const res = await fetch("/api/booking/create-guest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        first_name: guestData.first_name,
        last_name: guestData.last_name,
        email: guestData.email,
        phone: guestData.phone,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Failed to create guest");
    }

    const data = await res.json();
    const createdGuestId = data?.guest?.id ?? null;
    if (createdGuestId) {
      setGuestId(createdGuestId);
    }

    // คืน guestId เพื่อให้ caller ใช้ได้ทันที (ไม่ต้องรอ state update)
    return createdGuestId;
  };

  const handleSaveAdditionalRequest = async () => {
    if (!additionalRequest || !orderId) return;

    const token = localStorage.getItem("token");
    if (!token) throw new Error("Unauthorized");

    const res = await fetch("/api/booking/additional", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        orderId,
        additional_request: additionalRequest,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Failed to save additional request");
    }

    return res.json();
  };

  const handleSaveRequests = async () => {
    if (!orderId) return;

    const hasStandards = Array.isArray(standards) && standards.length > 0;
    const extraLabels = Array.isArray(extras)
      ? extras.map((e) => e.label).filter(Boolean)
      : [];

    if (!hasStandards && extraLabels.length === 0) return;

    const token = localStorage.getItem("token");
    if (!token) throw new Error("Unauthorized");

    const res = await fetch("/api/booking/order-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        orderId,
        standards,
        extras: extraLabels,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Failed to save order requests");
    }

    return res.json();
  };

  const handleUpdateOrderMeta = async (overrideGuestId) => {
    if (!orderId) return;

    const token = localStorage.getItem("token");
    if (!token) throw new Error("Unauthorized");

    const effectiveGuestId = overrideGuestId ?? guestId;

    // ไม่มี guestId / promotionId ก็ไม่ต้องเรียก
    if (!effectiveGuestId && !promotionId) return;

    const body = {
      orderId,
      totalPrice: totalBaht,
    };

    if (effectiveGuestId) body.guestId = effectiveGuestId;
    if (promotionId) body.promotionId = promotionId;

    const res = await fetch("/api/booking/update-order-meta", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Failed to update order meta");
    }

    return res.json();
  };

  const handleCashConfirm = async () => {
    try {
      if (!user) {
        alert("Please login");
        return;
      }

      const createdGuestId = await handleCreateGuest();

      try {
        await handleSaveAdditionalRequest();
      } catch (saveErr) {
        console.error("Save additional request error:", saveErr);
      }

      try {
        await handleSaveRequests();
      } catch (reqErr) {
        console.error("Save requests error:", reqErr);
      }

      try {
        await handleUpdateOrderMeta(createdGuestId);
      } catch (metaErr) {
        console.error("Update order meta error:", metaErr);
      }

      const token = localStorage.getItem("token");

      const res = await fetch("/api/booking/update-payment-status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId,
          status: "paid",
          paymentMethod: "cash",
        }),
      });

      const text = await res.text();

      console.log("STATUS:", res.status);
      console.log("RAW RESPONSE:", text);

      if (!res.ok) {
        throw new Error(text);
      }

      const data = JSON.parse(text);

      onConfirm?.({
        success: true,
        paymentMethod: "Cash",
        order: data.order,
      });

    } catch (err) {
      console.error("Cash confirm error:", err);
      onConfirm?.({ success: false });
    }
  };

  // สำหรับจ่ายด้วยบัตร เราอยากให้สร้าง guest แล้วอัปเดต meta ทันที
  const handleCreateGuestAndUpdateOrder = async () => {
    const createdGuestId = await handleCreateGuest();
    try {
      await handleUpdateOrderMeta(createdGuestId);
    } catch (metaErr) {
      console.error("Update order meta error (credit card):", metaErr);
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
          <CreditCardIcon className="w-6 h-6" alt="" aria-hidden />
          Credit Card
        </button>
        <button
          type="button"
          onClick={() => setMethod("cash")}
          className={`${tabBase} ${method === "cash" ? tabActive : tabInactive}`}
          aria-pressed={method === "cash"}
          aria-label="Pay with Cash"
        >
          <CashIcon className="w-6 h-6" alt="" aria-hidden />
          Cash
        </button>
      </div>

      {/* Promotion Code - shown for both Credit Card and Cash */}
      <div className="mb-10 border-t border-gray-300 pt-6">
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
        {promoError && (
          <p className="mt-2 text-sm text-red-500">
            {promoError}
          </p>
        )}
        {promoCorrect && (
          <p className="mt-2 text-sm text-[#00b300]">
            {promoCorrect}
          </p>
        )}
      </div>

      {method === "credit-card" && clientSecret && (
        <Elements
          stripe={stripePromise}
          options={{ clientSecret }}
        >
          <CreditCardCheckout
            orderId={orderId}
            savedCards={savedCards}
            setSavedCards={setSavedCards}
            selectedCardId={selectedCardId}
            useNewCard={useNewCard}
            setUseNewCard={setUseNewCard}
            setSelectedCardId={setSelectedCardId}
            clientSecret={clientSecret}
            onBack={onBack}
            onConfirm={onConfirm}
            onCreateGuest={handleCreateGuestAndUpdateOrder}
            onSaveAdditionalRequest={handleSaveAdditionalRequest}
            onSaveRequests={handleSaveRequests}
            onUpdateOrderMeta={handleUpdateOrderMeta}
          />
        </Elements>
      )}
      {method === "cash" && (
        <div>
          <h3 className="font-sans text-[20px] font-semibold text-gray-600 mb-4">
            Cash
          </h3>
          <div className="flex felx-col justify-around items-center bg-[#F1F2F6] rounded-sm mb-6 px-6 py-6 lg:gap-1">
            <CashHandIcon
              className="w-10 h-10 shrink-0 object-contain"
              alt=""
              aria-hidden
            />
            <div className="w-[229px] lg:w-[500px]">
              <p className="font-sans text-base text-[#2A2E3F]">
                Pay at the hotel with cash or cheque. No payment is required until you check in
              </p>
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
