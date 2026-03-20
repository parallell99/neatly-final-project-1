"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

function createSlug(title) {
  if (!title || typeof title !== "string") return "";
  return title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function mapApiRoomToCard(room) {
  const main =
    room.image_main ??
    room.main_image ??
    room.image ??
    (room.image_gallery?.[0] && (room.image_gallery[0].image_url ?? room.image_gallery[0].url)) ??
    null;
  const gallery = (room.image_gallery || []).map((g) => g.image_url ?? g.url).filter(Boolean);
  const images = main ? [main, ...gallery.filter((url) => url !== main)] : gallery;
  const displayName = room.room_type?.name ?? room.name ?? room.title ?? "Room";
  return {
    id: room.id,
    name: displayName,
    slug: createSlug(room.title ?? room.name) || String(room.id),
    roomType: displayName,
    image: main || gallery[0] || null,
    images: images.length > 0 ? images : (main ? [main] : []),
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
  const mainImage = room.image || (room.images && room.images[0]) || PLACEHOLDER_IMG;

  return (
    <Link
      href={`/rooms/${room.slug}`}
      className={`relative overflow-hidden group block ${fill ? "h-full w-full min-h-0" : `w-full ${cardHeight}`} ${className}`}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="h-full w-full">
          <img
            src={mainImage}
            alt={room.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div
          className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent pointer-events-none"
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
    fetch("/api/rooms/rooms-all")
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
          <div className="w-full flex flex-col gap-4 lg:hidden max-w-[1440px] mx-auto">
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
