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
      <div className="flex flex-col flex-1 min-h-screen">
        <div className="flex-1 bg-white">
          {/* Back + Title */}
          <div className="flex  border-b border-gray-300 px-[60px] py-[16px] h-[80px] items-center">
            <Link
              href="/admin/customer-booking"
              className="inline-flex items-center gap-[16px]"
            >
              <span className="text-xl text-gray-600 " aria-hidden>←</span>
              <span className="headline-5 text-gray-900">{detail.customerName}</span>
              <span className="font-normal text-gray-900">{detail.roomTypeName}</span>
            </Link>
          </div>

          {/* gray background */}
          <div className="bg-gray-100 px-[60px] py-[50px]">
            {/* white card*/}
            <div className=" bg-white pt-[40px] px-[80px] pb-[60px] rounded-[4px] border border-gray-300">

              {/* Booking Details (top, full width) */}
              <div className="flex flex-col gap-[40px]">
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
                <div className="mt-[40px] py-[16px] px-[24px] bg-gray-100 rounded-lg">
                  <div className="pb-[16px] gap-[16px]">
                    <p className="text-gray-600 text-right body-1">
                      <span>Payment success</span>
                      {detail.paymentMethod === "Credit Card" && detail.cardLast4 ? (
                        <>
                          <span className="text-gray-600"> · </span>
                          <span className="font-sans font-semibold">via credit card - *{String(detail.cardLast4).slice(-3)}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-gray-600"> · </span>
                          <span>via - Cash</span>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="pb-[8px]">

                    <div className="flex flex-col py-[12px] gap-[24px] text-gray-700">
                      <div className="flex justify-between">
                        <span className="body-1 text-gray-900">{detail.roomTypeName}</span>
                        <span className="font-semibold text-gray-900">{roomSubtotalDisplay}</span>
                      </div>
                      {extras.map((extra, i) => (
                        <div key={i} className="flex justify-between gap-4">
                          <span className="body-1 text-gray-900">{extra.name}</span>
                          <span className="font-sans font-semibold text-gray-900">{formatPrice(extra.price)}</span>
                        </div>
                      ))}
                      {promotionDiscountAmount > 0 && (
                        <div className="flex justify-between gap-4">
                          <span className="body-1 text-gray-900">{promotionLabel}</span>
                          <span className="font-sans font-semibold text-gray-900">-{formatPrice(promotionDiscountAmount)}</span>
                        </div>
                      )}
                    </div>

                  </div>
                  <div className="flex flex-row justify-between pt-[24px] border-t border-gray-300 ">
                    <span className="body-1 text-gray-900">Total</span>
                    <span className="headline-5 text-gray-900">THB {totalDisplay}</span>
                  </div>
                </div>

              )}

              {/* Additional Request */}
              <div className="mt-6">
                <div className="bg-gray-300 rounded-lg border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-700 font-sans mb-2">Additional Request</h3>
                  <p className="body-1 text-gray-700">
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
      <p className="headline-5 text-gray-600">{label}</p>
      <p className="body-1 text-black">{value}</p>
    </div>
  );
}
