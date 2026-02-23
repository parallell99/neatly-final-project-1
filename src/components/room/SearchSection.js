"use client";

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format, addDays, isLastDayOfMonth, addMonths } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import RoomsGuestsSelector from "@/components/ui/RoomsGuestsSelector";

export default function SearchSection() {
  const [date, setDate] = useState({
    from: undefined,
    to: undefined,
  });

  const [openCheckIn, setOpenCheckIn] = useState(false);
  const [openCheckOut, setOpenCheckOut] = useState(false);

  const [checkInMonth, setCheckInMonth] = useState(new Date());
  const [checkOutMonth, setCheckOutMonth] = useState(new Date());

  const [numRooms, setNumRooms] = useState(1);
  const [numAdults, setNumAdults] = useState(2);
  const [numKids, setNumKids] = useState(0);

  const [showBar, setShowBar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Scroll hide/show
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > lastScrollY && window.scrollY > 100) {
        setShowBar(false);
      } else {
        setShowBar(true);
      }
      setLastScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const handleSearch = () => {
    console.log({
      checkIn: date?.from,
      checkOut: date?.to,
      rooms: numRooms,
      adults: numAdults,
      kids: numKids,
    });
  };

  return (
    <section
      className={`sticky top-0 z-40 transition-transform duration-300 ${
        showBar ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="w-full bg-white shadow-md h-[156px] flex items-center">
        <div className="w-full px-6 lg:px-[160px]">
          <div className="flex items-end gap-6">
            
            {/* Check In */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-[#344054] mb-2">
                Check In
              </label>

              <Popover open={openCheckIn} onOpenChange={setOpenCheckIn}>
                <PopoverTrigger asChild>
                  <button
                    className="group w-full h-[48px] px-4 border border-gray-300 rounded text-left text-sm flex items-center justify-between hover:border-orange-500 transition"
                  >
                    <span>
                      {date?.from
                        ? format(date.from, "EEE, dd MMM yyyy")
                        : "Select date"}
                    </span>
                    <CalendarIcon className="h-5 w-5 text-[#98A2B3] group-hover:text-orange-500 transition" />
                  </button>
                </PopoverTrigger>

                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date?.from}
                    month={checkInMonth}
                    onMonthChange={setCheckInMonth}
                    disabled={{ before: today }}
                    onSelect={(selectedDate) => {
                      if (!selectedDate) return;

                      setDate({ from: selectedDate, to: undefined });
                      setCheckInMonth(selectedDate);

                      if (isLastDayOfMonth(selectedDate)) {
                        setCheckOutMonth(addMonths(selectedDate, 1));
                      } else {
                        setCheckOutMonth(selectedDate);
                      }

                      setTimeout(() => {
                        setOpenCheckOut(true);
                        setOpenCheckIn(false);
                      }, 500);
                    }}
                    initialFocus
                    className="p-6"
                    classNames={{
                      day_selected:
                        "bg-orange-600 text-white hover:bg-orange-600",
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Dash */}
            <div className="pb-3 text-gray-400 text-lg">-</div>

            {/* Check Out */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-[#344054] mb-2">
                Check Out
              </label>

              <Popover open={openCheckOut} onOpenChange={setOpenCheckOut}>
                <PopoverTrigger asChild>
                  <button
                    disabled={!date?.from}
                    className={`group w-full h-[48px] px-4 border rounded text-left text-sm flex items-center justify-between transition ${
                      date?.from
                        ? "border-gray-300 hover:border-orange-500"
                        : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <span>
                      {date?.to
                        ? format(date.to, "EEE, dd MMM yyyy")
                        : "Select date"}
                    </span>

                    <CalendarIcon
                      className={`h-5 w-5 transition ${
                        date?.from
                          ? "text-[#98A2B3] group-hover:text-orange-500"
                          : "text-gray-400"
                      }`}
                    />
                  </button>
                </PopoverTrigger>

                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date?.to}
                    month={checkOutMonth}
                    onMonthChange={setCheckOutMonth}
                    disabled={{
                      before: date?.from
                        ? addDays(date.from, 1)
                        : today,
                    }}
                    onSelect={(selectedDate) => {
                      if (!selectedDate) return;

                      setDate((prev) => ({
                        ...prev,
                        to: selectedDate,
                      }));

                      setCheckOutMonth(selectedDate);

                      setTimeout(() => {
                        setOpenCheckOut(false);
                      }, 500);
                    }}
                    initialFocus
                    className="p-6"
                    classNames={{
                      day_selected:
                        "bg-orange-600 text-white hover:bg-orange-600",
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Rooms & Guests */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-[#344054] mb-2">
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
            <div className="w-[140px]">
              <button
                onClick={handleSearch}
                className="w-full h-[48px] border border-orange-600 text-orange-600 rounded hover:bg-orange-600 hover:text-white transition font-medium"
              >
                Search
              </button>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}