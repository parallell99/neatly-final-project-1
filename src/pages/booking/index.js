"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/authentication";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Navbar from "@/components/layout/navbar";
import BookingProgress from "@/components/booking/BookingProgress";
import BasicInformationForm from "@/components/booking/BasicInformationForm";
import SpecialRequestForm from "@/components/booking/SpecialRequestForm";
import PaymentMethodForm from "@/components/booking/PaymentMethodForm";
import PaymentFailed from "@/components/booking/PaymentFailed";
import PaymentSuccess from "@/components/booking/PaymentSuccess";
import BookingDetailCard from "@/components/booking/BookingDetailCard";
import BookingExpiredModal from "@/components/booking/BookingExpiredModal";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

export default function BookingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [extras, setExtras] = useState([]);
  const [standards, setStandards] = useState([]);
  const [additionalRequest, setAdditionalRequest] = useState("");
  const [promotionCode, setPromotionCode] = useState("");
  const [promotionDiscount, setPromotionDiscount] = useState(0);
  const [promotionId, setPromotionId] = useState(null);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Credit Card");
  const [cardLastDigits, setCardLastDigits] = useState("888");
  const { roomId } = router.query;
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [expiresAt, setExpiresAt] = useState(null);
  const [hasMarkedExpired, setHasMarkedExpired] = useState(false);
  const [guestData, setGuestData] = useState(null);

  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    if (orderId) return;

    const fetchLatestOrder = async () => {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;

        const res = await fetch("/api/booking/order-detail", {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : undefined,
        });

        if (!res.ok) return;

        const data = await res.json();
        const latestOrderId = data?.order?.id;
        if (latestOrderId) {
          setOrderId(latestOrderId);
        }
      } catch (err) {
        console.error("Failed to fetch latest order for user:", err);
      }
    };

    fetchLatestOrder();
  }, [orderId]);

  const handlePromotionChange = ({ code, discount, promotionId }) => {
    setPromotionCode(code);
    setPromotionDiscount(discount);
    setPromotionId(promotionId ?? null);
  };

  const handlePaymentConfirm = ({ success, paymentMethod: method, cardLastDigits: digits }) => {
    if (success) {
      const finalMethod = method || "Credit Card";
      const finalDigits = digits || "888";

      // เก็บวิธีจ่ายและเลขบัตรท้ายไว้ตาม orderId เพื่อใช้ในหน้า success (หลัง redirect)
      if (typeof window !== "undefined" && orderId) {
        try {
          window.sessionStorage.setItem(
            `booking:payment:${orderId}`,
            JSON.stringify({
              method: finalMethod,
              cardLastDigits: finalDigits,
            })
          );
        } catch {
          // ignore
        }
      }

      // Payment successful - redirect to persistent success page
      const finalOrderId = orderId;
      if (finalOrderId) {
        router.push(`/booking/${finalOrderId}/success`);
        return;
      }

      // fallback: keep old in-page success behaviour
      setPaymentMethod(finalMethod);
      setCardLastDigits(finalDigits);
      setPaymentSuccess(true);
    } else {
      // Payment failed - show Payment Failed UI
      setPaymentFailed(true);
    }
  };

  const handleBackToHome = () => {
    router.push("/");
  };

  const handleCheckBookingDetail = () => {
    // Reset to step 1 and clear payment states
    setPaymentFailed(false);
    setPaymentSuccess(false);
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToPaymentDetail = () => {
    setPaymentFailed(false);
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Restore step & basic state on refresh
  useEffect(() => {
    if (typeof window === "undefined") return;

    const raw = window.sessionStorage.getItem("booking:state:default");
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      if (parsed.currentStep) setCurrentStep(parsed.currentStep);
      if (Array.isArray(parsed.extras)) setExtras(parsed.extras);
      if (Array.isArray(parsed.standards)) setStandards(parsed.standards);
      if (typeof parsed.additionalRequest === "string") {
        setAdditionalRequest(parsed.additionalRequest);
      }
      if (typeof parsed.promotionCode === "string") {
        setPromotionCode(parsed.promotionCode);
      }
      if (typeof parsed.promotionDiscount === "number") {
        setPromotionDiscount(parsed.promotionDiscount);
      }
      if (parsed.promotionId) {
        setPromotionId(parsed.promotionId);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Persist step & selections while user is on the page
  useEffect(() => {
    if (typeof window === "undefined") return;

    const payload = {
      currentStep,
      extras,
      standards,
      additionalRequest,
      promotionCode,
      promotionDiscount,
      promotionId,
    };

    window.sessionStorage.setItem(
      "booking:state:default",
      JSON.stringify(payload)
    );
  }, [
    currentStep,
    extras,
    standards,
    additionalRequest,
    promotionCode,
    promotionDiscount,
    promotionId,
  ]);

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  // 1) ดึง expires_at ครั้งแรกจาก server
  useEffect(() => {
    if (!orderId || expiresAt || hasMarkedExpired) return;

    const checkExpiration = async () => {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const params = new URLSearchParams();
        params.set("orderId", orderId);

        const res = await fetch(
          `/api/booking/order-detail?${params.toString()}`,
          {
            headers: token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : undefined,
          }
        );

        if (!res.ok) return;

        const data = await res.json();
        const expiresAtStr = data?.order?.expires_at;
        if (!expiresAtStr) return;

        const parsed = new Date(expiresAtStr);
        if (Number.isNaN(parsed.getTime())) return;

        setExpiresAt(parsed.toISOString());
      } catch (err) {
        console.error("Failed to check booking expiration:", err);
      }
    };

    checkExpiration();
  }, [orderId, expiresAt, hasMarkedExpired]);

  // 2) ใช้ real-time timer ฝั่ง client ตรวจว่าเลยเวลาแล้วหรือยัง
  useEffect(() => {
    if (!expiresAt || hasMarkedExpired) return;

    const intervalId = setInterval(async () => {
      const now = new Date();
      const exp = new Date(expiresAt);
      if (Number.isNaN(exp.getTime())) return;

      if (now > exp && !hasMarkedExpired) {
        setHasMarkedExpired(true);

        try {
          const token =
            typeof window !== "undefined" ? localStorage.getItem("token") : null;
          if (token && orderId) {
            await fetch("/api/booking/update-payment-status", {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                orderId,
                status: "expired",
                paymentMethod: null,
              }),
            });
          }
        } catch (err) {
          console.error("Failed to update expired status:", err);
        }

        setShowExpiredModal(true);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [expiresAt, hasMarkedExpired, orderId]);

  // Show Payment Failed UI if payment failed
  if (paymentFailed) {
    return (
      <>
        <Navbar />
        <Elements stripe={stripePromise}>
        <PaymentFailed
          onBackToPaymentDetail={handleBackToPaymentDetail}
          orderId={orderId}
        />
        </Elements>
      </>
    );
  }

  return (
    <div className="bg-[#F7F7FB] flex flex-col min-h-screen">
      <Navbar />

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full lg:max-w-[1440px] lg:mx-auto lg:px-[165px] py-15">
          <h1 className="headline-3-booking-title text-[44px] text-green-800 mb-6 mx-4 lg:mx-0 lg:text-[68px]">
            Booking Room
          </h1>
          <BookingProgress currentStep={currentStep} />

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 mt-8">
            <div className="bg-white rounded-lg px-4 py-6 lg:p-8">
              {currentStep === 1 && (
                <BasicInformationForm
                  roomId={roomId}
                  orderId={orderId}
                  extras={extras}
                  standards={standards}
                  onNext={(data) => {
                    setGuestData(data);
                    setCurrentStep(2);
                  }}
                />
              )}
              {currentStep === 2 && (
                <SpecialRequestForm
                  orderId={orderId}
                  onBack={() => setCurrentStep(1)}
                  onNext={() => setCurrentStep(3)}
                  onExtrasChange={setExtras}
                  onStandardsChange={setStandards}
                  extras={extras}
                  standards={standards}
                  additionalRequest={additionalRequest}
                  onAdditionalChange={setAdditionalRequest}
                />
              )}
              {currentStep === 3 && (
                <PaymentMethodForm
                  onBack={() => setCurrentStep(2)}
                  onConfirm={handlePaymentConfirm}
                  promotionCode={promotionCode}
                  promotionDiscount={promotionDiscount}
                  onPromotionChange={handlePromotionChange}
                  extras={extras}
                  standards={standards}
                  user={user}
                  orderId={orderId}
                  guestData={guestData}
                  additionalRequest={additionalRequest}
                  promotionId={promotionId}
                />
              )}
            </div>

            <div className="hidden lg:block lg:sticky lg:top-8 h-fit">
              <BookingDetailCard
                orderId={orderId}
                extras={extras}
                standards={standards}
                promotionCode={promotionCode}
                promotionDiscount={promotionDiscount}
              />
            </div>
          </div>
        </div>
      </div>
      <BookingExpiredModal
        isOpen={showExpiredModal}
        onGoBack={() => {
          setShowExpiredModal(false);
          router.push("/search-rooms");
        }}
        onGoHome={() => {
          setShowExpiredModal(false);
          router.push("/");
        }}
      />
    </div>
  );
}
