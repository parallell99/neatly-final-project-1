"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import "react-datepicker/dist/react-datepicker.css";
import { CalendarIcon } from "lucide-react";
import Button from "@/components/ui/buttons/buttons";
import BookingDetailCard from "@/components/booking/BookingDetailCard";
import { cn } from "@/lib/utils";
import CountrySelector from "@/components/ui/CountrySelector/CountrySelector";
import { ButtonCalendar } from "@/components/ui/booking/calendar-button";
import { Calendar } from "@/components/ui/booking/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/booking/popover";
import PhoneInput from "@/components/ui/PhoneInput/PhoneInput";
import { format } from "date-fns";
import { useAuth } from "@/contexts/authentication";

export default function BasicInformationForm({
  orderId,
  onNext,
  extras = [],
  standards = [],
}) {
  const { user: authUser, fetchUser } = useAuth();
  const [date, setDate] = useState(new Date());
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");

  const handleNext = () => {
    const phone = getValues("phoneNumber") ?? "";
    onNext?.({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone: String(phone).trim(),
    });
  };

  const {
    control,
    formState: { errors },
    setValue,
    getValues,
  } = useForm({
    defaultValues: { phoneNumber: "" },
  });

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // โหลดข้อมูลจากตาราง users (GET /api/auth/user คืนค่า SELECT ... FROM users)
  useEffect(() => {
    if (!authUser) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;
    axios
      .get("/api/auth/user", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const usersRow = res.data; // แถวจากตาราง users
        setFirstName(usersRow.first_name ?? "");
        setLastName(usersRow.last_name ?? "");
        setEmail(usersRow.email ?? usersRow.username ?? "");
        setCountry(usersRow.country ?? ""); // country จากตาราง users
        if (usersRow.phone) setValue("phoneNumber", usersRow.phone);
        if (usersRow.date_of_birth) {
          const parsed = new Date(usersRow.date_of_birth);
          if (!Number.isNaN(parsed.getTime())) setDate(parsed);
        }
      })
      .catch(() => {});
  }, [authUser, setValue]);

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
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
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
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-[#D6D9E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E76B39] focus:border-transparent font-sans text-base text-[#2A2E3F] bg-white"
          />
        </div>

        {/* Phone Number */}
        <PhoneInput
          label="Phone number"
          name="phoneNumber"
          control={control}
          placeholder="Enter your phone number"
          error={errors.phoneNumber}
          disableSearchIcon={true}
          country="th"
        />

        {/* Date of Birth */}
        <div className="w-full space-y-2 flex flex-col">
          <label htmlFor="dateOfBirth" className="font-400 text-[#2A2E3F] mb-2">
            Date of Birth
          </label>

          <Popover>
            <PopoverTrigger asChild>
              <ButtonCalendar
                variant="outline"
                className={cn(
                  "w-full h-[50px] justify-start text-left font-normal border-gray-400",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </ButtonCalendar>
            </PopoverTrigger>

            <PopoverContent className="w-auto p-0 bg-white shadow-md border">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>


        {/* Country */}
        <CountrySelector
          label="Country"
          name="country"
          placeholder="Select country"
          value={country}
          onChange={setCountry}
        />
      </div>

      {/* Navigation Buttons */}
      {/* Desktop */}
      <div className="hidden lg:flex items-center justify-between mt-8 pt-6">
        <button
          type="button"
          className="text-[#E76B39] font-sans text-base font-medium hover:text-[#C14817] transition-colors px-0 hover:cursor-pointer"
        >
          Back
        </button>

        <Button
          buttonStyle="primary"
          buttonText="Next"
          type="button"
          onClick={handleNext}
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
          className="text-orange-500 font-sans text-base font-medium hover:text-[#C14817] transition-colors px-0 hover:cursor-pointer"
        >
          Back
        </button>

        <Button
          buttonStyle="primary"
          buttonText="Next"
          type="button"
          className="w-[101px] h-[48px]"
          onClick={handleNext}
        />
      </div>
    </div>
  );
}
