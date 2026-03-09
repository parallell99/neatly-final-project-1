"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import SideBarAdmin from "@/components/layout/SideBarAdmin";

function formatDate(str) {
  if (!str) return "—";
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return str;
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function formatPrice(num) {
  if (num == null) return "0.00";
  return Number(num).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CustomerBookingDetail() {
  const router = useRouter();
  const id = router.query?.id;
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/admin/order-detail?id=${encodeURIComponent(id)}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? "Booking not found" : "Failed to load");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  if (!id) {
    return (
      <div className="flex">
        <SideBarAdmin />
        <div className="flex flex-col flex-1 bg-[#e8eef2] min-h-screen">
          <div className="flex-1 pt-px pb-px pl-0 pr-0 flex items-center justify-center">
            <p className="text-gray-500">No booking selected.</p>
            <Link href="/admin/customer-booking" className="ml-2 text-green-700 hover:underline">Back to list</Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex">
        <SideBarAdmin />
        <div className="flex flex-col flex-1 bg-[#e8eef2] min-h-screen">
          <div className="flex-1 pt-px pb-px pl-0 pr-0 flex items-center justify-center">
            <p className="text-gray-500">Loading…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="flex">
        <SideBarAdmin />
        <div className="flex flex-col flex-1 bg-[#e8eef2] min-h-screen">
          <div className="flex-1 pt-px pb-px pl-0 pr-0 flex items-center justify-center">
            <p className="text-red-600">{error || "Not found"}</p>
            <Link href="/admin/customer-booking" className="ml-2 text-green-700 hover:underline">Back to list</Link>
          </div>
        </div>
      </div>
    );
  }

  const roomSubtotalDisplay = detail.roomSubtotal != null ? formatPrice(detail.roomSubtotal) : "—";
  const totalDisplay = detail.totalPrice != null ? formatPrice(detail.totalPrice) : "—";
  const extras = Array.isArray(detail.extras) ? detail.extras : [];
  const roomSubtotalNum = Number(detail.roomSubtotal) || 0;
  const extrasTotalNum = Number(detail.extrasTotal) || 0;
  const subtotalBeforeDiscount = roomSubtotalNum + extrasTotalNum;
  const totalNum = Number(detail.totalPrice) || 0;
  // ส่วนลดที่ทำให้ Total ตรงกับที่จอง (กรณีมีโปรโมชันแต่ไม่มี promotion_id หรือคำนวณไม่ตรง)
  const impliedDiscount = Math.max(0, subtotalBeforeDiscount - totalNum);
  const promotionDiscountFromApi = Number(detail.promotionDiscount) || 0;
  const promotionDiscountAmount = impliedDiscount > 0 ? impliedDiscount : promotionDiscountFromApi;
  const promotionLabel = detail.promotionName ?? detail.promotionCode ?? "Promotion / Discount";

  return (
    <div className="flex">
      <SideBarAdmin />
      <div className="flex flex-col flex-1 bg-[#e8eef2] min-h-screen">
        <div className="flex-1 pt-px pb-px pl-0 pr-0 py-6 px-6">
          {/* Back + Title */}
          <div className="mb-6">
            <Link
              href="/admin/customer-booking"
              className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium"
            >
              <span className="text-xl" aria-hidden>←</span>
              <span className="font-semibold">{detail.customerName}</span>
              <span className="font-normal text-gray-600">{detail.roomTypeName}</span>
            </Link>
          </div>

          {/* White card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 max-w-4xl mx-auto overflow-hidden">
            <div className="p-8 md:p-10">
              {/* Booking Details (top, full width) */}
              <div className="space-y-5">
                <DetailRow label="Customer name" value={detail.customerName} />
                <DetailRow label="Guest(s)" value={detail.guests} />
                <DetailRow label="Room type" value={detail.roomType} />
                <DetailRow label="Amount" value={detail.amount} />
                <DetailRow label="Bed type" value={detail.bedType} />
                <DetailRow label="Check-in" value={formatDate(detail.checkIn)} />
                <DetailRow label="Check-out" value={formatDate(detail.checkOut)} />
                <DetailRow label="Stay (total)" value={detail.stayNights ? `${detail.stayNights} night${detail.stayNights !== 1 ? "s" : ""}` : "—"} />
                <DetailRow label="Booking date" value={formatDate(detail.bookingDate)} />
              </div>

              {/* Payment success – separate card */}
              {detail.paymentMethod && detail.paymentMethod !== "—" && (
                <div className="mt-8 pt-8">
                  <div className="bg-gray-100 rounded-lg border border-gray-200 p-5">
                    <p className="text-sm text-gray-500 text-right">
                      Payment success
                      {detail.paymentMethod === "Credit Card" && detail.cardLast4
                        ? ` · via credit card - *${String(detail.cardLast4).slice(-3)}`
                        : " ·via - Cash"}
                    </p>
                  </div>
                </div>
              )}

              {/* Payment Summary (below details, in its own box) */}
              <div className={detail.paymentMethod && detail.paymentMethod !== "—" ? "mt-6" : "mt-8 pt-8"}>
                <div className="bg-gray-100 rounded-lg border border-gray-200 p-5">
                  <div className="space-y-3 text-gray-700">
                    <div className="flex justify-between gap-4">
                      <span>{detail.roomTypeName}</span>
                      <span className="font-medium">{roomSubtotalDisplay}</span>
                    </div>
                    {extras.map((extra, i) => (
                      <div key={i} className="flex justify-between gap-4">
                        <span>{extra.name}</span>
                        <span className="font-medium">{formatPrice(extra.price)}</span>
                      </div>
                    ))}
                    {promotionDiscountAmount > 0 && (
                      <div className="flex justify-between gap-4">
                        <span>{promotionLabel}</span>
                        <span className="font-medium">-{formatPrice(promotionDiscountAmount)}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-baseline">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-gray-900">THB {totalDisplay}</span>
                  </div>
                </div>
              </div>

              {/* Additional Request */}
              <div className="mt-6">
                <div className="bg-gray-100 rounded-lg border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-900 mb-2">Additional Request</h3>
                  <p className="text-gray-600 text-sm">
                    {detail.additionalRequest || "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <p className="text-gray-600 mt-0.5">{value}</p>
    </div>
  );
}
