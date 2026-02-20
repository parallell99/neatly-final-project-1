"use client";

import React, { useState } from "react";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function DatePicker({
  label,
  placeholder,
  register,
  error,
  name,
  required = false,
  setValue,
  watch,
  ...props
}) {
  const [selectedDate, setSelectedDate] = useState(null);
  const value = watch(name);

  React.useEffect(() => {
    if (value) {
      setSelectedDate(new Date(value));
    }
  }, [value]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (date) {
      setValue(name, date.toISOString().split('T')[0], { shouldValidate: true });
    } else {
      setValue(name, '', { shouldValidate: true });
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={name} 
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <ReactDatePicker
          selected={selectedDate}
          onChange={handleDateChange}
          placeholderText={placeholder}
          dateFormat="dd/MM/yyyy"
          maxDate={new Date()}
          showYearDropdown
          showMonthDropdown
          dropdownMode="select"
          className={`
            w-full px-4 py-3 border rounded-lg pr-10
            focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent
            transition-all duration-200
            ${error 
              ? 'border-red-500 bg-red-50' 
              : 'border-gray-300 bg-white hover:border-gray-400'
            }
            placeholder:text-gray-400
            text-gray-900
          `}
          {...props}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg 
            className="w-5 h-5 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
        </div>
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error.message}</p>
      )}
    </div>
  );
}
