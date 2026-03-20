"use client";

import Button from "@/components/ui/buttons/buttons";
import ErrorIcon from "@/assets/icons/error.svg?url";
import { useStripe} from "@stripe/react-stripe-js";
import { useState } from "react";

export default function PaymentFailed({ onBackToPaymentDetail, orderId }) {
  const stripe = useStripe();
  const [loading, setLoading] = useState(false);


  const handleBackToPaymentDetail = () => {
    if (onBackToPaymentDetail) {
      onBackToPaymentDetail();
    } else {
      window.location.href = "/booking";
    }
  };


  const handleRetryPayment = async () => {
    if (loading) return; // กันกดซ้ำ

    try {
      setLoading(true);

      const res = await fetch("/api/booking/retry-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();

      const result = await stripe.confirmCardPayment(data.clientSecret);

      if (result.error) {
        console.log("Retry failed:", result.error.message);
      } else {
        console.log("Payment success");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="w-full h-full flex flex-col items-center bg-orange-100 py-80 lg:w-[738px] lg:h-[349px] lg:justify-center lg:p-0 lg:my-20">
        {/* Error Icon */}
        <img src={ErrorIcon} className="w-16 h-16 text-orange-600" alt="" aria-hidden />

        {/* Error Title */}
        <h1 className="headline-3 text-[#CE6F3E] my-6 text-center">
          Payment failed
        </h1>

        {/* Error Message */}
        <div className="text-center mb-8">
          <p className="font-sans text-base text-orange-500">
            There seems to be an issue with your card.
          </p>
          <p className="font-sans text-base text-orange-500">
            Please check your card details and try again later, or use a different payment method.
          </p>
        </div>

        {/* Action Buttons */}
      </div>

      {/*Mobile*/}
      <div className="w-full flex flex-col items-center gap-4 pt-10 lg:hidden">
        <Button
          buttonStyle="primary"
          buttonText="Back to Payment details"
          type="button"
          onClick={handleBackToPaymentDetail}
          className="w-[327px]"
        />
         <button
          type="button"
          onClick={handleRetryPayment}
          className="text-orange-500 font-sans text-base font-medium hover:text-[#C14817] transition-colors text-center pt-1"
        >
          Retry payment
        </button>
      </div>

      {/*Desktop*/}
      <div className="hidden lg:flex lg:w-full flex-row items-center justify-center gap-10">
        <button
          type="button"
          onClick={handleRetryPayment}
          className="text-orange-500 font-sans text-base font-medium hover:text-[#C14817] transition-colors text-center pt-1"
        >
          Retry payment
        </button>
        <Button
          buttonStyle="primary"
          buttonText="Back to Payment details"
          type="button"
          onClick={handleBackToPaymentDetail}
          className="w-[270px] h-[48px]"
        />
      </div>
    </div>
  );
}
