"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

function createSlug(title) {
  if (!title || typeof title !== "string") return "";
  return title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function mapApiRoomToCard(room) {
  const main = room.image_main || null;
  const gallery = (room.image_gallery || []).map((g) => g.image_url).filter(Boolean);
  const images = main ? [main, ...gallery.filter((url) => url !== main)] : gallery;
  return {
    id: room.id,
    name: room.room_type?.name ?? room.title ?? "Room",
    slug: createSlug(room.title) || String(room.id),
    roomType: room.room_type?.name ?? room.title ?? "Room",
    image: main || gallery[0] || null,
    images: images.length > 0 ? images : [main].filter(Boolean),
  };
}

function groupRoomsByType(roomList) {
  const groups = {};
  roomList.forEach((room) => {
    const type = room.roomType ?? room.name;
    if (!groups[type]) groups[type] = [];
    groups[type].push(room);
  });
  return Object.entries(groups);
}

const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%23e5e7eb' width='400' height='300'/%3E%3Ctext fill='%239ca3af' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16'%3ENo image%3C/text%3E%3C/svg%3E";

function RoomCard({ room, className = "", fill = false }) {
  const cardHeight = fill ? "h-full" : "min-h-[280px] md:min-h-[360px]";
  const images = (room.images && room.images.length > 0
    ? room.images
    : room.image
      ? [room.image]
      : [PLACEHOLDER_IMG]
  ).filter(Boolean);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isSlider = images.length > 1;

  const goPrev = useCallback(
    (e) => {
      e?.preventDefault?.();
      e?.stopPropagation?.();
      setCurrentIndex((i) => (i === 0 ? images.length - 1 : i - 1));
    },
    [images.length]
  );
  const goNext = useCallback(
    (e) => {
      e?.preventDefault?.();
      e?.stopPropagation?.();
      setCurrentIndex((i) => (i === images.length - 1 ? 0 : i + 1));
    },
    [images.length]
  );

  useEffect(() => {
    if (!isSlider) return;
    const id = setInterval(() => {
      setCurrentIndex((i) => (i === images.length - 1 ? 0 : i + 1));
    }, 5000);
    return () => clearInterval(id);
  }, [isSlider, images.length]);

  return (
    <Link
      href={`/rooms/${room.slug}`}
      className={`relative overflow-hidden group block ${fill ? "h-full w-full min-h-0" : `w-full ${cardHeight}`} ${className}`}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="flex h-full w-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((src, i) => (
            <div key={i} className="h-full w-full shrink-0 flex-[0_0_100%]">
              <img
                src={src}
                alt={`${room.name} ${i + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          ))}
        </div>
        <div
          className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent pointer-events-none"
          aria-hidden
        />
        {isSlider && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-50 w-9 h-9 rounded-full border border-white/80 bg-black/30 flex items-center justify-center text-white hover:bg-black/50 transition-colors"
              aria-label="Previous image"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-50 w-9 h-9 rounded-full border border-white/80 bg-black/30 flex items-center justify-center text-white hover:bg-black/50 transition-colors"
              aria-label="Next image"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentIndex(i);
                  }}
                  className={`w-2 h-2 rounded-full transition-colors ${i === currentIndex ? "bg-white" : "bg-white/50"}`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <div
        className={`relative z-10 flex flex-col justify-end p-6 md:p-8 lg:p-10 ${fill ? "h-full min-h-0" : `h-full ${cardHeight}`}`}
      >
        <h3 className="font-serif text-white text-2xl md:text-3xl mb-2">
          {room.name}
        </h3>
        <span className="font-sans text-white text-sm md:text-base inline-flex items-center gap-2 hover:underline focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent rounded">
          Explore Room
          <span aria-hidden>→</span>
        </span>
      </div>
    </Link>
  );
}

export default function HeroRoomSuit() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/chatbot/all-room")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load rooms");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data?.data) ? data.data : [];
        setRooms(list.map(mapApiRoomToCard));
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const grouped = groupRoomsByType(rooms);
  const desktopRooms = rooms.slice(0, 6);
  // Mobile: one card per room_type, max 6
  const mobileRoomsByType = grouped
    .slice(0, 6)
    .map(([, roomList]) => roomList[0])
    .filter(Boolean);

  return (
    <section id="rooms" className="w-full bg-white mb-10 lg:mb-30">
      <div className="max-w-[1440px] mx-auto py-12 lg:py-16 px-4 text-center">
        <h2 className="font-serif headline-3 text-green-800">
          Rooms & Suits
        </h2>
      </div>

      {error && (
        <div className="max-w-[1440px] mx-auto px-4 text-center text-red-600 mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="max-w-[1440px] mx-auto px-4 py-12 text-center text-gray-600">
          Loading rooms...
        </div>
      ) : (
        <>
          {/* Mobile: one card per room_type, max 6 */}
          <div className="w-full flex flex-col gap-4 lg:hidden max-w-[1440px] mx-auto px-4">
            {mobileRoomsByType.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>

          {/* Desktop: grid (first 6 from API in fixed layout) */}
          {desktopRooms.length > 0 && (
            <div className="hidden lg:grid lg:grid-cols-3 lg:grid-rows-[540px_400px_338px_338px] lg:max-w-[1440px] lg:mx-auto lg:gap-4 lg:px-4">
              {desktopRooms[0] && (
                <div className="col-span-3 min-h-0">
                  <RoomCard room={desktopRooms[0]} className="h-full min-h-0" fill />
                </div>
              )}
              {desktopRooms[1] && (
                <div className="col-span-2 min-h-0">
                  <RoomCard room={desktopRooms[1]} className="h-full min-h-0" fill />
                </div>
              )}
              {desktopRooms[2] && (
                <div className="col-span-1 min-h-0">
                  <RoomCard room={desktopRooms[2]} className="h-full min-h-0" fill />
                </div>
              )}
              {desktopRooms[3] && (
                <div className="col-span-1 row-span-2 min-h-0">
                  <RoomCard room={desktopRooms[3]} className="h-full min-h-0" fill />
                </div>
              )}
              {desktopRooms[4] && (
                <div className="col-span-2 min-h-0">
                  <RoomCard room={desktopRooms[4]} className="h-full w-full min-h-0" fill />
                </div>
              )}
              {desktopRooms[5] && (
                <div className="col-span-2 min-h-0">
                  <RoomCard room={desktopRooms[5]} className="h-full w-full min-h-0" fill />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
