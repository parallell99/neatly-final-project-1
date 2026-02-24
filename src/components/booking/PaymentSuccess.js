"use client";

import React, { useState, useEffect } from "react";
import Button from "@/components/ui/buttons/buttons";
import { useAuth } from "@/contexts/authentication";

function formatDateRange(checkIn, checkOut) {
  if (!checkIn || !checkOut) return "—";
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  const opts = { weekday: "short", day: "numeric", month: "short", year: "numeric" };
  return `${d1.toLocaleDateString("en-GB", opts)} - ${d2.toLocaleDateString("en-GB", opts)}`;
}

export default function PaymentSuccess({
  orderId,
  extras = [],
  promotionCode = "",
  promotionDiscount = 0,
  paymentMethod = "Credit Card",
  cardLastDigits = "888",
  onBackToHome,
  onCheckBookingDetail,
}) {
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const hasOrderId = orderId && typeof orderId === "string";

    if (!hasOrderId && !token) {
      setOrder(null);
      setRoom(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      const params = new URLSearchParams();
      if (hasOrderId) params.set("orderId", orderId);
      const url = `/api/booking/order-detail${params.toString() ? `?${params}` : ""}`;
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(url, { headers });
      if (cancelled) return;
      if (!res.ok) {
        setOrder(null);
        setRoom(null);
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (cancelled) return;
      setOrder(data.order ?? null);
      setRoom(data.room ?? null);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [orderId, user?.id]);

  const checkInStr = order?.check_in_date
    ? formatDateRange(order.check_in_date, order.check_out_date || order.check_in_date)
    : "—";
  const roomLabel = room?.title ?? "Superior Garden View Room";
  const roomPrice =
    room?.price_per_night != null
      ? Number(room.price_per_night).toLocaleString("en-US", { minimumFractionDigits: 2 })
      : order?.total_price != null
        ? Number(order.total_price).toLocaleString("en-US", { minimumFractionDigits: 2 })
        : "2,500.00";
  const total =
    order?.total_price != null
      ? Number(order.total_price).toLocaleString("en-US", { minimumFractionDigits: 2 })
      : (() => {
        const exTotal = (extras || []).reduce((sum, e) => sum + (e.price ?? 0), 0);
        const subtotal = 2500 + exTotal;
        return Math.max(0, subtotal - (promotionDiscount || 0)).toLocaleString("en-US", { minimumFractionDigits: 2 });
      })();

  const hasExtras = Array.isArray(extras) && extras.length > 0;
  const hasPromo = promotionCode && promotionDiscount > 0;

  const handleBackToHome = () => {
    if (onBackToHome) {
      onBackToHome();
    } else {
      window.location.href = "/";
    }
  };

  const handleCheckBookingDetail = () => {
    if (onCheckBookingDetail) {
      onCheckBookingDetail();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-between">
        <div className="w-full flex flex-col items-center">
          <div className="bg-green-800 flex flex-col pt-10 lg:w-[738px] lg:h-[300px] lg:mt-15">
            <div className="flex-1 flex flex-col items-center justify-center">
              <p className="font-sans text-base text-white">Loading booking details…</p>
            </div>
          </div>
        </div>
        <div className="w-full bg-white rounded-lg p-6 flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center lg:w-[500px] lg:mb-8 lg:mt-110">
          <button
            type="button"
            onClick={handleCheckBookingDetail}
            className="text-[#CE6F3E] font-sans text-base font-medium hover:text-[#C14817] transition-colors hover:cursor-pointer"
          >
            Check Booking Detail
          </button>
          <Button
            buttonStyle="primary"
            buttonText="Back to Home"
            type="button"
            onClick={handleBackToHome}
            className="w-full lg:w-auto"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-between">
      <div className="w-full flex flex-col items-center">
        <div className="bg-green-800 flex flex-col pt-10 lg:w-[738px] lg:h-[300px] lg:mt-15">
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full flex flex-col">
              {/* Header Section */}
              <div className="mb-8 text-center lg:flex lg:flex-col lg:items-center">
                <h1 className="headline-3 text-white mb-4 lg:w-[690px]">
                  Thank you for booking
                </h1>
                <p className="font-sans text-sm text-green-400 leading-relaxed px-2 lg:w-[690px]">
                  We are looking forward to hosting you at our place.
                  <br />
                  We will send
                  you more information about check-in and staying at our Neatly
                  <br />
                  closer to your date of reservation
                </p>
              </div>

              {/* Booking Summary Card (Lighter Green) */}
              <div className="w-full bg-green-700 pt-5 lg:w-[738px]">
                <div className="bg-green-600 rounded-lg p-6 mb-6 mx-4 lg:flex lg:flex-row lg:justify-between lg:py-6 lg:mx-10">
                  <div className="mb-4">
                    <p className="font-sans text-base text-white mb-2 lg:mb-0">
                      {checkInStr}
                    </p>
                    <p className="font-sans text-base text-white">2 Guests</p>
                  </div>
                  <div className="flex justify-between pt-4 lg:pt-0 lg:gap-6">
                    <div>
                      <p className="font-sans text-sm text-white mb-1">Check-in</p>
                      <p className="font-sans text-base text-white/80">After 2:00 PM</p>
                    </div>
                    <div>
                      <p className="font-sans text-sm text-white mb-1">Check-out</p>
                      <p className="font-sans text-base text-white/80">Before 12:00 PM</p>
                    </div>
                  </div>
                </div>

                {/* Payment Details Section (Dark Green Background) */}
                <div className="rounded-lg p-6 mb-6">
                  {paymentMethod?.toLowerCase() !== "cash" && (
                    <p className="font-sans text-base text-white mb-10">
                      Payment success via {paymentMethod} - *{cardLastDigits}
                    </p>
                  )}

                  {/* Itemized Charges - ข้อมูลจาก order/room เหมือน BookingDetailCard */}
                  <div className="space-y-8 mb-6">
                    <div className="flex justify-between">
                      <span className="font-sans text-base text-white">
                        {roomLabel}
                      </span>
                      <span className="font-sans text-base text-white font-semibold">
                        {roomPrice}
                      </span>
                    </div>
                    {hasExtras && extras.map((item) => (
                      <div key={item.label ?? item.id ?? Math.random()} className="flex justify-between">
                        <span className="font-sans text-base text-white">
                          {item.label}
                        </span>
                        <span className="font-sans text-base text-white font-semibold">
                          {(item.price ?? 0).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    ))}
                    {hasPromo && (
                      <div className="flex justify-between">
                        <span className="font-sans text-base text-white">
                          Promotion Code
                        </span>
                        <span className="font-sans text-base text-white font-semibold">
                          -{promotionDiscount.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="pt-8 border-t border-green-600">
                    <div className="flex justify-between">
                      <span className="font-sans text-xl text-white">
                        Total
                      </span>
                      <span className="font-sans text-xl text-white font-bold">
                        THB {total}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation (White Background) - Fixed at bottom */}
      <div className="w-full bg-white rounded-lg p-6 flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center lg:w-[500px] lg:mb-8 lg:mt-110">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-3 lg:gap-4">
            <button
              type="button"
              onClick={handleCheckBookingDetail}
              className="text-[#CE6F3E] font-sans text-base font-medium hover:text-[#C14817] transition-colors hover:cursor-pointer"
            >
              Check Booking Detail
            </button>
          </div>
        </div>
        <Button
          buttonStyle="primary"
          buttonText="Back to Home"
          type="button"
          onClick={handleBackToHome}
          className="w-full lg:w-auto"
        />
      </div>
    </div>
  );
}
