"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import SearchSection from "./SearchSection";
import RoomCard from "./RoomCard";
import RoomPopup from "./RoomPopup";
import RoomCardSkeleton from "./RoomCardSkeleton";

export default function RoomsList() {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [open, setOpen] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [orders, setOrders] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    console.log("ORDERS in RoomsList:", orders);
  }, [orders]);

  const fetchRooms = async () => {
    try {
      setLoading(true);

      const response = await axios.get("/api/availablerooms/availablerooms");

      // เพราะ API return { data: rooms }
      console.log(response.data.data);

      setRooms(response.data.data);
    } catch (err) {
      console.error("Fetch rooms error:", err);
      setError("Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };


  const handleOpen = (room) => {
    setSelectedRoom(room);
    setOpen(true);
  };

  const bookedRoomIds = new Set(orders.map((order) => order.room_id));
  const availableRooms = rooms.filter((room) => !bookedRoomIds.has(room.id));
  const isListLoading = loading || searchLoading;
  return (
    <section className="bg-bg min-h-screen flex flex-col items-center">

      {/* Search */}
      
        <SearchSection
          onOrdersChange={setOrders}
          onLoadingChange={setSearchLoading}
        />

      {/* Room List */}
      <div className="max-w-[1440px] pb-20 space-y-8">
        {error && (
          <p className="px-6 py-6 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {isListLoading ? (
          <>
            <RoomCardSkeleton />
            <RoomCardSkeleton />
            <RoomCardSkeleton />
            <RoomCardSkeleton />
            <RoomCardSkeleton />
            <RoomCardSkeleton />
          </>
        ) : availableRooms.length === 0 ? (
          <p className="px-6 py-10 text-sm text-gray-600">
            No available rooms for the selected dates.
          </p>
        ) : (
          availableRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onClick={() => handleOpen(room)}
            />
          ))
        )}
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
