"use client";

import React, { useState } from "react";
import { Eye, EyeOff, CircleAlert } from "lucide-react";

export default function Input({
  label,
  type = "text",
  placeholder,
  register,
  error,
  name,
  required = false,
  disabled = false,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;
  const hasRightIcon = error || isPassword;

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
      <div className="relative w-full">
        <input
          id={name}
          type={inputType}
          placeholder={placeholder}
          disabled={disabled}
          {...register(name)}
          className={`w-full pl-[12px] py-[12px] border rounded-[4px] focus:outline-none transition-all duration-200
            ${disabled
              ? "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"
              : `focus:ring-1 focus:ring-orange-500 focus:border-transparent
                ${error
                ? "border-red bg-white"
                : "border-gray-300 bg-white hover:border-gray-400"
              }
                placeholder:text-gray-600
                text-black
              `
            }
            ${hasRightIcon ? (error && isPassword ? "pr-16" : "pr-10") : "pr-[12px]"}
          `}
          {...props}
        />

        {error && !disabled && (
          <span className={`absolute top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center ${isPassword ? "right-10" : "right-3"}`}>
            <CircleAlert className="w-4 h-4 text-red" />
          </span>
        )}
        {isPassword && !disabled && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center p-0 border-0 bg-transparent cursor-pointer text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-0"
            aria-label={showPassword ? "Hide the password" : "Show the password"}
          >


            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="text-[14px] text-red">{error.message}</p>
      )}
    </div>
  );
}
