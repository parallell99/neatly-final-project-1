"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Navbar from "@/components/layout/navbar";
import BookingActionSuccess from "@/components/bookingAction/BookingActionSuccess";

const SUCCESS_ACTIONS = ["refund", "cancel", "change-date"];

/**
 * หน้า success ร่วม: /booking-action/[orderId]/success?action=refund|cancel|change-date
 */
export default function BookingActionSuccessPage() {
  const router = useRouter();
  const { orderId, action } = router.query;
  const [order, setOrder] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  const actionStr = Array.isArray(action) ? action[0] : action;
  const isValidAction = typeof actionStr === "string" && SUCCESS_ACTIONS.includes(actionStr);

  useEffect(() => {
    if (!orderId || typeof orderId !== "string" || !isValidAction) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const params = new URLSearchParams();
    params.set("orderId", orderId);

    fetch(`/api/booking/order-detail?${params}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => (cancelled ? null : res.json()))
      .then((data) => {
        if (cancelled) return;
        setOrder(data?.order ?? null);
        setRoom(data?.room ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setOrder(null);
          setRoom(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orderId, isValidAction]);

  const handleBackToHome = () => {
    router.push("/");
  };

  if (!isValidAction) {
    return (
      <div className="bg-[#F5F5F5] min-h-screen">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-20">
          <p className="font-sans text-gray-600">Invalid action.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-[#F5F5F5] min-h-screen">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-20">
          <p className="font-sans text-gray-600">Loading…</p>
        </div>
      </div>
    );
  }

  const roomName = room?.title ?? "Superior Garden View";

  return (
    <div className="bg-[#F5F5F5] min-h-screen">
      <Navbar />
      <BookingActionSuccess
        type={actionStr}
        roomName={roomName}
        checkInDate={order?.check_in_date}
        checkOutDate={order?.check_out_date}
        guests={2}
        bookingDate={order?.created_at}
        cancellationDate={new Date().toISOString()}
        totalRefund={
          actionStr === "refund" && order?.total_price != null
            ? Number(order.total_price)
            : undefined
        }
        onBackToHome={handleBackToHome}
      />
    </div>
  );
}
