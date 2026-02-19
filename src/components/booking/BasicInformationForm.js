"use client";

import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { CalendarDays } from "lucide-react";
import Button from "@/components/ui/buttons/buttons";
import BookingDetailCard from "@/components/booking/BookingDetailCard";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function BasicInformationForm() {
  const [startDate, setStartDate] = useState(new Date());

  return (
    <div>
      {/* Section Title */}
      <h2 className="headline-5 text-gray-600 mb-6">Basic Information</h2>

      {/* Form Fields */}
      <div className="space-y-6 pb-6">
        {/* First Name */}
        <div>
          <label
            htmlFor="firstName"
            className="block text-4 font-400 text-[#2A2E3F] mb-2"
          >
            First name
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            defaultValue="Kate"
            className="w-full px-4 py-3 border border-[#D6D9E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E76B39] focus:border-transparent font-sans text-base text-[#2A2E3F] bg-white"
          />
        </div>

        {/* Last Name */}
        <div>
          <label
            htmlFor="lastName"
            className="block text-4 font-400 text-[#2A2E3F] mb-2"
          >
            Last name
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            defaultValue="Cho"
            className="w-full px-4 py-3 border border-[#D6D9E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E76B39] focus:border-transparent font-sans text-base text-[#2A2E3F] bg-white"
          />
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-4 font-400 text-[#2A2E3F] mb-2"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            defaultValue="kate.cho@gmail.com"
            className="w-full px-4 py-3 border border-[#D6D9E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E76B39] focus:border-transparent font-sans text-base text-[#2A2E3F] bg-white"
          />
        </div>

        {/* Phone Number */}
        <div>
          <label
            htmlFor="phone"
            className="block text-4 font-400 text-[#2A2E3F] mb-2"
          >
            Phone number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            defaultValue="088 888 8888"
            className="w-full px-4 py-3 border border-[#D6D9E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E76B39] focus:border-transparent font-sans text-base text-[#2A2E3F] bg-white"
          />
        </div>

        {/* Date of Birth */}
        <div>
          <label
            htmlFor="dateOfBirth"
            className="block text-4 font-400 text-[#2A2E3F] mb-2"
          >
            Date of Birth
          </label>
          <DatePicker className="w-[343px] lg:w-[660px] px-4 py-3 border border-[#D6D9E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E76B39] focus:border-transparent font-sans text-base text-[#2A2E3F] bg-white" selected={startDate} onChange={(date) => setStartDate(date)} />
          <div className="relative">
            <div className="absolute right-4 top-[-25] -translate-y-1/2">
            <CalendarDays className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Country */}
        <div>
          <label
            htmlFor="country"
            className="block text-4 font-400 text-[#2A2E3F] mb-2"
          >
            Country
          </label>
          <Select defaultValue="Thailand" name="country">
            <SelectTrigger id="country" className="w-full">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="Thailand">Thailand</SelectItem>
                <SelectItem value="USA">USA</SelectItem>
                <SelectItem value="UK">UK</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Navigation Buttons */}
      {/* Desktop */}
      <div className="hidden lg:flex items-center justify-between mt-8 pt-6 border-t border-[#E4E6ED]">
        <button
          type="button"
          className="text-[#E76B39] font-sans text-base font-medium hover:text-[#C14817] transition-colors px-0"
        >
          Back
        </button>

        <Button
          buttonStyle="primary"
          buttonText="Next"
          type="button"
        />
      </div>

      {/* Mobile */}
      <div className="lg:hidden">
        <BookingDetailCard />
      </div>
      <div className="lg:hidden flex items-center justify-between mt-6 ml-2">
        <button
          type="button"
          className="text-orange-500 font-sans text-base font-medium hover:text-[#C14817] transition-colors px-0"
        >
          Back
        </button>

        <Button
          buttonStyle="primary"
          buttonText="Next"
          type="button"
          className="w-[101px] h-[48px]"
        />
      </div>
    </div>
  );
}
