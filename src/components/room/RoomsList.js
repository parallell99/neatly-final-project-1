// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/router";
// import axios from "axios";
// import SearchSection from "./SearchSection";
// import RoomCard from "./RoomCard";
// import RoomPopup from "./RoomPopup";
// import RoomCardSkeleton from "./RoomCardSkeleton";

// export default function RoomsList() {
//   const router = useRouter();
//   const { checkIn, checkOut, rooms, adults, kids } = router.query;

//   const [selectedRoom, setSelectedRoom] = useState(null);
//   const [open, setOpen] = useState(false);
//   const [roomsList, setRoomsList] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [searchLoading, setSearchLoading] = useState(false);

//   const initialSearch =
//     checkIn && checkOut
//       ? {
//           checkIn: String(checkIn),
//           checkOut: String(checkOut),
//           numRooms: rooms ? Number(rooms) : 1,
//           numAdults: adults ? Number(adults) : 2,
//           numKids: kids ? Number(kids) : 0,
//         }
//       : null;

//   useEffect(() => {
//     fetchRooms();
//   }, []);

//   const fetchRooms = async () => {
//     try {
//       setLoading(true);
//       const response = await axios.get("/api/rooms/availablerooms");

//       // เพราะ API return { data: rooms }
//       console.log("roomlist=", response.data.data);

//       setRoomsList(response.data.data);
//     } catch (err) {
//       console.error("Fetch rooms error:", err);
//       setError("Failed to load rooms");
//     } finally {
//       setLoading(false);
//     }
//   };


//   const handleOpen = (room) => {
//     setSelectedRoom(room);
//     setOpen(true);
//   };

//   const isListLoading = loading || searchLoading;

//   return (
//     <section className="bg-bg min-h-screen flex flex-col items-center">

//       {/* Search */}

//         <SearchSection
//           initialSearch={initialSearch}
//           onRoomsListChange={setRoomsList}
//           onLoadingChange={setSearchLoading}
//         />

//       {/* Room List */}
//       <div className="max-w-[1440px] pb-20 space-y-8">
//         {error && (
//           <p className="px-6 py-6 text-sm text-red-600" role="alert">
//             {error}
//           </p>
//         )}

//         {isListLoading ? (
//           <>
//             <RoomCardSkeleton />
//             <RoomCardSkeleton />
//             <RoomCardSkeleton />
//             <RoomCardSkeleton />
//             <RoomCardSkeleton />
//             <RoomCardSkeleton />
//           </>
//         ) : roomsList.length === 0 ? (
//           <p className="px-6 py-10 body-1 text-gray-600">
//             No available rooms for the selected dates.
//           </p>
//         ) : (
//           roomsList.map((room) => (
//             <RoomCard
//               key={room.id}
//               room={room}
//               onClick={() => handleOpen(room)}
//             />
//           ))
//         )}
//       </div>

//       {/* Popup */}
//       <RoomPopup
//         room={selectedRoom}
//         open={open}
//         onOpenChange={setOpen}
//       />

//     </section>
//   );
// }


"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import SearchSection from "./SearchSection";
import RoomCard from "./RoomCard";
import RoomPopup from "./RoomPopup";
import RoomCardSkeleton from "./RoomCardSkeleton";

export default function RoomsList() {
  const router = useRouter();
  const { checkIn, checkOut, rooms, adults, kids } = router.query;

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [open, setOpen] = useState(false);
  const [roomsList, setRoomsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // --- เก็บ search params ที่ใช้ค้นหาล่าสุด ---
  const [searchParams, setSearchParams] = useState({
    checkIn: checkIn ? String(checkIn) : null,
    checkOut: checkOut ? String(checkOut) : null,
    numRooms: rooms ? Number(rooms) : 1,
    numAdults: adults ? Number(adults) : 2,
    numKids: kids ? Number(kids) : 0,
  });

  const initialSearch =
    checkIn && checkOut
      ? {
        checkIn: String(checkIn),
        checkOut: String(checkOut),
        numRooms: rooms ? Number(rooms) : 1,
        numAdults: adults ? Number(adults) : 2,
        numKids: kids ? Number(kids) : 0,
      }
      : null;

  useEffect(() => {
    if (!searchParams.checkIn || !searchParams.checkOut) return;
    const fetchFilteredRooms = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          "/api/rooms/availablerooms",
          {
            params: {
              checkIn: searchParams.checkIn,
              checkOut: searchParams.checkOut,
            },
          }
        );
        setRoomsList(
          (response.data.data || []).filter(
            (room) => Number(room.available_rooms) > 0
          )
        );
      } catch (err) {
        console.error(err);
        setError("Failed to load rooms");
      } finally {
        setLoading(false);
      }
    };
    fetchFilteredRooms();
  }, [searchParams.checkIn, searchParams.checkOut]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/rooms/availablerooms");
      setRoomsList(response.data.data);
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

  // รับ params จาก SearchSection เมื่อกด Search
  const handleSearch = (params) => {
    setSearchParams(params);
  };

  const isListLoading = loading || searchLoading;

  return (
    <section className="bg-bg min-h-screen flex flex-col items-center">
      <SearchSection
        initialSearch={initialSearch}
        onRoomsListChange={handleSearch}
        onLoadingChange={setSearchLoading}
      />

      <div className="max-w-[1440px] pb-20 space-y-8">
        {error && (
          <p className="px-6 py-6 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {isListLoading ? (
          Array.from({ length: 6 }).map((_, i) => <RoomCardSkeleton key={i} />)
        ) : roomsList.length === 0 ? (
          <p className="px-6 py-10 body-1 text-gray-600">
            No available rooms for the selected dates.
          </p>
        ) : (
          roomsList.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              searchParams={searchParams}   // ← ส่งลงไป
              onClick={() => handleOpen(room)}
            />
          ))
        )}
      </div>

      <RoomPopup room={selectedRoom} open={open} onOpenChange={setOpen} />
    </section>
  );
}
