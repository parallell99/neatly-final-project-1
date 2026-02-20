"use client";

import { useState, useEffect, useRef } from "react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import HotelBgImg from "@/assets/images/7.jpg";
import Button from "@/components/ui/buttons/buttons";
import "react-day-picker/dist/style.css";

export default function HeroSearch() {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [roomsGuests, setRoomsGuests] = useState("1 room, 2 guests");
  const [showCheckOutCalendar, setShowCheckOutCalendar] = useState(false);
  const [selectedCheckOut, setSelectedCheckOut] = useState(null);
  const calendarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCheckOutCalendar(false);
      }
    };

    if (showCheckOutCalendar) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCheckOutCalendar]);

  return (
    <section className="relative w-full min-h-[764px] lg:min-h-[700px] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div 
          className="w-full h-full bg-no-repeat"
          style={{
            backgroundImage: `url(${HotelBgImg?.src ?? HotelBgImg})`,
            backgroundPosition: 'center center',
            backgroundSize: '320%',
          }}
        >
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/10"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 top-10 w-full max-w-[1200px] mx-auto px-4 lg:px-8">
        {/* Title */}
        <h1 className="font-serif headline-3 text-white text-center mb-8 lg:mb-12 leading-tight">
          A Best Place <br  /> for Your
          Neatly Experience
        </h1>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-xl p-6 lg:p-8 max-w-2xl mx-auto">
          <div className="space-y-6">
            {/* Check In */}
            <div>
              <label className="block text-gray-700 font-sans text-sm font-medium mb-2">
                Check In
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md font-sans text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent pr-10"
                  placeholder="June 01, 2025"
                />
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600"
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

            {/* Check Out */}
            <div>
              <label className="block text-gray-700 font-sans text-sm font-medium mb-2">
                Check Out
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md font-sans text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent pr-10"
                  placeholder="June 01, 2025"
                />
                <button
                  type="button"
                  onClick={() => setShowCheckOutCalendar(!showCheckOutCalendar)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 cursor-pointer"
                >
                  <svg
                    className="w-full h-full"
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
                </button>
                {showCheckOutCalendar && (
                  <div 
                    ref={calendarRef}
                    className="absolute z-50 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4"
                  >
                    <DayPicker
                      mode="single"
                      selected={selectedCheckOut}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedCheckOut(date);
                          setCheckOut(format(date, "MMMM dd, yyyy"));
                          setShowCheckOutCalendar(false);
                        }
                      }}
                      className="rounded-md"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Rooms & Guests */}
            <div>
              <label className="block text-gray-700 font-sans text-sm font-medium mb-2">
                Rooms & Guests
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={roomsGuests}
                  onChange={(e) => setRoomsGuests(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md font-sans text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent pr-10"
                  placeholder="Select rooms and guests"
                />
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            {/* Search Button */}
            <Button
              type="button"
              buttonStyle="primary"
              buttonText="Search"
              className="w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
