"use client";

import { useState } from "react";

import SearchSection from "./SearchSection";
import RoomCard from "./RoomCard";
import RoomPopup from "./RoomPopup";

import Image6 from "@/assets/images/6.jpg";
import Image5 from "@/assets/images/5.jpg";
import Image4 from "@/assets/images/4.jpg";
import Image3 from "@/assets/images/3.jpg";
import Image2 from "@/assets/images/2.jpg";
import Image1 from "@/assets/images/1.jpg";

const rooms = [
  {
    id: 1,
    title: "Superior Garden View",
    images: [Image6, Image5, Image4],
    description:
      "Rooms (36sqm) with full garden views, 1 double bed, bathroom with bathtub & shower.",
    guests: "2 Guests",
    bed: "1 Double bed",
    size: "36 sqm",
    price: "THB 2,500.00",
    oldPrice: "THB 3,000.00",
  },
  {
    id: 2,
    title: "Deluxe",
    images: [Image5, Image6, Image3],
    description:
      "Spacious deluxe room (38sqm) featuring city view, king size bed and modern bathroom.",
    guests: "2 Guests",
    bed: "1 King bed",
    size: "38 sqm",
    price: "THB 2,700.00",
    oldPrice: "THB 3,100.00",
  },
  {
    id: 3,
    title: "Superior",
    images: [Image4, Image3, Image2],
    description:
      "Comfortable superior room (34sqm) with garden view and walk-in shower.",
    guests: "2 Guests",
    bed: "1 Queen bed",
    size: "34 sqm",
    price: "THB 2,300.00",
    oldPrice: "THB 2,900.00",
  },
  {
    id: 4,
    title: "Supreme",
    images: [Image2, Image1, Image6],
    description:
      "Elegant supreme room (40sqm) with balcony access and premium bathroom amenities.",
    guests: "2 Guests",
    bed: "1 King bed",
    size: "40 sqm",
    price: "THB 3,200.00",
    oldPrice: "THB 3,800.00",
  },
  {
    id: 5,
    title: "Suite",
    images: [Image1, Image6, Image5],
    description:
      "Luxury suite (55sqm) with living area, bathtub, and stunning garden panorama.",
    guests: "3 Guests",
    bed: "1 King bed",
    size: "55 sqm",
    price: "THB 4,500.00",
    oldPrice: "THB 5,200.00",
  },
  {
    id: 6,
    title: "Premier Sea View",
    images: [Image3, Image2, Image4],
    description:
      "Premier sea view room (42sqm) with private balcony and ocean-facing window.",
    guests: "2 Guests",
    bed: "1 King bed",
    size: "42 sqm",
    price: "THB 3,900.00",
    oldPrice: "THB 4,500.00",
  },
];

export default function RoomsList() {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [open, setOpen] = useState(false);

  const handleOpen = (room) => {
    setSelectedRoom(room);
    setOpen(true);
  };

  return (
    <section className="bg-[var(--color-bg)] min-h-screen flex flex-col items-center">

      {/* Search */}
      <div className="w-full">
        <SearchSection />
      </div>

      {/* Room List */}
      <div className="max-w-[1440px] pb-20 space-y-8">
        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            onClick={() => handleOpen(room)}
          />
        ))}
      </div>

      {/* Popup */}
      <RoomPopup
        room={selectedRoom}
        open={open}
        onOpenChange={setOpen}
      />

    </section>
  );
}
