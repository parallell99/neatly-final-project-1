"use client";

import Button from "@/components/ui/buttons/buttons";

export default function BookingExpiredModal({
  isOpen,
  title = "Session expired",
  message = "Please start a new booking.",
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
      <div className="w-[90%] max-w-[520px] rounded-2xl bg-[#F7F7FB] shadow-2xl px-6 py-8 lg:px-10 lg:py-10 border border-[#E4E6ED]">
        <div className="mb-7 text-center">
          <h2
            id="booking-expired-title"
            className="headline-3 text-[#1F3B33] text-[24px] lg:text-[28px] font-semibold tracking-tight mb-3"
          >
            {title}
          </h2>
          <p className="font-sans text-sm lg:text-base text-[#4B5162] leading-relaxed max-w-md mx-auto">
            {message}
          </p>
        </div>

        <div className="mt-7 lg:mt-8 pt-4 border-t border-[#E4E6ED]">
          <p className="font-sans text-xs lg:text-sm text-[#7C8194] mb-4 text-center max-w-md mx-auto">
            You can start a new booking or return to the homepage.
          </p>

          <div className="flex flex-col-reverse gap-3 lg:flex-row lg:justify-center lg:gap-4 lg:mt-8">
            <button
              type="button"
              onClick={onGoBack}
              className="w-full lg:w-[200px] border border-[#E76B39] text-[#E76B39] font-sans text-sm lg:text-base font-medium rounded-lg h-[48px] hover:bg-orange-100 transition-colors hover:cursor-pointer"
            >
              Back to Search
            </button>
            <Button
              type="button"
              buttonStyle="primary"
              buttonText="Back to Home"
              onClick={onGoHome}
              className="w-full lg:w-[200px] h-[48px] text-sm lg:text-base"
            />
          </div>
        </div>
      </div>
    </div>
  );
}