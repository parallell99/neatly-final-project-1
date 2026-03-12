"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Navbar from "@/components/layout/navbar";
import BookingActionRequest from "@/components/bookingAction/BookingActionRequest";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { BOOKING_ACTIONS, VALID_ACTIONS } from "@/components/bookingAction/BookingActionConfig";

function getImageSrc(img) {
  if (!img) return "";
  if (typeof img === "string") return img;
  return img?.src ?? String(img);
}

/**
 * หน้า logic ร่วมสำหรับ booking action (refund / cancel / change-date)
 * ใช้โดย pages/booking-action/[orderId]/[action].js
 */
export default function BookingActionPage({ orderId, action }) {
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmError, setConfirmError] = useState(null);

  const config = BOOKING_ACTIONS[action];
  const isValidAction = config && VALID_ACTIONS.includes(action);

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

  const handleCancel = () => {
    router.back();
  };

  const handleConfirmClick = () => {
    setConfirmError(null);
    setConfirmOpen(true);
  };

  const handleConfirmSuccess = async () => {
    const isCancelOrRefund = action === "cancel" || action === "refund";
    if (isCancelOrRefund && orderId) {
      const newStatus = action === "cancel" ? "cancelled" : "refunded";
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      setConfirmError(null);
      try {
        const res = await fetch("/api/booking/update-order-status", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ orderId, status: newStatus }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setConfirmError(data?.message || "Update failed. Please try again.");
          return;
        }
      } catch (err) {
        console.error("Update order status error:", err);
        setConfirmError("Something went wrong. Please try again.");
        return;
      }
    }
    if (config?.successPath) {
      router.push(config.successPath(orderId));
    }
    setConfirmOpen(false);
  };

  const roomName = room?.title ?? "Superior Garden View";
  const roomImage = room?.image_main
    ? getImageSrc(room.image_main)
    : room?.image_main;

  if (!isValidAction) {
    return (
      <div className="bg-[#F7F7FB] min-h-screen">
        <Navbar />
        <div className="w-full max-w-[900px] mx-auto px-4 py-6">
          <p className="font-sans text-gray-600">Invalid action.</p>
        </div>
      </div>
    );
  }

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
      <BookingActionRequest
        type={config.type}
        roomName={roomName}
        roomImage={roomImage || undefined}
        checkInDate={order?.check_in_date}
        checkOutDate={order?.check_out_date}
        guests={2}
        bookingDate={order?.created_at}
        totalRefund={
          order?.total_price != null ? Number(order.total_price) : 2300
        }
        onCancel={handleCancel}
        onConfirm={handleConfirmClick}
      />
      <ConfirmModal
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) setConfirmError(null);
        }}
        title={config.modalTitle}
        description={config.modalDescription}
        cancelLabel={config.modalCancelLabel}
        confirmLabel={config.modalConfirmLabel}
        onConfirm={handleConfirmSuccess}
        errorMessage={confirmError}
      />
    </div>
  );
}
