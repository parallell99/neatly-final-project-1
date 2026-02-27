"use client";

import { useRouter } from "next/router";
import Navbar from "@/components/layout/navbar";

/**
 * /booking-action เท่านั้น (ไม่มี orderId/action) – แนะนำให้ไปใช้ path แบบมี order และ action
 * ตัวอย่าง: /booking-action/[orderId]/refund , /booking-action/[orderId]/cancel
 */
export default function BookingActionIndex() {
  const router = useRouter();

  return (
    <div className="bg-[#F7F7FB] min-h-screen">
      <Navbar />
      <div className="w-full max-w-[900px] mx-auto px-4 py-6">
        <p className="font-sans text-gray-600 mb-2">
          Use a booking action URL with order and action.
        </p>
        <p className="font-sans text-sm text-gray-500">
          Example: /booking-action/your-order-id/refund or /booking-action/your-order-id/cancel
        </p>
        <button
          type="button"
          onClick={() => router.back()}
          className="font-sans text-base text-[#CE6F3E] hover:text-[#C14817] mt-4 cursor-pointer"
        >
          Go back
        </button>
      </div>
    </div>
  );
}
