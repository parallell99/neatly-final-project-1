"use client";

import React from "react";
import Button from "@/components/ui/buttons/buttons";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const opts = { weekday: "short", day: "numeric", month: "short", year: "numeric" };
  return d.toLocaleDateString("en-GB", opts);
}

function getImageSrc(img) {
  if (!img) return "";
  if (typeof img === "string") return img;
  return img?.src ?? String(img);
}

export default function RefundCancelRequest({
  type = "cancel",
  roomName = "Superior Garden View",
  roomImage,
  checkInDate,
  checkOutDate,
  guests = 2,
  bookingDate,
  totalRefund,
  onCancel,
  onConfirm,
}) {
  const checkInOutStr =
    checkInDate && checkOutDate
      ? `${formatDate(checkInDate)} - ${formatDate(checkOutDate)}`
      : "Thu, 19 Oct 2022 - Fri, 20 Oct 2022";
  const bookingDateStr = bookingDate ? formatDate(bookingDate) : "Tue, 18 Oct 2022";
  const refundFormatted =
    totalRefund != null
      ? Number(totalRefund).toLocaleString("en-US", { minimumFractionDigits: 2 })
      : "2,300.00";

  const isRefund = type === "refund";

  const handleCancel = () => {
    if (onCancel) onCancel();
    else if (typeof window !== "undefined") window.history.back();
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
  };

  const imageSrc = roomImage ? getImageSrc(roomImage) : "";
  const imageAlt = typeof roomImage === "object" && roomImage?.alt ? roomImage.alt : roomName;

  return (
    <div className="w-[1120px] mx-auto py-10 lg:py-20">
      <h1 className="font-serif headline-3-refund text-[40px] text-green-800 mx-2 pl-2 lg:mx-0 lg:pl-0 lg:text-[68px]">
        {isRefund ? "Request a Refund" : "Cancel Booking"}
      </h1>

      {/* Booking Detail Card */}
      <div>
        <div className="flex flex-col lg:mt-12 lg:flex-row lg:gap-6 lg:pb-10">
          {/* Image - left */}
          <div className="w-full h-[221px] bg-gray-200 shrink-0 lg:w-[357px] lg:h-[210px] mt-6">
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={imageAlt}
                className="w-full h-full object-cover lg:rounded-lg"
              />
            ) : (
              <div
                className="w-full h-full bg-gray-300 flex items-center justify-center lg:rounded-lg"
                role="img"
                aria-label="Room placeholder"
              >
                <span className="text-gray-400 font-sans text-sm">{roomName}</span>
              </div>
            )}
          </div>

          {/* Details - right */}
          <div className="flex-1 p-4 flex flex-col gap-2">
            <div className="flex flex-col items-start justify-between gap-2 mb-4 lg:flex-row">
              <h2 className="headline-4 text-gray-900">{roomName}</h2>
              <p className="body-1 text-gray-500 w-full sm:w-auto lg:pt-2">
                Booking date: {bookingDateStr}
              </p>
            </div>
            <div className="lg:flex lg:flex-col lg:justify-between">
              <div className="mt-4 lg:flex lg:flex-col lg:gap-2">
            <p className="body-1 text-gray-700 mb-2">{checkInOutStr}</p>
            <p className="body-1 text-gray-700 mb-4">{guests} Guests</p>
            </div>

            {isRefund ? (
              <div className="mt-10 border-t border-gray-100 lg:border-none lg:mt-3">
                <div className="flex flex-col justify-between items-baseline gap-2">
                  <span className="body-1 text-gray-900 lg:pl-[42px]">Total Refund</span>
                  <span className="headline-5 text-gray-900">THB {refundFormatted}</span>
                </div>
              </div>
            ) : (
              <p className="w-[343px] font-sans text-xs text-red-600 mt-6 lg:w-[715px]">
                * Cancellation of this booking will not be able to request a refund.
              </p>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse items-start lg:flex-row lg:items-center lg:justify-between gap-6 mt-4 lg:border-t border-gray-300 lg:pt-10">
        <button
          type="button"
          onClick={handleCancel}
          className="font-sans text-base text-[#CE6F3E] hover:text-[#C14817] transition-colors cursor-pointer ml-40 lg:ml-0"
        >
          Cancel
        </button>
        <Button
          buttonStyle="primary"
          buttonText={isRefund ? "Cancel and Refund this Booking" : "Cancel this Booking"}
          type="button"
          onClick={handleConfirm}
          className="w-[343px] mx-4 lg:mx-0"
        />
      </div>
    </div>
  );
}
