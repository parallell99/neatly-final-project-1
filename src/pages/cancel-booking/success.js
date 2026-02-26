"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Navbar from "@/components/layout/navbar";
import RefundCancelSuccess from "@/components/booking/RefundCancelSuccess";

export default function CancelBookingSuccessPage() {
  const router = useRouter();
  const { orderId } = router.query;
  const [order, setOrder] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId || typeof orderId !== "string") {
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
  }, [orderId]);

  const handleBackToHome = () => {
    router.push("/");
  };

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

  return (
    <div className="bg-[#F5F5F5] min-h-screen">
      <Navbar />
      <RefundCancelSuccess
        type="cancel"
        roomName={room?.title ?? "Superior Garden View"}
        checkInDate={order?.check_in_date}
        checkOutDate={order?.check_out_date}
        guests={2}
        bookingDate={order?.created_at}
        cancellationDate={new Date().toISOString()}
        // totalRefund ไม่ใช้ในโหมด cancel
        onBackToHome={handleBackToHome}
      />
    </div>
  );
}

