"use client";

import { useRouter } from "next/router";
import Navbar from "@/components/layout/navbar";
import PaymentFailed from "@/components/booking/PaymentFailed";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

export default function BookingFailedPage() {
  const router = useRouter();
  const { orderId } = router.query;

  const handleBackToPaymentDetail = () => {
    if (typeof orderId === "string") {
      router.push(`/booking/${orderId}`);
    } else {
      router.push("/booking");
    }
  };

  return (
    <>
      <Navbar />
      <Elements stripe={stripePromise}>
        <PaymentFailed
          orderId={typeof orderId === "string" ? orderId : undefined}
          onBackToPaymentDetail={handleBackToPaymentDetail}
        />
      </Elements>
    </>
  );
}

