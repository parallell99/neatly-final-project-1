// "use client";

// import { useState } from "react";
// import Image from "next/image";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";

// import LeftIcon from "@/assets/icons/arrow-left.svg";
// import RightIcon from "@/assets/icons/arrow-right.svg";

// export default function RoomPopup({ room, open, onOpenChange }) {
//   const [currentIndex, setCurrentIndex] = useState(0);

//   const [isImageOpen, setIsImageOpen] = useState(false);

//   if (!room) return null;

//   const images = room.images?.length ? room.images : [room.image];

//   const nextImage = () => {
//     setCurrentIndex((prev) =>
//       prev === images.length - 1 ? 0 : prev + 1
//     );
//   };

//   const prevImage = () => {
//     setCurrentIndex((prev) =>
//       prev === 0 ? images.length - 1 : prev - 1
//     );
//   };

//   return (
//     <>
//       {/* ================= MAIN POPUP ================= */}
//       <Dialog open={open} onOpenChange={onOpenChange}>
//         <DialogContent className="w-full max-w-none h-screen rounded-none p-4 md:max-w-[800px] md:h-auto md:rounded-lg md:p-6">
//           <div className="flex-1 overflow-y-auto p-4 md:p-0">
//             <DialogHeader>
//               <DialogTitle className="headline-4">
//                 {room.title}
//               </DialogTitle>
//             </DialogHeader>

//             {/* ================= IMAGE SECTION ================= */}
//             {/* ✅ เพิ่ม onClick + cursor-pointer */}
//             <div
//               className="relative w-full h-[400px] overflow-hidden md:cursor-pointer"
//               onClick={() => {
//                 if (window.innerWidth >= 768) {
//                   setIsImageOpen(true);
//                 }
//               }}
//             >
//               <Image
//                 src={images[currentIndex]}
//                 alt={room.title}
//                 fill
//                 sizes="(max-width: 768px) 100vw, 800px"
//                 className="object-cover"
//                 priority
//               />

//               {images.length > 1 && (
//                 <>
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       prevImage();
//                     }}
//                     className="absolute left-6 top-1/2 -translate-y-1/2
//              w-12 h-12 rounded-full
//              border border-white
//              bg-white/20 backdrop-blur-md
//              flex items-center justify-center
//              text-white
//              hover:bg-white/40 transition"
//                   >
//                     <LeftIcon className="w-5 h-5" />
//                   </button>

//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       nextImage();
//                     }}
//                     className="absolute right-6 top-1/2 -translate-y-1/2
//              w-12 h-12 rounded-full
//              border border-white
//              bg-white/20 backdrop-blur-md
//              flex items-center justify-center
//              text-white
//              hover:bg-white/40 transition"
//                   >
//                     <RightIcon className="w-5 h-5" />
//                   </button>
//                 </>
//               )}
//             </div>

//             {/* ================= ROOM INFO ================= */}
//             <div className="mt-6">
//               <div className="flex gap-4 body-3 text-[var(--color-gray-600)] mb-3">
//                 <span>{room.guests || "2 Guests"}</span>
//                 <span>{room.bed || "1 Double bed"}</span>
//                 <span>{room.size || "36 sqm"}</span>
//               </div>

//               <p className="body-2 text-[var(--color-gray-700)]">
//                 {room.description}
//               </p>
//             </div>

//             <hr className="my-4" />

//             {/* ================= AMENITIES ================= */}
//             <div>
//               <h4 className="headline-5 mb-4">Room Amenities</h4>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-2 body-2 text-[var(--color-gray-700)]">
//                 <ul className="space-y-1 list-disc pl-5">
//                   <li>Safe in Room</li>
//                   <li>Air Conditioning</li>
//                   <li>High speed internet connection</li>
//                   <li>Hairdryer</li>
//                   <li>Shower</li>
//                   <li>Bathroom amenities</li>
//                   <li>Lamp</li>
//                 </ul>

//                 <ul className="space-y-1 list-disc pl-5">
//                   <li>Minibar</li>
//                   <li>Telephone</li>
//                   <li>Ironing board</li>
//                   <li>A floor only accessible via a guest room key</li>
//                   <li>Alarm clock</li>
//                   <li>Bathrobe</li>
//                 </ul>
//               </div>
//             </div>
//           </div>
//         </DialogContent>
//       </Dialog>

