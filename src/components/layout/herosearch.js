"use client";

import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import HotelBgImg from "@/assets/images/7.jpg";
import Button from "@/components/ui/buttons/buttons";

function formatDateDisplay(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

function roomsGuestsLabel(rooms, adults, kids) {
  const parts = [
    `${rooms} room${rooms !== 1 ? "s" : ""}`,
    `${adults} adult${adults !== 1 ? "s" : ""}`,
    kids > 0 ? `${kids} kid${kids !== 1 ? "s" : ""}` : null,
  ].filter(Boolean);
  return parts.join(", ");
}

const MIN_ROOMS = 1;
const MAX_ROOMS = 10;
const MIN_ADULTS = 1;
const MAX_ADULTS = 20;
const MIN_KIDS = 0;
const MAX_KIDS = 10;

const counterBtnClass =
  "size-9 rounded-full border-2 flex items-center justify-center font-sans text-lg leading-none transition-colors disabled:cursor-not-allowed";

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
              <Popover.Root>
                <Popover.Trigger asChild>
                  <button
                    type="button"
                    className="w-full h-12 px-4 py-3 border border-gray-300 rounded-md font-sans text-gray-700  bg-white flex items-center justify-between text-left"
                  >
                    <span>{roomsGuestsLabel(numRooms, numAdults, numKids)}</span>
                    <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Content
                    className="z-50 w-[var(--radix-popover-trigger-width)] rounded-md border border-gray-200 bg-white p-4 shadow-lg outline-none"
                    sideOffset={4}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-sans text-sm font-medium text-gray-700">Room</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            aria-label="Decrease rooms"
                            onClick={() => setNumRooms((n) => (n > MIN_ROOMS ? n - 1 : n))}
                            disabled={numRooms <= MIN_ROOMS}
                            className={`${counterBtnClass} ${numRooms <= MIN_ROOMS ? "border-gray-300 text-gray-400" : "border-orange-400 text-green-600 hover:bg-green-50"}`}
                          >
                            −
                          </button>
                          <span className="font-sans text-sm font-medium text-gray-900 min-w-6 text-center tabular-nums">
                            {numRooms}
                          </span>
                          <button
                            type="button"
                            aria-label="Increase rooms"
                            onClick={() => setNumRooms((n) => (n < MAX_ROOMS ? n + 1 : n))}
                            disabled={numRooms >= MAX_ROOMS}
                            className={`${counterBtnClass} ${numRooms >= MAX_ROOMS ? "border-gray-300 text-gray-400" : "border-orange-400 text-green-600 hover:bg-green-50"}`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-sans text-sm font-medium text-gray-700">Adult</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            aria-label="Decrease adults"
                            onClick={() => setNumAdults((n) => (n > MIN_ADULTS ? n - 1 : n))}
                            disabled={numAdults <= MIN_ADULTS}
                            className={`${counterBtnClass} ${numAdults <= MIN_ADULTS ? "border-gray-300 text-gray-400" : "border-orange-400 text-green-600 hover:bg-green-50"}`}
                          >
                            −
                          </button>
                          <span className="font-sans text-sm font-medium text-gray-900 min-w-6 text-center tabular-nums">
                            {numAdults}
                          </span>
                          <button
                            type="button"
                            aria-label="Increase adults"
                            onClick={() => setNumAdults((n) => (n < MAX_ADULTS ? n + 1 : n))}
                            disabled={numAdults >= MAX_ADULTS}
                            className={`${counterBtnClass} ${numAdults >= MAX_ADULTS ? "border-gray-300 text-gray-400" : "border-orange-400 text-green-600 hover:bg-green-50"}`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-sans text-sm font-medium text-gray-700">Kids</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            aria-label="Decrease kids"
                            onClick={() => setNumKids((n) => (n > MIN_KIDS ? n - 1 : n))}
                            disabled={numKids <= MIN_KIDS}
                            className={`${counterBtnClass} ${numKids <= MIN_KIDS ? "border-gray-300 text-gray-400" : "border-orange-400 text-green-600 hover:bg-green-50"}`}
                          >
                            −
                          </button>
                          <span className="font-sans text-sm font-medium text-gray-900 min-w-6 text-center tabular-nums">
                            {numKids}
                          </span>
                          <button
                            type="button"
                            aria-label="Increase kids"
                            onClick={() => setNumKids((n) => (n < MAX_KIDS ? n + 1 : n))}
                            disabled={numKids >= MAX_KIDS}
                            className={`${counterBtnClass} ${numKids >= MAX_KIDS ? "border-gray-300 text-gray-400" : "border-orange-400 text-green-600 hover:bg-green-50"}`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
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
