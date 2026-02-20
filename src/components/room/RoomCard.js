import { useState } from "react";
import Image from "next/image";
import RoomPopup from "./RoomPopup";

export default function RoomCard({ room }) {
  const [open, setOpen] = useState(false);

  return (
<>
      <div className="bg-white rounded-xl shadow-sm flex flex-col md:flex-row overflow-hidden">

        {/* Image */}
        <div
          className="relative w-full md:w-[380px] h-[220px] md:h-auto cursor-pointer"
          onClick={() => setOpen(true)}
        >
          <Image
            src={room.images?.[0] || room.image}
            alt={room.title}
            fill
            className="object-cover"
          />
        </div>

        {/* Content */}
        <div className="flex-1 p-6 flex flex-col justify-between">

          <div>
            <h3
              className="headline-4 mb-3 cursor-pointer hover:underline"
              onClick={() => setOpen(true)}
            >
              {room.title}
            </h3>

            <div className="flex gap-4 body-3 text-[var(--color-gray-600)] mb-3">
              <span>2 Guests</span>
              <span>1 Double bed</span>
              <span>32 sqm</span>
            </div>

            <p className="body-2 text-[var(--color-gray-700)]">
              {room.description}
            </p>
          </div>

          <div className="mt-6 flex justify-between items-center">
            <div>
              {room.oldPrice && (
                <p className="body-3 line-through text-[var(--color-gray-500)]">
                  {room.oldPrice}
                </p>
              )}
              <p className="headline-5">{room.price}</p>
              <p className="body-3 text-[var(--color-gray-600)]">
                Per Night <br />
                (Including Taxes & Fees)
              </p>
            </div>

            <div className="flex gap-4">
              <button className="btn btn-ghost">
                Room Detail
              </button>

              <button className="btn btn-primary">
                Book Now
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Modal */}
      <RoomPopup
        room={room}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}