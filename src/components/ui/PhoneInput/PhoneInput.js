"use client";

import React from "react";
import { Controller } from "react-hook-form";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { CircleAlert } from 'lucide-react';

export default function PhoneInputField({
  label,
  name,
  control,
  error,
  placeholder = "Enter your phone number",
  required = false,
  disabled = false,
  country = "th",
  ...props
}) {
  return (
    <div className="flex flex-col w-full gap-[4px]">
      {label && (
        <label
          htmlFor={name}
          className={`font-normal text-[16px] text-gray-900 ${disabled ? "text-gray-400 cursor-not-allowed" : ""}`}
        >
          {label}
        </label>
      )}
      <Controller
        name={name}
        control={control}
        rules={{ required: required ? "Phone number is required" : false }}
        render={({ field: { onChange, value } }) => (
          <div className="relative w-full">
            <PhoneInput
              id={name}
              country={country}
              value={value || ""}
              onChange={(phone) => {
                const e164 = phone ? `+${phone.replace(/^\+/, "")}` : "";
                onChange(e164);
              }}
              placeholder={placeholder}
              disabled={disabled}
              enableSearch
              searchPlaceholder="search"
              disableSearchIcon
              containerClass="!w-full"
              searchClass="!bg-white !border !border-gray-300 !rounded-[4px] !px-3 !py-2 !mb-2"
              inputClass={`!w-full !pl-[48px] !h-[50px] !py-[12px] !border !rounded-[4px] focus:!outline-none transition-all duration-200 !text-[16px]
    ${disabled
                  ? "!bg-gray-100 !border-gray-300 !text-gray-500 cursor-not-allowed"
                  : `focus:!ring-1 focus:!ring-orange-500 focus:!border-transparent
        ${error
                    ? "!border-red !bg-white"
                    : "!border-gray-300 !bg-white hover:!border-gray-400"
                  }
        placeholder:!text-gray-600 !text-black`
                }`}
              buttonClass={`!h-[50px] !border !rounded-l-[4px] !bg-white
    ${error ? "!border-red" : "!border-gray-300"}
    ${disabled ? "!border-gray-300 !bg-gray-100" : ""}`}
              dropdownClass="!rounded-[4px] !border-gray-300"
              inputProps={{
                id: name,
                "aria-invalid": !!error,
                "aria-describedby": error ? `${name}-error` : undefined,
              }}
              {...props}
            />
            {error && !disabled && (
              <span className="absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                < CircleAlert className="w-4 h-4 text-red" />
              </span>
            )}
          </div>
        )}
      />
      {error && (
        <p id={`${name}-error`} className="text-[14px] text-red">
          {error.message}
        </p>
      )}
    </div>
  );
}