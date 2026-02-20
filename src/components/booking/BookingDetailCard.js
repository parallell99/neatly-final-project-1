"use client";

import CsBookingIcon from "@/assets/icons/cs_booking.svg";

const ROOM_PRICE = 2500;

export default function BookingDetailCard({
  extras = [],
  promotionCode = "",
  promotionDiscount = 0,
}) {
  const extrasTotal = extras.reduce((sum, e) => sum + e.price, 0);
  const subtotal = ROOM_PRICE + extrasTotal;
  const total = Math.max(0, subtotal - promotionDiscount);

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-green-600 rounded-xl text-white pb-2 lg:w-[358px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 p-4 bg-green-800 rounded-t-lg">
          <div className="w-full flex items-center gap-2">
            <CsBookingIcon
              width={24}
              height={24}
              className="text-green-500"
              role="img"
              aria-label="Booking detail"
            />
            <h3 className="headline-5 text-white">Booking Detail</h3>
          </div>
          <div className="bg-orange-200 px-2 py-1 rounded text-4 font-sans font-medium text-orange-700">
            04:55
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

        {/* Date && Guests */}
        <div className="pl-4">
          <p className="text-base text-white">
            Th, 19 Oct 2022 - Fri, 20 Oct 2022
          </p>
          <p className="text-base text-white mt-1">
            2 Guests
          </p>
        </div>

        {/* Room Details + Extras */}
        <div className="pt-6 mt-4 mx-4 lg:mt-10 space-y-4">
          <div className="flex items-center justify-between pb-6">
            <span className="font-sans text-base text-green-300">
              Superior Garden View Room
            </span>
            <span className="font-sans text-base font-semibold">
              2,500.00
            </span>
          </div>
          {extras.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between relative pb-6"
            >
              <span className="font-sans text-base text-green-300">
                {item.label}
              </span>
              <span className="font-sans text-base font-semibold">
                {item.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
          {promotionCode && promotionDiscount > 0 && (
            <div className="flex items-center justify-between pb-6">
              <span className="font-sans text-base text-green-300">
                Promotion Code
              </span>
              <span className="font-sans text-base font-semibold text-white">
                -{promotionDiscount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="border-t border-green-500 pt-6 mb-4 mx-4">
          <div className="flex items-center justify-between">
            <span className="font-sans text-base font-light">Total</span>
            <span className="font-sans text-xl font-semibold text-white">
              THB {total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
      {/* Policy Notes */}
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
