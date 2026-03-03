"use client";

import React, { useState, useEffect } from "react";
import CsBookingIcon from "@/assets/icons/cs_booking.svg";

function formatDateRange(checkIn, checkOut) {
  if (!checkIn || !checkOut) return "—";
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  const opts = { weekday: "short", day: "numeric", month: "short", year: "numeric" };
  return `${d1.toLocaleDateString("en-GB", opts)} - ${d2.toLocaleDateString("en-GB", opts)}`;
}

function useCountdown(expiresAt) {
  const [left, setLeft] = useState("—");
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const end = new Date(expiresAt).getTime();
      const now = Date.now();
      if (now >= end) {
        setLeft("00:00");
        return;
      }
      const m = Math.floor((end - now) / 60000);
      const s = Math.floor(((end - now) % 60000) / 1000);
      setLeft(`${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return left;
}

export default function BookingDetailCard({
  orderId,
  standards = [],
  extras = [],
  promotionCode = "",
  promotionDiscount = 0,
}) {
  const [order, setOrder] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  const countdown = useCountdown(order?.expires_at ?? null);
  console.log("BOOKING DETAIL orderId:", orderId);

  useEffect(() => {
    if (!orderId) return;   // ✅ รอจนกว่าจะมี orderId
  
    let cancelled = false;
    setLoading(true);
  
    (async () => {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token")
          : null;
  
      const params = new URLSearchParams();
      params.set("orderId", orderId);
  
      const res = await fetch(
        `/api/booking/order-detail?${params}`,
        {
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : {},
        }
      );
  
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
  
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const checkInStr = order?.check_in_date
    ? formatDateRange(order.check_in_date, order.check_out_date || order.check_in_date)
    : "—";

  const roomLabel = room?.name ?? "—";

  // ราคาห้องต่อคืน (ใช้ promotion_price_per_night ก่อน ถ้ามี)
  const nightlyPrice =
    room?.promotion_price_per_night != null
      ? Number(room.promotion_price_per_night) || 0
      : room?.price_per_night != null
        ? Number(room.price_per_night) || 0
        : 0;

  // จำนวนคืนจาก check-in / check-out
  let nights = 1;
  if (order?.check_in_date && order?.check_out_date) {
    const d1 = new Date(order.check_in_date);
    const d2 = new Date(order.check_out_date);
    const msPerDay = 24 * 60 * 60 * 1000;
    const diff = Math.round((d2 - d1) / msPerDay);
    if (Number.isFinite(diff) && diff > 0) {
      nights = diff;
    }
  }

  const quantity = order?.quantity != null ? Number(order.quantity) || 1 : 1;

  // ราคาห้องรวมต่อการเข้าพัก (ต่อทุกคืน x จำนวนห้อง)
  const baseRoomPrice =
    nightlyPrice > 0 ? nightlyPrice * nights * quantity : 0;

  const roomPrice =
    baseRoomPrice > 0
      ? baseRoomPrice.toLocaleString("en-US", {
          minimumFractionDigits: 2,
        })
      : order?.total_price != null
        ? Number(order.total_price).toLocaleString("en-US", {
            minimumFractionDigits: 2,
          })
        : "—";

  // ราคารวม extra requests
  const extrasTotal = extras.reduce(
    (sum, extra) => sum + (Number(extra.price ?? 0) || 0),
    0
  );

  // ส่วนลดเป็นเปอร์เซ็นต์จาก promotion (discount_percentage)
  const promoPercent = Number(promotionDiscount || 0) || 0;
  const subtotal = baseRoomPrice + extrasTotal;
  const discountAmount =
    promoPercent > 0 ? (subtotal * promoPercent) / 100 : 0;

  const totalNumber = Math.max(0, subtotal - discountAmount);

  const total =
    totalNumber > 0
      ? totalNumber.toLocaleString("en-US", {
          minimumFractionDigits: 2,
        })
      : "—";

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="bg-green-600 rounded-xl text-white pb-2 lg:w-[358px] p-4">
          <p className="text-base text-white">Loading booking…</p>
        </div>
        <div className="w-full h-[124px] bg-gray-300 flex flex-col justify-center rounded-xl p-4 gap-5 lg:w-[358px]">
          <p className="font-sans text-[12px] text-green-600 font-medium leading-relaxed">
            • Cancel booking will get full refund if the cancellation occurs before 24 hours of the check-in date.
          </p>
          <p className="font-sans text-[12px] text-green-600 font-medium leading-relaxed">
            • Able to change check-in or check-out date booking within 24 hours of the booking date
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-green-600 rounded-xl text-white pb-2 lg:w-[358px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 p-4 bg-green-800 rounded-t-lg">
          <div className="w-full flex items-center gap-2">
            <CsBookingIcon
              className="text-green-500 w-[24px] h-[24px]"
              alt="Booking detail"
              aria-hidden
            />
            <h3 className="headline-5 text-white">Booking Detail</h3>
          </div>
          <div className="bg-orange-200 px-2 py-1 rounded text-4 font-sans font-medium text-orange-700">
            {countdown}
          </div>
        </div>

        {/* Check-in/Check-out Info */}
        <div className="my-6 mx-4 flex flex-row justify-between lg:mb-10">
          <div className="flex flex-col gap-2">
            <p className="text-base text-white font-semibold">Check-in</p>
            <p className="text-base text-white">After 2:00 PM</p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-base text-white font-semibold">Check-out</p>
            <p className="text-base text-white">Before 12:00 PM</p>
          </div>
        </div>

        {/* Date */}
        <div className="pl-4">
          <p className="text-base text-white">{checkInStr}</p>
        </div>

        {/* Room + Total */}
        <div className="pt-6 mt-4 mx-4 lg:mt-10 space-y-4">
          <div className="flex items-center justify-between pb-6">
            <div className="flex flex-col">
              <span className="font-sans text-base text-green-300">
                {roomLabel}
              </span>
              <span className="font-sans text-xs text-green-200 mt-1">
                {nights} night{nights > 1 ? "s" : ""} · {quantity} room
                {quantity > 1 ? "s" : ""}
              </span>
            </div>
            <span className="font-sans text-base font-semibold">{roomPrice}</span>
          </div>
        </div>

        {/* Requests summary (live selections + promotion) */}
        {(standards.length > 0 || extras.length > 0 || !!promotionCode) && (
          <div className="mx-4 mb-4 space-y-3">
            {standards.length > 0 && (
              <div>
                <ul className="list-disc list-inside text-sm text-white space-y-0.5">
                  {standards.map((label) => (
                    <li key={label} className="flex">
                      {label}
                      </li>
                  ))}
                </ul>
              </div>
            )}
            {extras.length > 0 && (
              <div>
                <ul className="list-disc list-inside text-sm text-white space-y-0.5">
                  {extras.map((extra) => (
                    <li key={extra.label} className="flex flex-row justify-between">
                      {extra.label} 
                      <div>
                        {" "}
                      {Number(extra.price ?? 0).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {promotionCode && promoPercent > 0 && (
              <div>
                <ul className="list-disc list-inside text-sm text-white space-y-0.5">
                  <li className="flex flex-row justify-between">
                    {promotionCode}
                    <div>
                      {" "}
                      -
                      {promoPercent.toLocaleString("en-US", {
                        minimumFractionDigits: 0,
                      })}
                      %
                    </div>
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Total */}
        <div className="border-t border-green-500 pt-6 mb-4 mx-4">
          <div className="flex items-center justify-between">
            <span className="font-sans text-base font-light">Total</span>
            <span className="font-sans text-xl font-semibold text-white">
              THB {total}
            </span>
          </div>
        </div>
      </div>
      {/* Policy Notes - ไม่ดึงจาก DB */}
      <div className="w-full h-[124px] bg-gray-300 flex flex-col justify-center rounded-xl p-4 gap-5 lg:w-[358px]">
        <p className="font-sans text-[12px] text-green-600 font-medium leading-relaxed">
          • Cancel booking will get full refund if the cancellation occurs before 24 hours of the check-in date.
        </p>
        <p className="font-sans text-[12px] text-green-600 font-medium leading-relaxed">
          • Able to change check-in or check-out date booking within 24 hours of the booking date
        </p>
      </div>
    </div>
  );
}
