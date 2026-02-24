"use client";

import React, { useState, useEffect } from "react";
import Button from "@/components/ui/buttons/buttons";
import BookingDetailCard from "@/components/booking/BookingDetailCard";

const STANDARD_OPTIONS = [
  { id: "early-checkin", label: "Early check-in" },
  { id: "late-checkout", label: "Late check-out" },
  { id: "non-smoking", label: "Non-smoking room" },
  { id: "high-floor", label: "A room on the high floor" },
  { id: "quiet", label: "A quiet room" },
];

const SPECIAL_OPTIONS = [
  { id: "baby-cot", label: "Baby cot", price: 400 },
  { id: "airport-transfer", label: "Airport transfer", price: 200 },
  { id: "extra-bed", label: "Extra bed", price: 500 },
  { id: "extra-pillows", label: "Extra pillows", price: 100 },
  { id: "chargers", label: "Phone chargers and adapters", price: 100 },
  { id: "breakfast", label: "Breakfast", price: 150 },
];

const inputBase =
  "w-full px-4 py-3 border border-[#D6D9E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E76B39] focus:border-transparent font-sans text-base text-[#2A2E3F] bg-white";
const checkboxClass =
  "size-5 rounded border-[#D6D9E4] text-[#E76B39] focus:ring-[#E76B39]";

export default function SpecialRequestForm({ orderId, onBack, onNext, onExtrasChange, extras = [] }) {
  const [standard, setStandard] = useState({});
  const [special, setSpecial] = useState({ "airport-transfer": true });
  const [additionalRequest, setAdditionalRequest] = useState("");

  const toggleStandard = (id) => {
    const next = { ...standard, [id]: !standard[id] };
    setStandard(next);
  };

  const toggleSpecial = (id) => {
    const next = { ...special, [id]: !special[id] };
    setSpecial(next);
    const extras = SPECIAL_OPTIONS.filter((opt) => next[opt.id]).map((opt) => ({
      label: opt.label,
      price: opt.price,
    }));
    onExtrasChange?.(extras);
  };

  useEffect(() => {
    const initial = SPECIAL_OPTIONS.filter((opt) => special[opt.id]).map((opt) => ({
      label: opt.label,
      price: opt.price,
    }));
    onExtrasChange?.(initial);
  }, []);

  return (
    <div>
      <h2 className="headline-5 text-gray-600 mb-2">Special Request</h2>

      {/* Standard Request */}
      <div className="mb-8">
        <p className="font-sans text-sm text-gray-600 mb-6">
          These requests are not confirmed (Depend on the available room)
        </p>
        <div className="flex flex-col gap-3">
          {STANDARD_OPTIONS.map((opt) => (
            <label
              key={opt.id}
              className="flex items-center gap-3 cursor-pointer font-sans text-base text-[#2A2E3F]"
            >
              <input
                type="checkbox"
                checked={!!standard[opt.id]}
                onChange={() => toggleStandard(opt.id)}
                className={checkboxClass}
                aria-label={opt.label}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {/* Special Request */}
      <div className="mb-8">
      <h2 className="headline-5 text-gray-600 mb-2">Special Request</h2>
        <p className="font-sans text-sm text-gray-600 mb-6">
          Additional charge may apply
        </p>
        <div className="flex flex-col gap-3">
          {SPECIAL_OPTIONS.map((opt) => (
            <label
              key={opt.id}
              className="flex items-center gap-3 cursor-pointer font-sans text-base text-[#2A2E3F]"
            >
              <input
                type="checkbox"
                checked={!!special[opt.id]}
                onChange={() => toggleSpecial(opt.id)}
                className={checkboxClass}
                aria-label={opt.label}
              />
              {opt.label} (+THB {opt.price})
            </label>
          ))}
        </div>
      </div>

      {/* Additional Request */}
      <div className="mb-8">
        <h3 className="font-sans text-base font-regular text-gray-900 mb-2">
          Additional Request
        </h3>
        <textarea
          value={additionalRequest}
          onChange={(e) => setAdditionalRequest(e.target.value)}
          placeholder="Enter any additional requests..."
          rows={5}
          className={`${inputBase} resize-y min-h-[120px]`}
          aria-label="Additional request"
        />
      </div>

      {/* Navigation - Desktop */}
      <div className="hidden lg:flex items-center justify-between mt-8 pt-6">
        <button
          type="button"
          onClick={onBack}
          className="text-[#E76B39] font-sans text-base font-medium hover:text-[#C14817] transition-colors px-0 hover:cursor-pointer"
        >
          Back
        </button>
        <Button
          buttonStyle="primary"
          buttonText="Next"
          type="button"
          onClick={onNext}
        />
      </div>

      {/* Mobile */}
      <div className="lg:hidden">
        <BookingDetailCard orderId={orderId} />
      </div>
      <div className="lg:hidden flex items-center justify-between mt-6 ml-2">
        <button
          type="button"
          onClick={onBack}
          className="text-orange-500 font-sans text-base font-medium hover:text-[#C14817] transition-colors px-0 hover:cursor-pointer"
        >
          Back
        </button>
        <Button
          buttonStyle="primary"
          buttonText="Next"
          type="button"
          onClick={onNext}
          className="w-[101px] h-[48px]"
        />
      </div>
    </div>
  );
}
