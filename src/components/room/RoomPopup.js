//1st version
// "use client";

// import Image from "next/image";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";

// export default function RoomPopup({ room, open, onOpenChange }) {
//   if (!room) return null;

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="max-w-4xl w-full">

//         <DialogHeader>
//           <DialogTitle className="headline-4">
//             {room.title}
//           </DialogTitle>
//         </DialogHeader>

//         <div className="relative w-full h-[350px] rounded-lg overflow-hidden">
//           <Image
//             src={room.image}
//             alt={room.title}
//             fill
//             className="object-cover"
//           />
//         </div>

//         <div className="mt-6">
//           <div className="flex gap-4 body-3 text-[var(--color-gray-600)] mb-3">
//             <span>2 Person</span>
//             <span>1 Double bed</span>
//             <span>32 sqm</span>
//           </div>

//           <p className="body-2 text-[var(--color-gray-700)]">
//             {room.description}
//           </p>
//         </div>

//         <hr className="my-2" />

//         <div>
//           <h4 className="headline-5 mb-4">Room Amenities</h4>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-2 body-2 text-[var(--color-gray-700)]">
//             <ul className="space-y-1 list-disc pl-5">
//               <li>Safe in Room</li>
//               <li>Air Conditioning</li>
//               <li>High speed internet connection</li>
//               <li>Hairdryer</li>
//               <li>Shower</li>
//               <li>Bathroom amenities</li>
//               <li>Lamp</li>
//             </ul>

//             <ul className="space-y-1 list-disc pl-5">
//               <li>Minibar</li>
//               <li>Telephone</li>
//               <li>Ironing board</li>
//               <li>A floor only accessible via a guest room key</li>
//               <li>Alarm clock</li>
//               <li>Bathrobe</li>
//             </ul>
//           </div>
//         </div>

//       </DialogContent>
//     </Dialog>
//   );
// }


//2nd version
"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// 👉 เปลี่ยน path ตามไฟล์ไอคอนคุณ
import LeftIcon from "@/assets/icons/arrow-left.svg";
import RightIcon from "@/assets/icons/arrow-right.svg";

export default function RoomPopup({ room, open, onOpenChange }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!room) return null;

  const images = room.images?.length ? room.images : [room.image];

  const nextImage = () => {
    setCurrentIndex((prev) =>
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          w-[375px]
          sm:w-full
          md:max-w-[800px]
          p-6
        "
      >
        {/* Title */}
        <DialogHeader>
          <DialogTitle className="headline-4">
            {room.title}
          </DialogTitle>
        </DialogHeader>

        {/* Image Section */}
        <div className="relative w-full h-[300px] md:h-[400px] rounded-lg overflow-hidden">
          <Image
            src={images[currentIndex]}
            alt={room.title}
            fill
            className="object-cover"
          />

          {images.length > 1 && (
            <>
              {/* Left */}
              <button
                onClick={prevImage}
                className="
                  absolute left-3 top-1/2 -translate-y-1/2
                  bg-white/70 hover:bg-white
                  rounded-full p-2 shadow
                "
              >
                <LeftIcon className="w-5 h-5" />
              </button>

              {/* Right */}
              <button
                onClick={nextImage}
                className="
                  absolute right-3 top-1/2 -translate-y-1/2
                  bg-white/70 hover:bg-white
                  rounded-full p-2 shadow
                "
              >
                <RightIcon className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Room Info */}
        <div className="mt-6">
        <div className="flex gap-4 body-3 text-[var(--color-gray-600)] mb-3">
        <span>{room.guests || "2 Guests"}</span>
        <span>{room.bed || "1 Double bed"}</span>
        <span>{room.size || "36 sqm"}</span>
        </div>

        <p className="body-2 text-[var(--color-gray-700)]">
            {room.description}
        </p>
        </div>

        <hr className="my-2" />

        {/* Amenities */}
        <div>
          <h4 className="headline-5 mb-4">Room Amenities</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 body-2 text-[var(--color-gray-700)]">
            <ul className="space-y-1 list-disc pl-5">
              <li>Safe in Room</li>
              <li>Air Conditioning</li>
              <li>High speed internet connection</li>
              <li>Hairdryer</li>
              <li>Shower</li>
              <li>Bathroom amenities</li>
              <li>Lamp</li>
            </ul>

            <ul className="space-y-1 list-disc pl-5">
              <li>Minibar</li>
              <li>Telephone</li>
              <li>Ironing board</li>
              <li>A floor only accessible via a guest room key</li>
              <li>Alarm clock</li>
              <li>Bathrobe</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}