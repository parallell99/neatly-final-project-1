"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

function createSlug(title) {
  if (!title || typeof title !== "string") return "";
  return title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function mapApiRoomToCard(room) {
  return {
    id: room.id,
    name: room.room_type?.name ?? room.title ?? "Room",
    slug: createSlug(room.title) || String(room.id),
    roomType: room.room_type?.name ?? room.title ?? "Room",
    image: room.image_main || null,
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

function RoomCard({ room, className = "", fill = false }) {
  const cardHeight = fill ? "h-full" : "min-h-[280px] md:min-h-[360px]";
  const imageSrc =
    room.image ||
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%23e5e7eb' width='400' height='300'/%3E%3Ctext fill='%239ca3af' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16'%3ENo image%3C/text%3E%3C/svg%3E";

  return (
    <Link
      href={`/rooms/${room.slug}`}
      className={`relative overflow-hidden group block ${fill ? "h-full w-full min-h-0" : `w-full ${cardHeight}`} ${className}`}
    >
      <div className="absolute inset-0">
        <img
          src={imageSrc}
          alt={room.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div
          className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent"
          aria-hidden
        />
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
          {/* Mobile: grouped by room type */}
          <div className="w-full flex flex-col gap-6 lg:hidden max-w-[1440px] mx-auto px-4">
            {grouped.map(([roomType, roomList]) => (
              <div key={roomType} className="flex flex-col gap-4">
                <h3 className="font-serif text-lg md:text-xl text-green-800 font-medium">
                  {roomType}
                </h3>
                <div className="flex flex-col gap-4">
                  {roomList.map((room) => (
                    <RoomCard key={room.id} room={room} />
                  ))}
                </div>
              </div>
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
