"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Navbar from "@/components/layout/navbar";
import RefundCancelRequest from "@/components/booking/RefundCancelRequest";

function getImageSrc(img) {
  if (!img) return "";
  if (typeof img === "string") return img;
  return img?.src ?? String(img);
}

export default function RefundPage() {
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

  const handleCancel = () => {
    router.back();
  };

  const handleConfirm = () => {
    router.push(`/refund-booking/success?orderId=${encodeURIComponent(orderId || "")}`);
  };

  const roomName = room?.title ?? "Superior Garden View";
  const roomImage = room?.image_main
    ? getImageSrc(room.image_main)
    : room?.image_main;

  if (loading) {
    return (
      <div className="bg-[#F7F7FB] min-h-screen">
        <Navbar />
        <div className="w-full max-w-[900px] mx-auto px-4 py-6">
          <p className="font-sans text-gray-600">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F7F7FB] min-h-screen">
      <Navbar />
      <RefundCancelRequest
        type="refund"
        roomName={roomName}
        roomImage={roomImage || undefined}
        checkInDate={order?.check_in_date}
        checkOutDate={order?.check_out_date}
        guests={2}
        bookingDate={order?.created_at}
        totalRefund={order?.total_price != null ? Number(order.total_price) : 2300}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
