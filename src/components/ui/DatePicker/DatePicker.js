"use client";

import React, { useState } from "react";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { CalendarDays } from 'lucide-react';
import { CircleAlert } from 'lucide-react';

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
          className="block text-sm font-medium text-gray-900 mb-2"
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
            w-full px-3 py-3 border rounded-[4px] pr-[16px]
            focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-transparent
            transition-all duration-200
            ${error 
              ? 'border-red bg-white' 
              : 'border-gray-300 bg-white hover:border-gray-400'
            }
            placeholder:text-gray-600
            text-gray-900
          `}
          {...props}
        />
        
        {error && (
          <span className={`absolute right-10  top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center`}>
            <CircleAlert className="w-4 h-4 text-red" />
          </span>
        )}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <CalendarDays className="w-4 h-4 text-gray-500" />
          
        </div>
      </div>
      {error && (
        <p className="mt-1 text-sm text-red">{error.message}</p>
      )}
    </div>
  );
}


// <DatePicker
// label="Date of Birth"
// name="dateOfBirth"
// placeholder="Select your date of birth"
// register={register}
// error={errors.dateOfBirth}
// setValue={setValue}
// watch={watch}
// required
// />