"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Arrow Button (Inline SVG)
function ArrowButton({ direction, onClick }) {
  const isLeft = direction === "left";

  return (
    <button
      onClick={onClick}
      className={`absolute ${isLeft ? "left-4" : "right-4"
        } top-1/2 -translate-y-1/2
      w-10 h-10 rounded-full
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
          <>
           {/* เส้นตรงกลาง */}
           <polyline points="19 12 5 12" />
           {/* หัวลูกศรซ้าย */}
           <polyline points="12 19 5 12 12 5" />
           </>
        ) : (
          <>
          {/* เส้นตรงกลาง */}
          <polyline points="5 12 19 12" />
          {/* หัวลูกศรขวา */}
          <polyline points="12 5 19 12 12 19" />
          </>
        )}
      </svg>
    </button>
    
  );
}

// Image Carousel
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
      className="relative flex justify-center items-center w-[343px] h-[209px] mt-4 rounded-sm overflow-hidden lg:w-[640px] lg:h-[400px] lg:mx-auto"
    >
      <img
        src={images[currentIndex].image_url}
        alt="room image"
        fill
        sizes="100vw"
        className="w-full max-w-[1440px] h-full object-cover"
        priority
        onClick={onClick}
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

// Main Component
export default function RoomPopup({ room, open, onOpenChange }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isImageOpen, setIsImageOpen] = useState(false);


  if (!room) return null;

  const images =
    room.image_gallery?.length ? room.image_gallery : [room.image_main];
  console.log("IMAGES=", images);

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
        <DialogContent className="w-full max-w-none fixed left-1/2 top-[50%] -translate-x-1/2 -translate-y-1/2 p-0 rounded-t-lg mt-[10vh] lg:mt-[1vh] md:max-w-[800px] lg:h-auto md:rounded-lg lg:p-6">
          <div className="flex-1 md:p-0">
            <DialogHeader className="border-b border-b-gray-300">
              <DialogTitle className="text-start headline-5 p-4">
                {room.room_type_name}
              </DialogTitle>
            </DialogHeader>
            <div className="max-h-[517px] px-4 overflow-auto">
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
                <div className="flex gap-4 body-1 text-gray-700 mb-3">
                  <span>{Number(room.room_guest_adult) + Number(room.room_guest_kid)} Guests</span>
                  <span>|</span>
                  <span>{room.bed_type}</span>
                  <span>|</span>
                  <span>{room.room_size} sqm</span>
                </div>

                <p className="body-1 text-gray-700">
                  {room.description}
                </p>
                     
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ================= FULLSCREEN LIGHTBOX ================= */}
      <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
        <DialogContent
          className="w-screen h-screen max-w-none max-h-none p-0 bg-black border-none rounded-none top-0 left-0 translate-x-0 translate-y-0"
          showCloseButton={false}>
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
      </Dialog >
    </>
  );
}