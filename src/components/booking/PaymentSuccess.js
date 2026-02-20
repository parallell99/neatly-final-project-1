"use client";

import Button from "@/components/ui/buttons/buttons";

const ROOM_PRICE = 2500;

export default function PaymentSuccess({
  extras = [],
  promotionCode = "",
  promotionDiscount = 0,
  paymentMethod = "Credit Card",
  cardLastDigits = "888",
  onBackToHome,
  onCheckBookingDetail,
}) {
  const extrasTotal = extras.reduce((sum, e) => sum + e.price, 0);
  const subtotal = ROOM_PRICE + extrasTotal;
  const total = Math.max(0, subtotal - promotionDiscount);

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
                  <br/> 
                  We will send
                  you more information about check-in and staying at our Neatly
                  <br/>
                  closer to your date of reservation
                </p>
              </div>

              {/* Booking Summary Card (Lighter Green) */}
              <div className="w-full bg-green-700 pt-5 lg:w-[738px]">
              <div className="bg-green-600 rounded-lg p-6 mb-6 mx-4 lg:flex lg:flex-row lg:justify-between lg:py-6 lg:mx-10">
                <div className="mb-4">
                  <p className="font-sans text-base text-white mb-2 lg:mb-0">
                    Th, 19 Oct 2022 - Fri, 20 Oct 2022
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
                <p className="font-sans text-base text-white mb-10">
                  Payment success via {paymentMethod} - *{cardLastDigits}
                </p>

                {/* Itemized Charges */}
                <div className="space-y-8 mb-6">
                  <div className="flex justify-between">
                    <span className="font-sans text-base text-white">
                      Superior Garden View Room
                    </span>
                    <span className="font-sans text-base text-white font-semibold">
                      2,500.00
                    </span>
                  </div>
                  {extras.map((item) => (
                    <div key={item.label} className="flex justify-between">
                      <span className="font-sans text-base text-white">
                        {item.label}
                      </span>
                      <span className="font-sans text-base text-white font-semibold">
                        {item.price.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  ))}
                  {promotionCode && promotionDiscount > 0 && (
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
                      THB {total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
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
