"use client";

import Button from "@/components/ui/buttons/buttons";

export default function BookingExpiredModal({
  isOpen,
  title = "Session expired",
  message = "The time limit for completing your booking or payment has passed. Your current booking session is no longer active.",
  onGoBack,
  onGoHome,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-expired-title"
    >
      <div className="w-[90%] max-w-[520px] rounded-xl bg-[#F7F7FB] shadow-2xl px-6 py-7 lg:px-8 lg:py-9 border border-[#E4E6ED]">
        <div className="mb-6 text-center">
          <h2
            id="booking-expired-title"
            className="headline-3 text-[#1F3B33] text-[26px] lg:text-[30px] mb-3"
          >
            {title}
          </h2>
          <p className="font-sans text-base text-[#4B5162] leading-relaxed">
            {message}
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-[#E4E6ED]">
          <p className="font-sans text-sm text-[#7C8194] mb-4 text-center">
            Your reservation has been released. You can start a new booking or return to the homepage.
          </p>

          <div className="flex flex-col-reverse gap-3 lg:flex-row lg:justify-between lg:mt-10">
            <button
              type="button"
              onClick={onGoBack}
              className="w-full lg:w-[200px] border border-[#E76B39] text-[#E76B39] font-sans text-base font-medium rounded-lg h-[48px] hover:bg-orange-50 transition-colors"
            >
              Back to Search
            </button>
            <Button
              type="button"
              buttonStyle="primary"
              buttonText="Back to Home"
              onClick={onGoHome}
              className="w-full lg:w-[200px] h-[48px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}