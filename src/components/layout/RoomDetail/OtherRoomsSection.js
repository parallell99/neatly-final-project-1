"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function OtherRoomsSection({ rooms = [] }) {
  const [shuffledRooms, setShuffledRooms] = useState([]);
  const [otherRoomsIndex, setOtherRoomsIndex] = useState(0);
  const [mobileRoomsIndex, setMobileRoomsIndex] = useState(0);

  useEffect(() => {
    const shuffled = [...rooms].sort(() => Math.random() - 0.5);
    setShuffledRooms(shuffled);
  }, [rooms.length]);

  const getVisibleRooms = () => {
    if (shuffledRooms.length === 0) return [];
    const list = [];
    for (let i = 0; i < 3; i++) {
      const index = (otherRoomsIndex + i) % shuffledRooms.length;
      list.push(shuffledRooms[index]);
    }
    return list;
  };
  const visibleRooms = getVisibleRooms();

  const getMobileRooms = () => {
    if (shuffledRooms.length === 0) return { prev: null, current: null, next: null };
    const prevIndex = mobileRoomsIndex === 0 ? shuffledRooms.length - 1 : mobileRoomsIndex - 1;
    const nextIndex = (mobileRoomsIndex + 1) % shuffledRooms.length;
    return {
      prev: shuffledRooms[prevIndex],
      current: shuffledRooms[mobileRoomsIndex],
      next: shuffledRooms[nextIndex],
    };
  };
  const mobileRooms = getMobileRooms();

  const goToPreviousRooms = () => {
    setOtherRoomsIndex((prev) =>
      prev === 0 ? shuffledRooms.length - 1 : prev - 1
    );
  };
  const goToNextRooms = () => {
    setOtherRoomsIndex((prev) => (prev + 1) % shuffledRooms.length);
  };
  const goToPreviousMobileRooms = () => {
    setMobileRoomsIndex((prev) =>
      prev === 0 ? shuffledRooms.length - 1 : prev - 1
    );
  };
  const goToNextMobileRooms = () => {
    setMobileRoomsIndex((prev) => (prev + 1) % shuffledRooms.length);
  };

  return (
    <div className="w-full bg-green-200 py-12 lg:py-16">
      <div className="max-w-[1440px] mx-auto lg:px-[160px]">
        <h2 className="font-serif headline-3 text-gray-900 text-center mb-8 lg:mb-12">
          Other Rooms
        </h2>
      </div>

      <div className="relative">
        {/* Mobile: Single image carousel with peek effect */}
        <div className="relative lg:hidden px-4">
          {mobileRooms.prev && mobileRooms.current && mobileRooms.next ? (
            <div className="flex gap-3 w-full overflow-hidden justify-center items-center rounded-sm">
              {[
                mobileRooms.prev,
                mobileRooms.current,
                mobileRooms.next,
              ].map((room, index) => (
                <Link
                  key={`${room.slug}-${index}`}
                  href={`/rooms/${room.slug}`}
                  className={`relative overflow-hidden group block h-[200px] shrink-0 rounded-sm ${
                    index === 1 ? "w-[80%] mx-auto" : "w-[20%]"
                  } ${index !== 1 ? "opacity-50" : ""}`}
                >
                  <div className="absolute inset-0">
                    <img
                      src={room.image}
                      alt={room.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div
                      className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent"
                      aria-hidden
                    />
                  </div>
                  <div className="relative z-10 flex flex-col justify-end p-6 h-full">
                    <h3 className="font-serif text-white text-2xl mb-2">
                      {room.roomTypeName || room.name}
                    </h3>
                    <span className="font-sans text-white text-sm inline-flex items-center gap-2 ">
                      Explore Room
                      <span aria-hidden>→</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : null}

          {mobileRooms.prev && mobileRooms.current && mobileRooms.next && (
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={goToPreviousMobileRooms}
                className="w-10 h-10 rounded-full border-2 border-gray-600 flex items-center justify-center hover:border-gray-400 transition-colors"
                aria-label="Previous room"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-600"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={goToNextMobileRooms}
                className="w-10 h-10 rounded-full border-2 border-gray-600 flex items-center justify-center hover:border-gray-400 transition-colors"
                aria-label="Next room"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-600"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Desktop: Carousel with 3 cards */}
        <div className="hidden lg:block relative w-full">
          <div className="flex gap-3 w-full overflow-hidden">
            {visibleRooms.map((room, index) => (
              <Link
                key={room.slug}
                href={`/rooms/${room.slug}`}
                className={`relative overflow-hidden group block h-[340px] shrink-0 ${
                  index === 1 ? "w-[60%]" : "w-[20%]"
                }`}
              >
                <div className="absolute inset-0">
                  <img
                    src={room.image}
                    alt={room.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div
                    className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent"
                    aria-hidden
                  />
                </div>
                <div className="relative z-10 flex flex-col justify-end p-8 h-full">
                  <h3 className="font-serif text-white text-3xl mb-2">
                    {room.roomTypeName || room.name}
                  </h3>
                  <span className="font-sans text-white text-base inline-flex items-center gap-2 hover:underline">
                    Explore Room
                    <span aria-hidden>→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {shuffledRooms.length > 3 && (
            <div className="flex justify-center gap-10 mt-6">
              <button
                onClick={goToPreviousRooms}
                className="w-12 h-12 rounded-full border border-gray-600 shadow-lg flex items-center justify-center hover:scale-110 transition-all"
                aria-label="Previous rooms"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-600"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={goToNextRooms}
                className="w-12 h-12 rounded-full border border-gray-600 shadow-lg flex items-center justify-center hover:scale-110 transition-all"
                aria-label="Next rooms"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-600"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
