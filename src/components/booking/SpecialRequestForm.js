"use client";

import React, { useState, useEffect } from "react";
import Button from "@/components/ui/buttons/buttons";
import BookingDetailCard from "@/components/booking/BookingDetailCard";

const inputBase =
  "w-full px-4 py-3 border border-[#D6D9E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E76B39] focus:border-transparent font-sans text-base text-[#2A2E3F] bg-white";
const checkboxClass =
  "size-5 rounded border-[#D6D9E4] text-[#E76B39] focus:ring-[#E76B39] hover:cursor-pointer";

export default function SpecialRequestForm({
  orderId,
  onBack,
  onNext,
  onExtrasChange,
  onStandardsChange,
  extras = [],
  standards = [],
  additionalRequest = "",
  onAdditionalChange,
}) {
  const [standard, setStandard] = useState({});
  const [special, setSpecial] = useState({});
  const [specialOptions, setSpecialOptions] = useState([]);
  const [standardOptions, setStandardOptions] = useState([]);

  useEffect(() => {
    const loadExtrasRequests = async () => {
      try {
        const res = await fetch("/api/booking/extras-requests");
        if (!res.ok) {
          return;
        }
        const data = await res.json();
        const mapped = (data.extras ?? []).map((row) => ({
          id: row.id,
          label: row.name,
          price: row.price,
        }));
        setSpecialOptions(mapped);
      } catch (err) {
        console.error("Failed to load extras requests:", err);
      }
    };

    loadExtrasRequests();
  }, []);

  useEffect(() => {
    const loadStandardsRequests = async () => {
      try {
        const res = await fetch("/api/booking/standard-requests");
        if (!res.ok) {
          return;
        }
        const data = await res.json();
        const mapped = (data.standard ?? []).map((row) => ({
          id: row.id,
          label: row.name,
        }));
        setStandardOptions(mapped);
      } catch (err) {
        console.error("Failed to load standards requests:", err);
      }
    };

    loadStandardsRequests();
  }, []);

  // sync standard checkboxes with persisted selected labels
  useEffect(() => {
    if (!standardOptions.length) return;

    if (!standards || !standards.length) {
      setStandard({});
      return;
    }

    const next = {};
    standardOptions.forEach((opt) => {
      if (standards.includes(opt.label)) {
        next[opt.id] = true;
      }
    });
    setStandard(next);
  }, [standardOptions, standards]);

  // sync special (extras) checkboxes with persisted selected extras
  useEffect(() => {
    if (!specialOptions.length) return;

    if (!extras || !extras.length) {
      setSpecial({});
      return;
    }

    const next = {};
    specialOptions.forEach((opt) => {
      if (extras.some((e) => e.label === opt.label)) {
        next[opt.id] = true;
      }
    });
    setSpecial(next);
  }, [specialOptions, extras]);

  const toggleStandard = (id) => {
    const next = { ...standard, [id]: !standard[id] };
    setStandard(next);

    if (onStandardsChange) {
      const nextStandards = standardOptions
        .filter((opt) => next[opt.id])
        .map((opt) => opt.label);
      onStandardsChange(nextStandards);
    }
  };

  const toggleSpecial = (id) => {
    const next = { ...special, [id]: !special[id] };
    setSpecial(next);

    const nextExtras = specialOptions
      .filter((opt) => next[opt.id])
      .map((opt) => ({
        label: opt.label,
        price: opt.price,
      }));

    onExtrasChange?.(nextExtras);
  };

  return (
    <div>
      <h2 className="headline-5 text-gray-600 mb-2">Special Request</h2>

      {/* Standard Request */}
      <div className="mb-8">
        <p className="font-sans text-sm text-gray-600 mb-6">
          These requests are not confirmed (Depend on the available room)
        </p>
        <div className="flex flex-col gap-3">
          {standardOptions.map((opt) => (
            <label
              key={opt.id}
              className="flex items-center gap-3 cursor-pointer font-sans text-base text-gray-700"
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
          {specialOptions.map((opt) => (
            <label
              key={opt.id}
              className="flex items-center gap-3 cursor-pointer font-sans text-base text-gray-700"
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
          onChange={(e) => onAdditionalChange?.(e.target.value)}
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
        <BookingDetailCard
          orderId={orderId}
          extras={extras}
          standards={standards}
        />
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
