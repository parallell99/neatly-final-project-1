
"use client";

import React from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/CountrySelector/combobox";
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
  // for react-hook-form support: set value back to '' (if undefined) and treat as controlled
  const selectedCountry = value ?? "";
  const selectedCountryObj = countries.find(
    (c) => c.code === selectedCountry
  );

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
      <Combobox
        value={selectedCountryObj?.name || ""}
        onValueChange={(nextValue) => onChange?.(nextValue ?? "")}
        disabled={disabled}
        items={countries}
        {...props}
      >
        <ComboboxInput
          id={name}
          placeholder={placeholder}
          className={`w-full h-[48px] px-3 border rounded-[4px] text-[16px] font-normal shadow-none !ring-0 !ring-transparent !placeholder:text-[16px] !placeholder:text-gray-500 text-gray-500${disabled
              ? "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"
              : `${error
                ? "bg-white"
                : "border-gray-300 bg-white hover:border-gray-400"
              }  text-black`
            }`}
          autoComplete="off"
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
        />

        <ComboboxContent className={`mt-1 mb-1 `}>
          <ComboboxEmpty>
            <div className="text-sm text-gray-500">
              No countries found
            </div>
          </ComboboxEmpty>
          <ComboboxList>
            {(country) => (
              <ComboboxItem
                key={country.code}
                value={country.code}   // เก็บ code
                className={`w-full text-sm rounded-[4px] focus:outline-none
        ${selectedCountry === country.code ? "bg-gray-200" : ""}`}
              >
                <span>{country.name}</span>  {/* แสดงชื่อ */}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
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
