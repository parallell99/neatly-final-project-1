"use client";

import { X } from "lucide-react";
import Button from "../ui/buttons/buttons";

export default function CancelBookingModal({
  open,
  onClose,
  onConfirm,
  type = "refund"
}) {
  if (!open) return null;

  const isRefund = type === "refund";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">

      <div className="bg-white w-full max-w-sm rounded-md shadow-lg">

        {/* HEADER */}
        <div className="flex items-center justify-between p-5 border-b">
          <p className="font-semibold text-lg">
            Cancel Booking
          </p>

          <button
            type="button"
            className="hover:cursor-pointer"
            onClick={onClose}>
            <X size={20} className="text-gray-400 focus:outline-none" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 text-gray-700 body-1">

          {isRefund ? (
            <>
              <p>
                Are you sure you would like to cancel this booking?
              </p>
            </>
          ) : (
            <>
              <p>
                Cancellation of the booking now will not be able to request a refund.
              </p>

              <p>
                Are you sure you would like to cancel this booking?
              </p>
            </>
          )}

        </div>

        {/* BUTTONS */}
        <div className="p-5 flex flex-col gap-3">

          <Button
            type="button"
            buttonStyle="primary"
            buttonText="No, Don't Cancel"
            className="w-full whitespace-nowrap px-5 py-3"
            onClick={onClose}
          />

          <button
            onClick={onConfirm}
            className="border border-orange-500 text-orange-500 py-3 rounded-md body-1 text-center hover:cursor-pointer"
          >
            {isRefund ? (
              <>
                Yes, I want to cancel and{" "}
                <br className="block lg:hidden" />
                request refund
              </>
            ) : (
              "Yes, I want to cancel"
            )}
          </button>

        </div>

      </div>
    </div>
  );
}
