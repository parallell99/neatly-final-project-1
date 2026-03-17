"use client";

import { useRouter } from "next/router";
import Navbar from "@/components/layout/navbar";
import PaymentSuccess from "@/components/booking/PaymentSuccess";

export default function BookingSuccessPage() {
  const router = useRouter();
  const { orderId } = router.query;

  const handleBackToHome = () => {
    router.push("/");
  };

  const handleCheckBookingDetail = () => {
    router.push("/booking-history");
  };

  return (
    <>
      <Navbar />
      <PaymentSuccess
        orderId={typeof orderId === "string" ? orderId : undefined}
        onBackToHome={handleBackToHome}
        onCheckBookingDetail={handleCheckBookingDetail}
      />
    </>
  );
}

