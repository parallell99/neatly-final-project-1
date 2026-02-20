"use client";

import { useState } from "react";
import HotelBgImg from "@/assets/images/7.jpg";
import Button from "@/components/ui/buttons/buttons";

function formatDateDisplay(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function HeroSearch() {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [roomsGuests, setRoomsGuests] = useState("1 room, 2 guests");

  const checkInMin = new Date().toISOString().slice(0, 10);
  const checkOutMin = checkIn || checkInMin;

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
                  type="date"
                  value={checkIn}
                  min={checkInMin}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md font-sans text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent [color-scheme:light]"
                  placeholder="June 01, 2025"
                  title={formatDateDisplay(checkIn) || "Select date"}
                />
              </div>
            </div>

            {/* Check Out */}
            <div>
              <label className="block text-gray-700 font-sans text-sm font-medium mb-2">
                Check Out
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={checkOut}
                  min={checkOutMin}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md font-sans text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent [color-scheme:light]"
                  placeholder="June 01, 2025"
                  title={formatDateDisplay(checkOut) || "Select date"}
                />
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
