"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/authentication";
import Navbar from "@/components/layout/navbar";
import BookingProgress from "@/components/booking/BookingProgress";
import BasicInformationForm from "@/components/booking/BasicInformationForm";
import SpecialRequestForm from "@/components/booking/SpecialRequestForm";
import PaymentMethodForm from "@/components/booking/PaymentMethodForm";
import PaymentFailed from "@/components/booking/PaymentFailed";
import PaymentSuccess from "@/components/booking/PaymentSuccess";
import BookingDetailCard from "@/components/booking/BookingDetailCard";

export default function BookingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [orderId] = useState(() => `order-${Date.now()}`);
  const [extras, setExtras] = useState([]);
  const [promotionCode, setPromotionCode] = useState("");
  const [promotionDiscount, setPromotionDiscount] = useState(0);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Credit Card");
  const [cardLastDigits, setCardLastDigits] = useState("888");

  const handlePromotionChange = ({ code, discount }) => {
    setPromotionCode(code);
    setPromotionDiscount(discount);
  };

  const handlePaymentConfirm = ({ success, paymentMethod: method, cardLastDigits: digits }) => {
    if (success) {
      // Payment successful - show Payment Success UI
      setPaymentMethod(method || "Credit Card");
      setCardLastDigits(digits || "888");
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

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  // Show Payment Success UI if payment succeeded
  if (paymentSuccess) {
    return (
      <>
        <Navbar />
        <PaymentSuccess
          extras={extras}
          promotionCode={promotionCode}
          promotionDiscount={promotionDiscount}
          paymentMethod={paymentMethod}
          cardLastDigits={cardLastDigits}
          onBackToHome={handleBackToHome}
          onCheckBookingDetail={handleCheckBookingDetail}
        />
      </>
    );
  }

  // Show Payment Failed UI if payment failed
  if (paymentFailed) {
    return (
      <>
        <Navbar />
        <PaymentFailed
          onBackToHome={handleBackToHome}
          onCheckBookingDetail={handleCheckBookingDetail}
        />
      </>
    );
  }

  return (
    <div className="bg-[#F7F7FB] flex flex-col min-h-screen">
      <Navbar />

      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-[1440px] w-full lg:px-[165px] py-15">
          <h1 className="headline-3-booking-title text-[44px] text-green-800 mb-6 mx-4 lg:mx-0 lg:text-[68px]">
            Booking Room
          </h1>
          <BookingProgress currentStep={currentStep} />

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 mt-8">
            <div className="bg-white rounded-lg px-4 py-6 lg:p-8">
              {currentStep === 1 && (
                <BasicInformationForm onNext={() => setCurrentStep(2)} />
              )}
              {currentStep === 2 && (
                <SpecialRequestForm
                  onBack={() => setCurrentStep(1)}
                  onNext={() => setCurrentStep(3)}
                  onExtrasChange={setExtras}
                  extras={extras}
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
                  user={user}
                  orderId={orderId}
                />
              )}
            </div>

            <div className="hidden lg:block lg:sticky lg:top-8 h-fit">
              <BookingDetailCard
                extras={extras}
                promotionCode={promotionCode}
                promotionDiscount={promotionDiscount}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
