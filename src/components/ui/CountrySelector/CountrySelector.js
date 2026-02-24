"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { countries } from "@/utils/dataCountries";

export default function CountrySelector({
  label,
  placeholder = "Select your country",
  error,
  name,
  required = false,
  disabled = false,
  value,
  onChange,
  ...props
}) {
  const selectedCountry = value ?? "";

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
      <Select
        value={selectedCountry || undefined}
        onValueChange={onChange}
        disabled={disabled}
        required={required}
        {...props}
      >
        <SelectTrigger
          id={name}
          className={`w-full h-[48px]! px-3 flex items-center justify-between gap-2 rounded-[4px] border text-left text-[16px] font-normal text-gray-900 ${
            disabled
              ? "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"
              : error
                ? "border-red-500 bg-white focus:ring-1 focus:ring-orange-500 focus:border-transparent"
                : "border-gray-300 bg-white hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-transparent"
          } placeholder:text-gray-500`}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {countries.map((country) => (
            <SelectItem key={country} value={country}>
              {country}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <div className="flex items-center gap-2 mt-1">
          <p id={`${name}-error`} className="text-[14px] text-red">
            {error.message}
          </p>
        </div>
      )}
    </div>
  );
}
