"use client";

import { useRouter } from "next/router";
import BookingActionPage from "@/components/bookingAction/BookingActionPage";

export default function BookingActionRoute() {
  const router = useRouter();
  const { orderId, action } = router.query;

  return <div className="lg:flex lg:justify-center"><BookingActionPage orderId={orderId} action={action} /></div>;
}
