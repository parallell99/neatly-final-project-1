"use client";

import { useState } from "react";
import HotelBgImg from "@/assets/images/7.jpg";
import Button from "@/components/ui/buttons/buttons";
import RoomsGuestsSelector from "@/components/ui/RoomsGuestsSelector";

function formatDateDisplay(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

export default function HeroSearch() {
  const [checkIn, setCheckIn] = useState(getTodayString);
  const [checkOut, setCheckOut] = useState(getTodayString);
  const [numRooms, setNumRooms] = useState(1);
  const [numAdults, setNumAdults] = useState(2);
  const [numKids, setNumKids] = useState(0);

  const checkInMin = getTodayString();
  const checkOutMin = checkIn || checkInMin;

  return (
    <section className="relative w-full min-h-[764px] lg:h-[900px] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div 
          className="w-full h-full bg-no-repeat bg-center bg-[length:320%] lg:bg-cover"
          style={{
            backgroundImage: `url(${HotelBgImg?.src ?? HotelBgImg})`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/10"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 top-10 w-full max-w-[1200px] mx-auto px-4 lg:px-8">
        {/* Title */}
        <h1 className="font-serif headline-3 text-white text-center mb-8 lg:mb-12 leading-tight pb-10">
          A Best Place <br className="lg:hidden"/> for  Your <br className="max-lg:hidden"/>
          Neatly Experience
        </h1>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-xl p-6 lg:p-8 max-w-2xl lg:max-w-5xl mx-auto">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:gap-4">
            {/* Check In */}
            <div className="flex-1 min-w-0">
              <label className="block text-gray-700 font-sans text-sm font-medium mb-2">
                Check In
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={checkIn}
                  min={checkInMin}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md font-sans text-gray-700  [color-scheme:light]"
                  placeholder="June 01, 2025"
                  title={formatDateDisplay(checkIn) || "Select date"}
                />
              </div>
            </div>

            {/* Separator (desktop only) */}
            <div className="hidden lg:flex lg:items-center lg:pb-3 lg:shrink-0 text-gray-400" aria-hidden>
              –
            </div>

            {/* Check Out */}
            <div className="flex-1 min-w-0">
              <label className="block text-gray-700 font-sans text-sm font-medium mb-2">
                Check Out
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={checkOut}
                  min={checkOutMin}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md font-sans text-gray-700  [color-scheme:light]"
                  placeholder="June 01, 2025"
                  title={formatDateDisplay(checkOut) || "Select date"}
                />
              </div>
            </div>

            {/* Rooms & Guests */}
            <div className="flex-1 min-w-0">
              <label className="block text-gray-700 font-sans text-sm font-medium mb-2">
                Rooms & Guests
              </label>
              <RoomsGuestsSelector
                numRooms={numRooms}
                numAdults={numAdults}
                numKids={numKids}
                onRoomsChange={setNumRooms}
                onAdultsChange={setNumAdults}
                onKidsChange={setNumKids}
              />
            </div>

            {/* Search Button */}
            <Button
              type="button"
              buttonStyle="primary"
              buttonText="Search"
              className="w-full lg:w-auto lg:shrink-0 lg:px-8"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
