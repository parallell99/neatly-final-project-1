"use client";

import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";

const MIN_ROOMS = 1;
const MAX_ROOMS = 10;
const MIN_ADULTS = 1;
const MAX_ADULTS = 20;
const MIN_KIDS = 0;
const MAX_KIDS = 10;

const counterBtnClass =
  "size-9 rounded-full border-2 flex items-center justify-center font-sans text-lg leading-none transition-colors disabled:cursor-not-allowed";

function roomsGuestsLabel(rooms, adults, kids) {
  const parts = [
    `${rooms} room${rooms !== 1 ? "s" : ""}`,
    `${adults} adult${adults !== 1 ? "s" : ""}`,
    kids > 0 ? `${kids} kid${kids !== 1 ? "s" : ""}` : null,
  ].filter(Boolean);
  return parts.join(", ");
}

export default function RoomsGuestsSelector({ 
  numRooms: initialRooms = 1, 
  numAdults: initialAdults = 2, 
  numKids: initialKids = 0,
  onRoomsChange,
  onAdultsChange,
  onKidsChange
}) {
  const [numRooms, setNumRooms] = useState(initialRooms);
  const [numAdults, setNumAdults] = useState(initialAdults);
  const [numKids, setNumKids] = useState(initialKids);

  const handleRoomsChange = (newValue) => {
    setNumRooms(newValue);
    if (onRoomsChange) onRoomsChange(newValue);
  };

  const handleAdultsChange = (newValue) => {
    setNumAdults(newValue);
    if (onAdultsChange) onAdultsChange(newValue);
  };

  const handleKidsChange = (newValue) => {
    setNumKids(newValue);
    if (onKidsChange) onKidsChange(newValue);
  };

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="w-full h-12 px-4 py-6 border border-gray-300 rounded-md font-sans text-gray-700 bg-white flex items-center justify-between text-left"
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
                  onClick={() => handleRoomsChange(numRooms > MIN_ROOMS ? numRooms - 1 : numRooms)}
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
                  onClick={() => handleRoomsChange(numRooms < MAX_ROOMS ? numRooms + 1 : numRooms)}
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
                  onClick={() => handleAdultsChange(numAdults > MIN_ADULTS ? numAdults - 1 : numAdults)}
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
                  onClick={() => handleAdultsChange(numAdults < MAX_ADULTS ? numAdults + 1 : numAdults)}
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
                  onClick={() => handleKidsChange(numKids > MIN_KIDS ? numKids - 1 : numKids)}
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
                  onClick={() => handleKidsChange(numKids < MAX_KIDS ? numKids + 1 : numKids)}
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
  );
}
