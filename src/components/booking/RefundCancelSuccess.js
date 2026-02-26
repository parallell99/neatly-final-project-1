"use client";

import React from "react";
import Button from "@/components/ui/buttons/buttons";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const opts = { weekday: "short", day: "numeric", month: "short", year: "numeric" };
  return d.toLocaleDateString("en-GB", opts);
}

export default function RefundCancelSuccess({
  type = "cancel",
  roomName = "Superior Garden View",
  checkInDate,
  checkOutDate,
  guests = 2,
  bookingDate,
  cancellationDate,
  totalRefund,
  onBackToHome,
}) {
  const checkInOutStr =
    checkInDate && checkOutDate
      ? `${formatDate(checkInDate)} - ${formatDate(checkOutDate)}`
      : "Th, 19 Oct 2022 - Fri, 20 Oct 2022";
  const bookingDateStr = bookingDate ? formatDate(bookingDate) : "Tue, 16 Oct 2022";
  const cancellationDateStr = cancellationDate ? formatDate(cancellationDate) : "Tue, 16 Oct 2022";
  const refundFormatted =
    totalRefund != null
      ? Number(totalRefund).toLocaleString("en-US", { minimumFractionDigits: 2 })
      : "2,300.00";

  const isRefund = type === "refund";

  const handleBackToHome = () => {
    if (onBackToHome) {
      onBackToHome();
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="flex flex-col items-center justify-between bg-[#F5F5F5] lg:mt-20"> 
      <div className="w-full flex flex-col items-center pb-10">
        <div className="w-full max-w-[738px]">
          {/* Header - Dark Green */}
          <div className="bg-green-800 py-10 px-4 text-center lg:rounded-t-md">
            <h1 className="headline-3-refund text-[40px] text-white mb-4">
              {isRefund ? "Your Request has been Submitted" : "The Cancellation is Complete"}
            </h1>
            <p className="body-2 text-green-400 leading-relaxed max-w-[600px] mx-auto h-[63px]">
              {"The cancellation is complete."}
              <br />
              {isRefund
                ? "You will receive an email with a detail and refund within 48 hours."
                : "You will receive an email with a detail of cancellation within 24 hours."}
            </p>
          </div>

          {/* Booking Details - Lighter Green */}
          <div className="bg-green-700 px-4 pt-6 pb-8 lg:px-10 lg:rounded-b-md">
            <div className="bg-green-600 rounded-sm py-6 pl-5">
              <p className="headline-5 font-semibold text-white mb-4">{roomName}</p>
              <p className="font-sans text-base text-white mb-1">{checkInOutStr}</p>
              <p className="font-sans text-base text-white">{guests} Guests</p>
              <p className="body-1 text-green-300 mt-10">Booking date: {bookingDateStr}</p>
              <p className="body-1 text-green-300 mt-2">Cancellation date: {cancellationDateStr}</p>
            </div>

            {/* Total Refund - Dark Grey (Refund only) */}
            {isRefund && (
              <div className="border-t border-green-500 py-6 mt-10 flex justify-between items-center">
                <span className="body-1 text-green-300">Total Refund</span>
                <span className="headline-5 font-semibold text-white">THB {refundFormatted}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom - Back to Home Button */}
      <div className="w-full flex justify-center mb-5">
        <Button
          buttonStyle="primary"
          buttonText="Back to Home"
          type="button"
          onClick={handleBackToHome}
          className="w-[200px] h-[50px]"
        />
      </div>
    </div>
  );
}
