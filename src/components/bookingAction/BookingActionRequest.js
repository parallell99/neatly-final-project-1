"use client";

import React, { useMemo, useState } from "react";
import { format as formatDateFns, addDays, isLastDayOfMonth, addMonths } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import Button from "@/components/ui/buttons/buttons";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const opts = { weekday: "short", day: "numeric", month: "short", year: "numeric" };
  return d.toLocaleDateString("en-GB", opts);
}

function parseISODateToLocalDate(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return null;
  // Treat YYYY-MM-DD as local date to avoid timezone shifting.
  const d = new Date(`${dateStr}T00:00:00`);
  // If invalid date, return null.
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDateToISO(date) {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getImageSrc(img) {
  if (!img) return "";
  if (typeof img === "string") return img;
  return img?.src ?? String(img);
}

export default function BookingActionRequest({
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
  const isRefund = type === "refund";
  const isChangeDate = type === "change-date";

  const checkInOutStr =
    checkInDate && checkOutDate
      ? `${formatDate(checkInDate)} - ${formatDate(checkOutDate)}`
      : "Thu, 19 Oct 2022 - Fri, 20 Oct 2022";
  const bookingDateStr = bookingDate ? formatDate(bookingDate) : "Tue, 18 Oct 2022";
  const refundFormatted =
    totalRefund != null
      ? Number(totalRefund).toLocaleString("en-US", { minimumFractionDigits: 2 })
      : "2,300.00";

  const initialFrom = useMemo(() => parseISODateToLocalDate(checkInDate), [checkInDate]);
  const initialTo = useMemo(() => parseISODateToLocalDate(checkOutDate), [checkOutDate]);

  const [date, setDate] = useState({ from: initialFrom ?? undefined, to: initialTo ?? undefined });
  const [openCheckIn, setOpenCheckIn] = useState(false);
  const [openCheckOut, setOpenCheckOut] = useState(false);
  const [checkInMonth, setCheckInMonth] = useState(initialFrom ?? new Date());
  const [checkOutMonth, setCheckOutMonth] = useState(initialTo ?? new Date());

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const isInvalidRange =
    isChangeDate &&
    (!date?.from ||
      !date?.to ||
      (date?.from && date?.to && date.to.getTime() <= date.from.getTime()));

  const handleCancel = () => {
    if (onCancel) onCancel();
    else if (typeof window !== "undefined") window.history.back();
  };

  const handleConfirm = () => {
    if (!onConfirm) return;
    if (isChangeDate) {
      onConfirm({
        checkInDate: formatDateToISO(date?.from),
        checkOutDate: formatDateToISO(date?.to),
      });
      return;
    }
    onConfirm();
  };

  const imageSrc = roomImage ? getImageSrc(roomImage) : "";
  const imageAlt = typeof roomImage === "object" && roomImage?.alt ? roomImage.alt : roomName;

  return (
    <div className="w-[343px] lg:w-[1440px] py-10 lg:py-20 lg:px-40">
      <h1 className="font-serif headline-3-refund text-[40px] text-green-800 ml-4 lg:mx-0 lg:text-[68px]">
        {isChangeDate ? (
          <>
            {/* Mobile */}
            <span className="lg:hidden">
              Change <br /> Check-in and <br /> Check-out Date
            </span>

            {/* Desktop (lg ขึ้นไป) */}
            <span className="hidden lg:block">
              Change Check-in <br />
              and Check-out Date
            </span>
          </>
        ) : isRefund ? (
          "Request a Refund"
        ) : (
          "Cancel Booking"
        )}
      </h1>

      {/* Booking Detail Card */}
      <div>
        <div className="w-[375px] flex flex-col lg:mt-12 lg:flex-row lg:gap-6 lg:pb-10 lg:w-[1120px]">
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
          <div className="flex-1 mt-6 ml-4 flex flex-col gap-2 justify-center lg:w-[715px]">
            <div className="flex flex-col items-start justify-between gap-2 mb-4 lg:flex-row">
              <h2 className="headline-4 text-gray-900">{roomName}</h2>
              <p className="body-1 text-gray-500 w-full sm:w-auto lg:pt-2">
                Booking date: {bookingDateStr}
              </p>
            </div>
            {isChangeDate ? (
              <div className="mt-2">
                <div className="text-sm font-sans text-gray-600">
                  <span className="font-medium text-gray-700">Original Date</span>
                  <div className="mt-1 text-gray-700">{checkInOutStr}</div>
                </div>

                <div className="w-[343px] mt-8 bg-white p-4 rounded-lg lg:w-[750px]">
                  <p className="font-sans text-sm font-medium text-gray-700 mb-3">
                    Change Date
                  </p>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    {/* Check In */}
                    <div className="w-full sm:flex-1">
                      <label className="block font-sans text-xs text-gray-600 mb-2">
                        Check In
                      </label>
                      <Popover open={openCheckIn} onOpenChange={setOpenCheckIn}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="group w-full h-[48px] px-4 border border-gray-300 rounded text-left text-sm flex items-center justify-between hover:border-orange-500 transition"
                          >
                            <span>
                              {date?.from
                                ? formatDateFns(date.from, "EEE, dd MMM yyyy")
                                : "Select date"}
                            </span>
                            <CalendarIcon className="h-5 w-5 text-[#98A2B3] group-hover:text-orange-500 transition" aria-hidden />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={date?.from}
                            month={checkInMonth}
                            onMonthChange={setCheckInMonth}
                            disabled={{ before: today }}
                            onSelect={(selectedDate) => {
                              if (!selectedDate) return;
                              setDate({ from: selectedDate, to: undefined });
                              setCheckInMonth(selectedDate);
                              if (isLastDayOfMonth(selectedDate)) {
                                setCheckOutMonth(addMonths(selectedDate, 1));
                              } else {
                                setCheckOutMonth(selectedDate);
                              }
                              setTimeout(() => {
                                setOpenCheckOut(true);
                                setOpenCheckIn(false);
                              }, 500);
                            }}
                            initialFocus
                            className="p-6"
                            classNames={{
                              day_selected:
                                "bg-orange-600 text-white hover:bg-orange-600",
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Dash */}
                    <div className="hidden sm:block pb-3 text-gray-400">–</div>

                    {/* Check Out */}
                    <div className="w-full sm:flex-1">
                      <label className="block font-sans text-xs text-gray-600 mb-2">
                        Check Out
                      </label>
                      <Popover open={openCheckOut} onOpenChange={setOpenCheckOut}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            disabled={!date?.from}
                            className={`group w-full h-[48px] px-4 border rounded text-left text-sm flex items-center justify-between transition ${date?.from
                                ? "border-gray-300 hover:border-orange-500"
                                : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                              }`}
                          >
                            <span>
                              {date?.to
                                ? formatDateFns(date.to, "EEE, dd MMM yyyy")
                                : "Select date"}
                            </span>
                            <CalendarIcon
                              className={`h-5 w-5 transition ${date?.from
                                  ? "text-[#98A2B3] group-hover:text-orange-500"
                                  : "text-gray-400"
                                }`}
                              aria-hidden
                            />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={date?.to}
                            month={checkOutMonth}
                            onMonthChange={setCheckOutMonth}
                            disabled={{
                              before: date?.from
                                ? addDays(date.from, 1)
                                : today,
                            }}
                            onSelect={(selectedDate) => {
                              if (!selectedDate) return;
                              setDate((prev) => ({ ...prev, to: selectedDate }));
                              setCheckOutMonth(selectedDate);
                              setTimeout(() => setOpenCheckOut(false), 500);
                            }}
                            initialFocus
                            className="p-6"
                            classNames={{
                              day_selected:
                                "bg-orange-600 text-white hover:bg-orange-600",
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {isInvalidRange && (
                    <p className="mt-2 font-sans text-xs text-red-600">
                      Please select a valid check-in and check-out date.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="lg:flex lg:flex-row lg:justify-between">
                <div className="mt-4 lg:flex lg:flex-col lg:gap-2">
                  <p className="body-1 text-gray-700 mb-2">{checkInOutStr}</p>
                  <p className="body-1 text-gray-700 mb-4">{guests} Guests</p>
                  {!isRefund && (
                    <p className="w-[343px] font-sans text-xs text-red-600 mt-2 lg:w-[715px]">
                      * Cancellation of this booking will not be able to request a refund.
                    </p>
                  )}
                </div>

                {isRefund ? (
                  <div className="mt-10 border-t border-gray-100 lg:border-none lg:mt-3">
                    <div className="flex flex-col justify-between items-baseline gap-2">
                      <span className="body-1 text-gray-900 lg:pl-[42px]">Total Refund</span>
                      <span className="headline-5 text-gray-900">THB {refundFormatted}</span>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse items-start pl-4 lg:flex-row lg:items-center lg:justify-between gap-6 mt-8 lg:border-t border-gray-300 lg:pt-10 lg:w-[1150px]">
        <button
          type="button"
          onClick={handleCancel}
          className="font-sans text-base text-[#CE6F3E] hover:text-[#C14817] transition-colors cursor-pointer ml-36 lg:ml-0"
        >
          Cancel
        </button>
        <Button
          buttonStyle="primary"
          buttonText={
            isChangeDate
              ? "Confirm Change Date"
              : isRefund
                ? "Cancel and Refund this Booking"
                : "Cancel this Booking"
          }
          type="button"
          onClick={handleConfirm}
          disabled={isInvalidRange}
          className="w-[343px] lg:mx-0"
        />
      </div>
    </div>
  );
}
