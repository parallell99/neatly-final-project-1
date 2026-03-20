"use client";

import React, { useState, useEffect, useRef } from "react";
import Button from "@/components/ui/buttons/buttons";
import CreditCardIcon from "@/assets/icons/credit.svg";
import CashIcon from "@/assets/icons/cash.svg";
import CashHandIcon from "@/assets/icons/cash-hand.svg";
import CreditCardCheckout from "@/components/booking/CreditCardCheckout";
import BookingDetailCard from "@/components/booking/BookingDetailCard";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import axios from "axios";

const inputBase =
  "w-full px-4 py-3 border border-[#D6D9E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E76B39] focus:border-transparent font-sans text-base text-[#2A2E3F] bg-white";

const tabBase =
  "flex items-center justify-center gap-2 w-[167.5px] h-[60px] py-3 rounded-sm border-2 shadow-lg font-sans text-base font-medium transition-colors lg:w-[322px] lg:h-[80px] hover:cursor-pointer";
const tabActive = "border-[#E76B39] text-orange-500 bg-white";
const tabInactive = "border-[#E4E6ED] text-gray-600 bg-white hover:border-gray-400";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, {
  developerTools: { assistant: { enabled: false } },
});

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
  appliedPromotions: initialAppliedPromotions = [],
}) {
  const [method, setMethod] = useState("credit-card");
  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoCorrect, setPromoCorrect] = useState("");
  const [appliedPromotions, setAppliedPromotions] = useState(() =>
    Array.isArray(initialAppliedPromotions) && initialAppliedPromotions.length > 0
      ? initialAppliedPromotions
      : []
  );
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [stripeInitError, setStripeInitError] = useState("");
  const [savedCards, setSavedCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [useNewCard, setUseNewCard] = useState(false);
  const [isLg, setIsLg] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.matchMedia("(min-width: 1024px)").matches;
    } catch {
      return false;
    }
  });

  const hasCreatedPI = useRef(false);
  const lastTotalRef = useRef(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsLg(!!media.matches);
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }
    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  const [order, setOrder] = useState(null);
  const [room, setRoom] = useState(null);

  useEffect(() => {
    if (!orderId) return;

    let cancelled = false;

    (async () => {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const params = new URLSearchParams();
        params.set("orderId", String(orderId));

        const res = await fetch(`/api/booking/order-detail?${params.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setOrder(data?.order ?? null);
        setRoom(data?.room ?? null);
      } catch (err) {
        console.error("Failed to load order detail for promotion subtotal:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const extrasTotal = extras.reduce((sum, e) => sum + (Number(e.price ?? 0) || 0), 0);

  // === ใช้ subtotal แบบเดียวกับ BookingDetailCard ===
  const nightlyPrice =
    room?.promotion_price_per_night != null
      ? Number(room.promotion_price_per_night) || 0
      : room?.price_per_night != null
        ? Number(room.price_per_night) || 0
        : 0;

  let nights = 1;
  if (order?.check_in_date && order?.check_out_date) {
    const d1 = new Date(order.check_in_date);
    const d2 = new Date(order.check_out_date);
    const msPerDay = 24 * 60 * 60 * 1000;
    const diff = Math.round((d2 - d1) / msPerDay);
    if (Number.isFinite(diff) && diff > 0) nights = diff;
  }

  const quantity = order?.quantity != null ? Number(order.quantity) || 1 : 1;
  const baseRoomPrice =
    nightlyPrice > 0
      ? nightlyPrice * nights * quantity
      : order?.total_price != null
        ? Number(order.total_price) || 0
        : 0;
  const subtotal = baseRoomPrice + extrasTotal;

  // คิดส่วนลดแบบ percentage / อื่น ๆ ก่อน แล้วค่อย fixed เป็นลำดับสุดท้ายเสมอ
  const percentPromos = appliedPromotions.filter(
    (p) => (p.discount_type || "percent").toLowerCase() !== "fixed"
  );
  const fixedPromos = appliedPromotions.filter(
    (p) => (p.discount_type || "percent").toLowerCase() === "fixed"
  );

  const percentDiscount = percentPromos.reduce((sum, p) => {
    const val = Number(p.discount_value) ?? 0;
    const pct =
      p.discount_percentage != null ? Number(p.discount_percentage) : val;
    if (!Number.isFinite(pct) || pct <= 0) return sum;
    const raw = (subtotal * pct) / 100;
    const maxCapRaw = p.max_discount != null ? Number(p.max_discount) : null;
    const maxCap =
      maxCapRaw != null && Number.isFinite(maxCapRaw) && maxCapRaw > 0 ? maxCapRaw : null;
    const capped = maxCap != null ? Math.min(raw, maxCap) : raw;
    return sum + capped;
  }, 0);

  const subtotalAfterPercent = Math.max(0, subtotal - percentDiscount);

  const fixedDiscount = fixedPromos.reduce((sum, p) => {
    const val = Number(p.discount_value) ?? 0;
    if (!Number.isFinite(val) || val <= 0) return sum;
    const remaining = Math.max(0, subtotalAfterPercent - sum);
    return sum + Math.min(val, remaining);
  }, 0);

  const totalDiscountAmount = percentDiscount + fixedDiscount;
  const totalDiscountAmountRounded = Math.round(totalDiscountAmount * 100) / 100;
  const totalBaht = Math.max(0, subtotal - totalDiscountAmountRounded);
  const totalDiscountPercent = subtotal > 0 ? (totalDiscountAmountRounded / subtotal) * 100 : 0;
  const promotionIds = appliedPromotions.map((p) => p.id).filter(Boolean);
  const firstPromotionId = promotionIds[0] ?? null;

  useEffect(() => {
    onPromotionChange?.({
      code: appliedPromotions.length ? appliedPromotions.map((p) => p.name || p.code).join(", ") : "",
      discount: totalDiscountPercent,
      promotionId: firstPromotionId,
      promotions: appliedPromotions,
      totalDiscountAmount: totalDiscountAmountRounded,
      totalDiscountPercent,
      promotionIds,
    });
  }, [appliedPromotions, totalDiscountAmountRounded, totalDiscountPercent, firstPromotionId]);

  useEffect(() => {
    if (Array.isArray(initialAppliedPromotions) && initialAppliedPromotions.length > 0 && appliedPromotions.length === 0) {
      setAppliedPromotions(initialAppliedPromotions);
    }
  }, [initialAppliedPromotions]);

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

  const handleApplyPromo = async () => {
    const currentCode = promoInput.trim();
    if (!currentCode) {
      setPromoError("Enter a promotion code");
      return;
    }

    const alreadyApplied = appliedPromotions.some(
      (p) => (p.code && p.code.toLowerCase() === currentCode.toLowerCase()) || p.name?.toLowerCase() === currentCode.toLowerCase()
    );
    if (alreadyApplied) {
      setPromoError("This code is already applied");
      setPromoCorrect("");
      return;
    }

    setIsApplyingPromo(true);
    setPromoError("");
    setPromoCorrect("");

    try {
      const params = new URLSearchParams();
      params.set("code", currentCode);
      params.set("subtotal", String(subtotal));
      const appliedIds = appliedPromotions.map((p) => p.id).filter(Boolean);
      if (appliedIds.length > 0) {
        params.set("appliedPromotionIds", appliedIds.join(","));
      }

      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      const res = await fetch(`/api/booking/promotion?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();

      if (!res.ok) {
        setPromoError(data?.message || "*This promotional code is invalid or has expired");
        setPromoCorrect("");
        return;
      }

      const promo = data?.promotion;
      if (!promo) {
        setPromoError("*This promotional code is invalid or has expired");
        setPromoCorrect("");
        return;
      }

      const normalized = {
        id: promo.id,
        code: promo.code || currentCode,
        name: promo.name || promo.code || currentCode,
        discount_type: promo.discount_type || "percent",
        discount_value: Number(promo.discount_value) || 0,
        discount_percentage: promo.discount_percentage != null ? Number(promo.discount_percentage) : null,
        max_discount: promo.max_discount != null ? Number(promo.max_discount) : null,
        is_stackable: promo.is_stackable === true,
      };

      if (!normalized.is_stackable) {
        setAppliedPromotions([normalized]);
      } else {
        const hasNonStackable = appliedPromotions.some((p) => !p.is_stackable);
        if (hasNonStackable) {
          setPromoError("This promotion cannot be combined with other promotions.");
          return;
        }
        setAppliedPromotions((prev) => [...prev, normalized]);
      }

      setPromoInput("");
      setPromoCorrect("Promotion code applied.");
    } catch (err) {
      console.error("Failed to apply promotion:", err);
      setPromoError("This promotional code is invalid or has expired");
      setPromoCorrect("");
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleRemovePromo = (id) => {
    setAppliedPromotions((prev) => prev.filter((p) => p.id !== id));
    setPromoError("");
    setPromoCorrect("");
  };

  const handleCreatePaymentIntent = async () => {
    if (clientSecret) return; // 🔥 กันยิงซ้ำ

    try {
      let stripeCustomerId = user?.stripe_customer_id ?? null;
      setStripeInitError("");

      // อย่าสร้าง PaymentIntent ถ้ายอดยังคำนวณไม่ได้ (เช่น room/order ยังโหลดไม่ทัน)
      if (!Number.isFinite(totalBaht) || Number(totalBaht) <= 0) {
        setStripeInitError("Calculating total price…");
        hasCreatedPI.current = false;
        return;
      }

      // อัปเดต total_price ใน orders ให้เป็น “ยอดสุทธิจริง” ก่อนสร้าง PaymentIntent
      // (รวม extras และหัก promotion แล้ว)
      try {
        await handleUpdateOrderMeta();
      } catch (metaErr) {
        console.error("Update order meta before PI error:", metaErr);
      }

      const res = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          stripeCustomerId,
          totalPrice: totalBaht,
        }),
      });

      const text = await res.text();
      console.log("raw response:", text);

      if (!res.ok) {
        // Show full API response for easier debugging
        setStripeInitError(text || "Failed to initialize payment");
        hasCreatedPI.current = false;
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
      setStripeInitError(err?.message || "Failed to initialize payment");
      hasCreatedPI.current = false;
    }
  };
  useEffect(() => {
    if (method !== "credit-card") return;
    if (!orderId) return;
    if (!Number.isFinite(totalBaht) || Number(totalBaht) <= 0) return;
    // If we don't have a clientSecret yet (or it was reset after promo/extras changes),
    // create a new PaymentIntent exactly once.
    if (!clientSecret && !hasCreatedPI.current) {
      hasCreatedPI.current = true;
      handleCreatePaymentIntent();
    }
  }, [method, orderId, clientSecret, totalBaht]);

  // ถ้ายอดสุทธิเปลี่ยน (เช่น apply/remove promo หรือเปลี่ยน extras) ให้สร้าง PaymentIntent ใหม่
  useEffect(() => {
    if (method !== "credit-card") return;
    if (!orderId) return;
    if (!Number.isFinite(totalBaht)) return;

    const next = Math.round(Number(totalBaht) * 100) / 100;
    if (lastTotalRef.current == null) {
      lastTotalRef.current = next;
      return;
    }
    if (lastTotalRef.current !== next) {
      lastTotalRef.current = next;
      setClientSecret("");
      hasCreatedPI.current = false;
    }
  }, [method, orderId, totalBaht]);

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
        ...(guestData.country != null && guestData.country !== "" && { country: guestData.country }),
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

    // ไม่มี guestId และไม่มี totalPrice ที่เป็นตัวเลข ไม่ต้องเรียก
    const hasGuest = !!effectiveGuestId;
    const hasTotal = typeof totalBaht === "number" && !Number.isNaN(totalBaht);
    if (!hasGuest && !hasTotal) return;

    const body = { orderId };
    if (hasTotal) body.totalPrice = totalBaht;
    if (hasGuest) body.guestId = effectiveGuestId;

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
          promotionIds,
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
        <div className="flex gap-2 flex-wrap">
          <input
            id="promoCode"
            type="text"
            value={promoInput}
            onChange={(e) => {
              setPromoInput(e.target.value);
              setPromoError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleApplyPromo();
              }
            }}
            placeholder="Enter promotion code"
            className={inputBase}
            aria-label="Promotion code"
            disabled={isApplyingPromo}
          />
          <Button
            type="button"
            buttonStyle="secondary"
            buttonText={isApplyingPromo ? "Applying..." : "Apply"}
            onClick={handleApplyPromo}
            disabled={isApplyingPromo || !promoInput.trim()}
            className="shrink-0"
          />
        </div>
        {appliedPromotions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {appliedPromotions.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-800 font-sans text-sm"
              >
                <span>{p.name || p.code}</span>
                <button
                  type="button"
                  onClick={() => handleRemovePromo(p.id)}
                  className="text-green-700 hover:text-green-900 font-medium"
                  aria-label={`Remove ${p.name || p.code}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
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
        <div className="w-full max-w-[820px] mx-auto">
          <Elements
            key={isLg ? "lg" : "mobile"}
            stripe={stripePromise}
            options={{
              clientSecret,
              locale: "en",
              appearance: {
                variables: {
                  colorPrimary: "#E76B39",
                  colorBackground: "#ffffff",
                  colorText: "#2A2E3F",
                  colorDanger: "#ef4444",
                  fontSizeBase: isLg ? "16px" : "14px",
                  fontSizeSm: isLg ? "14px" : "13px",
                  spacingUnit: isLg ? "4px" : "3px",
                  borderRadius: "8px",
                },
              },
            }}
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
              extras={extras}
              standards={standards}
              promotionCode={promotionCode}
              promotionDiscount={promotionDiscount}
              promotionIds={promotionIds}
            />
          </Elements>
        </div>
      )}
      {method === "credit-card" && !clientSecret && stripeInitError && (
        <p className="mt-3 text-sm text-red-500 font-sans">
          {stripeInitError}
        </p>
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

      {/* Mobile: BookingDetailCard โชว์เฉพาะ cash (ฝั่ง credit card มีการ์ดใน CheckoutConfirm/CreditCardCheckout แล้ว) */}
      {method === "cash" && (
        <div className="lg:hidden mt-6">
          <BookingDetailCard
            orderId={orderId}
            extras={extras}
            standards={standards}
            promotionCode={promotionCode}
            promotionDiscount={promotionDiscount}
          />
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
