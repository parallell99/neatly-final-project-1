"use client";

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import axios from "axios";
import { format, addDays, isLastDayOfMonth, addMonths } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import RoomsGuestsSelector from "@/components/ui/RoomsGuestsSelector";

function parseDateStr(str) {
  if (!str) return undefined;
  const d = new Date(str + "T12:00:00");
  return isNaN(d.getTime()) ? undefined : d;
}

export default function SearchSection({ initialSearch, onOrdersChange, onLoadingChange }) {
  const [date, setDate] = useState({
    from: undefined,
    to: undefined,
  });

  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);

  const [openCheckIn, setOpenCheckIn] = useState(false);
  const [openCheckOut, setOpenCheckOut] = useState(false);

  const [checkInMonth, setCheckInMonth] = useState(new Date());
  const [checkOutMonth, setCheckOutMonth] = useState(new Date());

  const [numRooms, setNumRooms] = useState(initialSearch?.numRooms ?? 1);
  const [numAdults, setNumAdults] = useState(initialSearch?.numAdults ?? 2);
  const [numKids, setNumKids] = useState(initialSearch?.numKids ?? 0);

  const [showBar, setShowBar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Apply initialSearch from URL (e.g. from HeroSearch) and fetch orders
  useEffect(() => {
    if (!initialSearch?.checkIn || !initialSearch?.checkOut) return;
    const from = parseDateStr(initialSearch.checkIn);
    const to = parseDateStr(initialSearch.checkOut);
    if (!from || !to) return;
    setDate({ from, to });
    setCheckInMonth(from);
    setCheckOutMonth(to);
    setNumRooms(initialSearch.numRooms ?? 1);
    setNumAdults(initialSearch.numAdults ?? 2);
    setNumKids(initialSearch.numKids ?? 0);

    const fetchOrders = async () => {
      try {
        setSearchLoading(true);
        onLoadingChange?.(true);
        setError(null);
        const response = await axios.get("/api/availablerooms/order", {
          params: { checkIn: initialSearch.checkIn, checkOut: initialSearch.checkOut },
        });
        const data = response.data.data;
        if (onOrdersChange) onOrdersChange(data);
      } catch (err) {
        console.error("GET ORDERS ERROR:", err);
        setError(err.response?.data?.error || "Failed to load orders");
      } finally {
        setSearchLoading(false);
        onLoadingChange?.(false);
      }
    };
    fetchOrders();
  }, [initialSearch?.checkIn, initialSearch?.checkOut]);

  // Scroll hide/show
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > lastScrollY && window.scrollY > 100) {
        setShowBar(false);
      } else {
        setShowBar(true);
        console.log("setShowBar");
        
      }
      setLastScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const handleSearch = async () => {
    const checkInFormatted = date?.from ? format(date.from, "yyyy-MM-dd") : null;
    const checkOutFormatted = date?.to ? format(date.to, "yyyy-MM-dd") : null;
  
    if (!checkInFormatted || !checkOutFormatted) return;
  
    try {
      setSearchLoading(true);
      onLoadingChange?.(true);
      setError(null);
      const response = await axios.get("/api/availablerooms/order", {
        params: { checkIn: checkInFormatted, checkOut: checkOutFormatted },
      });

      const data = response.data.data;

      // ส่งข้อมูล order กลับไปให้ RoomsList
      if (onOrdersChange) {
        onOrdersChange(data);
      }
    } catch (error) {
      console.error("GET ORDERS ERROR:", error);
      setError(error.response?.data?.error || "Failed to load orders");
    } finally {
      setSearchLoading(false);
      onLoadingChange?.(false);
    }
  };
 
  return (
    <section className={`w-full sticky top-0 z-40 transition-transform duration-300 ease-in-out ${showBar ? "translate-y-0" : "-translate-y-full"}`}>
      <div className="w-full bg-white shadow-md">
        <div className="w-full px-4 md:px-6 lg:px-[160px] py-6 md:py-0 md:h-[156px] md:flex md:items-center">
          <div className="w-full flex flex-col md:flex-row md:items-end gap-5 md:gap-6">  
            {/* Check In */}
            <div className="w-full md:flex-1">
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
            <div className="hidden md:block pb-3 text-gray-400 text-lg">-</div>

            {/* Check Out */}
            <div className="w-full md:flex-1">
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
            <div className="w-full md:flex-1">
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
            <div className="w-full md:w-[140px] md:pb-0 pt-2 md:pt-0">
              <button
                onClick={handleSearch}
                disabled={searchLoading}
                className={`w-full h-[48px] border border-orange-600 rounded transition font-medium ${
                  searchLoading
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    : "text-orange-600 hover:bg-orange-600 hover:text-white"
                }`}
              >
                {searchLoading ? "Searching..." : "Search"}
              </button>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}