//       {/* ================= FULLSCREEN LIGHTBOX ================= */}
//       {/* ✅ เพิ่ม Dialog ตัวใหม่ */}
//       <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
//         <DialogContent className="w-full h-screen max-w-none p-0 bg-black border-none">
//           <div className="relative w-full h-full flex items-center justify-center">
//             <Image
//               src={images[currentIndex]}
//               alt={room.title}
//               fill
//               sizes="100vw"
//               className="object-contain"
//               priority
//             />

//             {images.length > 1 && (
//               <>
//                 <button
//                   onClick={prevImage}
//                   className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-white bg-white/20 backdrop-blur flex items-center justify-center"
//                 >
//                   <LeftIcon className="w-6 h-6" />
//                 </button>

//                 <button
//                   onClick={nextImage}
//                   className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-white bg-white/20 backdrop-blur flex items-center justify-center"
//                 >
//                   <RightIcon className="w-6 h-6" />
//                 </button>
//               </>
//             )}

//             <button
//               onClick={() => setIsImageOpen(false)}
//               className="absolute top-6 right-6 text-white text-3xl"
//             >
//               ✕
//             </button>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// }


"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";


// ==============================
// Arrow Button (Inline SVG)
// ==============================
function ArrowButton({ direction, onClick }) {
  const isLeft = direction === "left";

  return (
    <button
      onClick={onClick}
      className={`absolute ${
        isLeft ? "left-6" : "right-6"
      } top-1/2 -translate-y-1/2
      w-12 h-12 rounded-full
      border border-white
      hover:bg-white
      flex items-center justify-center
      shadow-lg z-10`}
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
        className="text-white"
      >
        {isLeft ? (
          <polyline points="15 18 9 12 15 6" />
        ) : (
          <polyline points="9 18 15 12 9 6" />
        )}
      </svg>
    </button>
  );
}


// ==============================
// Image Carousel
// ==============================
function ImageCarousel({
  images,
  currentIndex,
  nextImage,
  prevImage,
  onClick,
  contain = false,
}) {
  return (
    <div
      className="relative w-full h-[400px] overflow-hidden"
      onClick={onClick}
    >
      <img
        src={images}
        alt="room image"
        fill
        sizes="100vw"
        className={contain ? "object-contain" : "object-cover"}
        priority
      />

      {images.length > 1 && (
        <>
          <ArrowButton direction="left" onClick={prevImage} />
          <ArrowButton direction="right" onClick={nextImage} />
        </>
      )}
    </div>
  );
}


// ==============================
// Main Component
// ==============================
export default function RoomPopup({ room, open, onOpenChange }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isImageOpen, setIsImageOpen] = useState(false);
console.log("ROOM =",room);

  if (!room) return null;

  const images =
    room.image_gallery ?.length ? room.image_main : [room.image_main];
console.log("IMAGES=",images);

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
    <>
      {/* ================= MAIN POPUP ================= */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-full max-w-none h-screen rounded-none p-4 md:max-w-[800px] md:h-auto md:rounded-lg md:p-6">
          <div className="flex-1 overflow-y-auto p-4 md:p-0">
            <DialogHeader>
              <DialogTitle className="headline-4">
                {room.title}
              </DialogTitle>
            </DialogHeader>

            <ImageCarousel
              images={images}
              currentIndex={currentIndex}
              nextImage={nextImage}
              prevImage={prevImage}
              onClick={() => {
                if (window.innerWidth >= 768) {
                  setIsImageOpen(true);
                }
              }}
            />

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
          </div>
        </DialogContent>
      </Dialog>

      {/* ================= FULLSCREEN LIGHTBOX ================= */}
      <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
        <DialogContent className="w-full h-screen max-w-none p-0 bg-black border-none">
          <div className="relative w-full h-full flex items-center justify-center">
            <ImageCarousel
              images={images}
              currentIndex={currentIndex}
              nextImage={nextImage}
              prevImage={prevImage}
              contain
            />

            <button
              onClick={() => setIsImageOpen(false)}
              className="absolute top-6 right-6 text-white text-3xl z-10"
            >
              ✕
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}