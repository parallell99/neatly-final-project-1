"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { format, addDays } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import HotelBgImg from "@/assets/images/7.jpg";
import Button from "@/components/ui/buttons/buttons";
import RoomsGuestsSelector from "@/components/ui/RoomsGuestsSelector";
import ChatbotButton from "@/components/layout/chatbot/ChatbotButton";
import { Calendar } from "@/components/ui/booking/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/booking/popover";

function getToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function getTomorrow() {
  return addDays(getToday(), 1);
}

const defaultBg = HotelBgImg?.src ?? HotelBgImg;

export default function HeroSearch() {
  const router = useRouter();
  const today = getToday();
  const [heroBgUrl, setHeroBgUrl] = useState(null);
  const [heroText, setHeroText] = useState("");
  const [heroTextMobile, setHeroTextMobile] = useState("");

  useEffect(() => {
    fetch("/api/hotel-information")
      .then((res) => res.json())
      .then((json) => {
        const d = json?.data;
        if (d) {
          setHeroBgUrl(d.hotelBgUrl ?? null);
          const t = d.hotelMainText && String(d.hotelMainText).trim();
          setHeroText(t || "");
          const m = d.hotelMainTextMobile && String(d.hotelMainTextMobile).trim();
          setHeroTextMobile(m || "");
        }
      })
      .catch(() => {});
  }, []);

  const [date, setDate] = useState(() => ({
    from: getToday(),
    to: getTomorrow(),
  }));
  const [openCheckIn, setOpenCheckIn] = useState(false);
  const [openCheckOut, setOpenCheckOut] = useState(false);
  const [numRooms, setNumRooms] = useState(1);
  const [numAdults, setNumAdults] = useState(2);
  const [numKids, setNumKids] = useState(0);

  const checkIn = date?.from ? format(date.from, "yyyy-MM-dd") : "";
  const checkOut = date?.to ? format(date.to, "yyyy-MM-dd") : "";

  const handleSearch = () => {
    if (!checkIn || !checkOut) return;
    const params = new URLSearchParams({
      checkIn,
      checkOut,
      rooms: String(numRooms),
      adults: String(numAdults),
      kids: String(numKids),
    });
    router.push(`/search-rooms?${params.toString()}`);
  };

  return (
    <>
      <ChatbotButton />

      <section className="relative w-full min-h-[764px] lg:h-[900px] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div
            className="absolute inset-0 w-full h-full bg-no-repeat bg-center bg-[length:320%] lg:bg-cover"
            style={{
              backgroundImage: `url(${heroBgUrl || defaultBg})`,
            }}
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/10"></div>
        </div>
        <div>
        {/* Title — แยกกล่อง ไม่ใช้ padding ของกล่องหลัก */}
        <div className="relative z-10 top-10 w-full">
          <h1 className="font-serif headline-3 text-white text-center mb-8 lg:mb-12 leading-tight pb-10 block">
            {/* แสดงเป็น 3 บรรทัดเหมือนที่ส่งมาจาก hotel-information (คั่นด้วย Enter) */}
            {/* Mobile */}
            <span className="lg:hidden block">
              {(heroTextMobile || heroText) ? (
                (() => {
                  const lines = (heroTextMobile || heroText).split("\n");
                  const three = [lines[0] ?? "", lines[1] ?? "", lines[2] ?? ""];
                  return three.map((line, i) => (
                    <span key={i} className="block">
                      {line}
                    </span>
                  ));
                })()
              ) : (
                <>
                  <span className="block">A Best Place</span>
                  <span className="block">for Your Neatly</span>
                  <span className="block">Experience</span>
                </>
              )}
            </span>
            {/* Desktop */}
            <span className="hidden lg:block">
              {heroText ? (
                (() => {
                  const lines = heroText.split("\n");
                  const three = [lines[0] ?? "", lines[1] ?? "", lines[2] ?? ""];
                  return three.map((line, i) => (
                    <span key={i} className="block">
                      {line}
                    </span>
                  ));
                })()
              ) : (
                <>
                  <span className="block">A Best Place for Your</span>
                  <span className="block">Neatly Experience</span>
                </>
              )}
            </span>
          </h1>
        </div>

        {/* กล่องหลัก — Search Form มี padding แยกจาก Title */}
        <div className="relative z-10 w-full max-w-[1200px] mx-auto px-4 lg:px-8">
          <div className="bg-white rounded-lg shadow-xl p-6 lg:p-8 min-w-[343px] w-full max-w-2xl lg:w-[1120px] lg:max-w-[1120px] mx-auto">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:gap-4">
              {/* Check In */}
              <div className="flex-1 min-w-0">
                <label className="block text-gray-700 font-sans text-sm font-medium mb-2">
                  Check In
                </label>
                <Popover open={openCheckIn} onOpenChange={setOpenCheckIn}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="w-full px-4 py-3 border border-gray-300 rounded-md font-sans text-gray-700 bg-white text-left flex items-center justify-between hover:border-orange-500 transition [color-scheme:light]"
                    >
                      <span>{date?.from ? format(date.from, "MMM d, yyyy") : "Select date"}</span>
                      <CalendarIcon className="h-5 w-5 text-gray-400 shrink-0" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      defaultMonth={date?.from ?? today}
                      selected={date?.from}
                      onSelect={(d) => {
                        if (!d) return;
                        setDate((prev) => {
                          const to = prev?.to && d > prev.to ? d : prev?.to ?? d;
                          return { from: d, to };
                        });
                        setOpenCheckIn(false);
                        setOpenCheckOut(true);
                      }}
                      disabled={{ before: today }}
                      className="p-6 bg-white border border-gray-300 rounded-md font-sans text-gray-700"
                    />
                  </PopoverContent>
                </Popover>
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
                <Popover open={openCheckOut} onOpenChange={setOpenCheckOut}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      disabled={!date?.from}
                      className={`w-full px-4 py-3 border rounded-md font-sans text-left flex items-center justify-between transition [color-scheme:light] ${
                        date?.from
                          ? "border-gray-300 text-gray-700 bg-white hover:border-orange-500"
                          : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <span>{date?.to ? format(date.to, "MMM d, yyyy") : "Select date"}</span>
                      <CalendarIcon className={`h-5 w-5 shrink-0 ${date?.from ? "text-gray-400" : "text-gray-400"}`} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      defaultMonth={date?.to ?? date?.from ?? today}
                      selected={date?.to}
                      onSelect={(d) => {
                        if (!d) return;
                        setDate((prev) => ({ ...prev, to: d }));
                        setOpenCheckOut(false);
                      }}
                      disabled={{ before: date?.from ?? today }}
                      className="p-6 bg-white border border-gray-300 rounded-md font-sans text-gray-700"
                    />
                  </PopoverContent>
                </Popover>
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
                onClick={handleSearch}
              />
            </div>
          </div>
        </div>
        </div>
      </section>
    </>
  );
}
