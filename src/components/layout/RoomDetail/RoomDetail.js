"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Button from "@/components/ui/buttons/buttons";
import ChatbotFloatingButton from "@/components/layout/ChatbotFloatingButton";
import RoomImg1 from "@/assets/images/1.jpg";
import RoomImg2 from "@/assets/images/2.jpg";
import RoomImg3 from "@/assets/images/3.jpg";
import RoomImg4 from "@/assets/images/4.jpg";
import superiorGardenViewImg from "@/assets/images/6.jpg";
import deluxeImg from "@/assets/images/5.jpg";
import superiorImg from "@/assets/images/4.jpg";
import premierSeaViewImg from "@/assets/images/3.jpg";
import supremeImg from "@/assets/images/2.jpg";
import suiteImg from "@/assets/images/1.jpg";

// Room data configuration
const ROOM_DATA = {
  "superior-garden-view": {
    title: "Superior Garden View",
    description: "Rooms (36sqm) with full garden views, 1 single bed, bathroom with bathtub & shower.",
    statistics: {
      person: "2 Person",
      bed: "1 Double bed",
      size: "32 sqm"
    },
    pricing: {
      original: "THB 3,100.00",
      current: "THB 2,500.00"
    },
    amenities: [
      "Safe in Room",
      "Air Conditioning",
      "High speed internet connection",
      "Hairdryer",
      "Shower",
      "Bathroom amenities",
      "Lamp",
      "Minibar",
      "Telephone",
      "Ironing board",
      "A floor only accessible via a guest room key",
      "Alarm clock",
      "Bathrobe",
    ],
    imageAlt: "Superior Garden View Room"
  },
  "deluxe": {
    title: "Deluxe",
    description: "Spacious rooms (40sqm) with modern amenities, 1 king bed or 2 single beds, bathroom with bathtub & shower.",
    statistics: {
      person: "2 Person",
      bed: "1 King bed",
      size: "40 sqm"
    },
    pricing: {
      original: "THB 3,500.00",
      current: "THB 2,800.00"
    },
    amenities: [
      "Safe in Room",
      "Air Conditioning",
      "High speed internet connection",
      "Hairdryer",
      "Shower",
      "Bathroom amenities",
      "Lamp",
      "Minibar",
      "Telephone",
      "Ironing board",
      "A floor only accessible via a guest room key",
      "Alarm clock",
      "Bathrobe",
    ],
    imageAlt: "Deluxe Room"
  },
  "superior": {
    title: "Superior",
    description: "Comfortable rooms (35sqm) with city views, 1 double bed, bathroom with shower.",
    statistics: {
      person: "2 Person",
      bed: "1 Double bed",
      size: "35 sqm"
    },
    pricing: {
      original: "THB 2,800.00",
      current: "THB 2,200.00"
    },
    amenities: [
      "Safe in Room",
      "Air Conditioning",
      "High speed internet connection",
      "Hairdryer",
      "Shower",
      "Bathroom amenities",
      "Lamp",
      "Minibar",
      "Telephone",
      "Ironing board",
      "A floor only accessible via a guest room key",
      "Alarm clock",
      "Bathrobe",
    ],
    imageAlt: "Superior Room"
  },
  "premier-sea-view": {
    title: "Premier Sea View",
    description: "Luxurious rooms (45sqm) with stunning sea views, 1 king bed, private balcony, bathroom with bathtub & shower.",
    statistics: {
      person: "2 Person",
      bed: "1 King bed",
      size: "45 sqm"
    },
    pricing: {
      original: "THB 4,500.00",
      current: "THB 3,800.00"
    },
    amenities: [
      "Safe in Room",
      "Air Conditioning",
      "High speed internet connection",
      "Hairdryer",
      "Shower",
      "Bathroom amenities",
      "Lamp",
      "Minibar",
      "Telephone",
      "Ironing board",
      "A floor only accessible via a guest room key",
      "Alarm clock",
      "Bathrobe",
      "Balcony with sea view",
      "Premium bedding",
    ],
    imageAlt: "Premier Sea View Room"
  },
  "supreme": {
    title: "Supreme",
    description: "Elegant rooms (50sqm) with premium amenities, 1 king bed, separate sitting area, bathroom with bathtub & shower.",
    statistics: {
      person: "2 Person",
      bed: "1 King bed",
      size: "50 sqm"
    },
    pricing: {
      original: "THB 5,200.00",
      current: "THB 4,500.00"
    },
    amenities: [
      "Safe in Room",
      "Air Conditioning",
      "High speed internet connection",
      "Hairdryer",
      "Shower",
      "Bathroom amenities",
      "Lamp",
      "Minibar",
      "Telephone",
      "Ironing board",
      "A floor only accessible via a guest room key",
      "Alarm clock",
      "Bathrobe",
      "Premium bedding",
      "Work desk",
      "Sitting area",
    ],
    imageAlt: "Supreme Room"
  },
  "suite": {
    title: "Suite",
    description: "Spacious suite (70sqm) with separate bedroom and living area, 1 king bed, premium bathroom with jacuzzi, private balcony, perfect for extended stays.",
    statistics: {
      person: "2-4 Person",
      bed: "1 King bed",
      size: "70 sqm"
    },
    pricing: {
      original: "THB 7,500.00",
      current: "THB 6,500.00"
    },
    amenities: [
      "Safe in Room",
      "Air Conditioning",
      "High speed internet connection",
      "Hairdryer",
      "Shower",
      "Bathroom amenities",
      "Lamp",
      "Minibar",
      "Telephone",
      "Ironing board",
      "A floor only accessible via a guest room key",
      "Alarm clock",
      "Bathrobe",
      "Premium bedding",
      "Work desk",
      "Separate living area",
      "Dining area",
      "Premium bathroom with jacuzzi",
      "Private balcony",
      "Complimentary minibar",
    ],
    imageAlt: "Suite Room"
  }
};

const roomImages = [
  { src: RoomImg1?.src ?? RoomImg1, alt: "Room Image" },
  { src: RoomImg2?.src ?? RoomImg2, alt: "Room Image" },
  { src: RoomImg3?.src ?? RoomImg3, alt: "Room Image" },
  { src: RoomImg4?.src ?? RoomImg4, alt: "Room Image" },
];

// Other rooms data for carousel
const OTHER_ROOMS = [
  {
    name: "Deluxe",
    slug: "deluxe",
    image: deluxeImg?.src ?? deluxeImg,
  },
  {
    name: "Superior",
    slug: "superior",
    image: superiorImg?.src ?? superiorImg,
  },
  {
    name: "Suite",
    slug: "suite",
    image: suiteImg?.src ?? suiteImg,
  },
  {
    name: "Superior Garden View",
    slug: "superior-garden-view",
    image: superiorGardenViewImg?.src ?? superiorGardenViewImg,
  },
  {
    name: "Premier Sea View",
    slug: "premier-sea-view",
    image: premierSeaViewImg?.src ?? premierSeaViewImg,
  },
  {
    name: "Supreme",
    slug: "supreme",
    image: supremeImg?.src ?? supremeImg,
  },
];

export default function RoomDetail({ roomId }) {
  const roomData = ROOM_DATA[roomId];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [otherRoomsIndex, setOtherRoomsIndex] = useState(0);
  const [mobileRoomsIndex, setMobileRoomsIndex] = useState(0);
  const [shuffledRooms, setShuffledRooms] = useState([]);

  // Filter out current room from other rooms
  const otherRooms = OTHER_ROOMS.filter(room => room.slug !== roomId);

  // Shuffle rooms on mount
  useEffect(() => {
    const shuffled = [...otherRooms].sort(() => Math.random() - 0.5);
    setShuffledRooms(shuffled);
  }, [roomId]);

  if (!roomData) {
    return null;
  }
  
  // Desktop: Show 3 rooms at a time, wrap around if needed
  const getVisibleRooms = () => {
    if (shuffledRooms.length === 0) return [];
    const rooms = [];
    for (let i = 0; i < 3; i++) {
      const index = (otherRoomsIndex + i) % shuffledRooms.length;
      rooms.push(shuffledRooms[index]);
    }
    return rooms;
  };
  const visibleRooms = getVisibleRooms();
  
  // Mobile: Get previous, current, and next room for peek effect
  const getMobileRooms = () => {
    if (shuffledRooms.length === 0) return { prev: null, current: null, next: null };
    const prevIndex = mobileRoomsIndex === 0 ? shuffledRooms.length - 1 : mobileRoomsIndex - 1;
    const nextIndex = (mobileRoomsIndex + 1) % shuffledRooms.length;
    return {
      prev: shuffledRooms[prevIndex],
      current: shuffledRooms[mobileRoomsIndex],
      next: shuffledRooms[nextIndex],
    };
  };
  const mobileRooms = getMobileRooms();
  
  const goToPreviousRooms = () => {
    setOtherRoomsIndex((prev) => 
      prev === 0 ? shuffledRooms.length - 1 : prev - 1
    );
  };

  const goToNextRooms = () => {
    setOtherRoomsIndex((prev) => 
      (prev + 1) % shuffledRooms.length
    );
  };

  const goToPreviousMobileRooms = () => {
    setMobileRoomsIndex((prev) => 
      prev === 0 ? shuffledRooms.length - 1 : prev - 1
    );
  };

  const goToNextMobileRooms = () => {
    setMobileRoomsIndex((prev) => 
      (prev + 1) % shuffledRooms.length
    );
  };

  const goToPrevious = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? roomImages.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) => 
      prev === roomImages.length - 1 ? 0 : prev + 1
    );
  };

  // Update image alt text with room-specific alt
  const imagesWithAlt = roomImages.map(img => ({
    ...img,
    alt: roomData.imageAlt
  }));

  return (
    <>
      <ChatbotFloatingButton />

      <div className="w-full bg-white">
        {/* Image Gallery Section */}
        {/* Mobile: Single image carousel */}
        <div className="relative w-full h-[249px] lg:hidden overflow-hidden">
          <div className="flex h-full gap-3 transition-transform duration-500 ease-out" style={{ transform: `translateX(calc(-${currentImageIndex * 100}% - ${currentImageIndex * 0.75}rem))` }}>
            {imagesWithAlt.map((image, index) => (
              <div
                key={index}
                className="h-full w-full shrink-0"
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>

          {/* Navigation Arrows - Mobile */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-white flex items-center justify-center shadow-lg z-10 transition-all"
            aria-label="Previous image"
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
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-white flex items-center justify-center shadow-lg z-10 transition-all"
            aria-label="Next image"
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
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Desktop: Three-panel gallery with center focus */}
        <div className="hidden lg:block relative w-full h-[600px] overflow-hidden bg-white">
          <div className="flex h-full gap-4">
            {/* Left Panel - Previous Image */}
            <div className="relative h-full w-[15%] shrink-0 overflow-hidden">
              <div 
                className="flex h-full transition-transform duration-700 ease-in-out"
                style={{
                  transform: `translateX(-${(currentImageIndex - 1 + imagesWithAlt.length) % imagesWithAlt.length * 100}%)`
                }}
              >
                {imagesWithAlt.map((image, index) => (
                  <div key={index} className="h-full w-full shrink-0">
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={goToPrevious}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-white flex items-center justify-center shadow-lg z-10 transition-all hover:cursor-pointer"
                aria-label="Previous image"
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
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
            </div>

            {/* Center Panel - Current Image (Main Focus) */}
            <div className="relative h-full w-[70%] shrink-0 overflow-hidden">
              <div 
                className="flex h-full transition-transform duration-700 ease-in-out"
                style={{
                  transform: `translateX(-${currentImageIndex * 100}%)`
                }}
              >
                {imagesWithAlt.map((image, index) => (
                  <div key={index} className="h-full w-full shrink-0">
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Right Panel - Next Image */}
            <div className="relative h-full w-[15%] shrink-0 overflow-hidden">
              <div 
                className="flex h-full transition-transform duration-700 ease-in-out"
                style={{
                  transform: `translateX(-${(currentImageIndex + 1) % imagesWithAlt.length * 100}%)`
                }}
              >
                {imagesWithAlt.map((image, index) => (
                  <div key={index} className="h-full w-full shrink-0">
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={goToNext}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full border flex items-center justify-center shadow-lg z-10 transition-all hover:cursor-pointer"
                aria-label="Next image"
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
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-[1440px] mx-auto px-2 lg:px-[160px] py-8 lg:py-12">
          {/* Room Title */}
          <h1 className="font-serif headline-3 text-gray-900 mb-10 lg:mb-6">
            {roomData.title.split(' ').map((word, index) => {
              // Add line break on mobile for specific titles
              if ((roomData.title === "Superior Garden View" || roomData.title === "Premier Sea View") && index === 1) {
                return <span key={index}><br className="lg:hidden" /> {word}</span>;
              }
              return index === 0 ? word : ` ${word}`;
            })}
          </h1>

          {/* Room Description */}
          <p className="font-sans body-1 text-gray-600 mb-10 lg:mb-8">
            {roomData.description}
          </p>

          {/* Key Statistics */}
          <div className="flex items-center gap-4 mb-6 lg:mb-8 text-gray-600 font-sans body-1">
            <span>{roomData.statistics.person}</span>
            <span className="text-gray-300">|</span>
            <span>{roomData.statistics.bed}</span>
            <span className="text-gray-300">|</span>
            <span>{roomData.statistics.size}</span>
          </div>

          {/* Pricing and Booking Section */}
          <div className="flex items-center justify-center gap-8 lg:flex-row lg:items-center lg:justify-between  mb-8 lg:mb-12 pb-8 lg:pb-12 border-b border-gray-200">
            <div className="flex flex-col">
              <span className="font-sans body-1 text-gray-400 line-through mb-1">
                {roomData.pricing.original}
              </span>
              <span className="font-sans headline-5 lg:text-3xl font-semibold text-gray-900">
                {roomData.pricing.current}
              </span>
            </div>
            <Button 
              type="button"
              buttonStyle="primary"
              buttonText="Book Now"
              className=" h-[48px] lg:w-auto lg:px-8"
              onClick={() => {
                // Navigate to booking page
                window.location.href = "/booking";
              }}
            />
          </div>

          {/* Room Amenities Section */}
          <div>
            <h2 className="font-sans text-xl lg:text-2xl font-semibold text-gray-900 mb-6">
              Room Amenities
            </h2>
            <ul className="space-y-3">
              {roomData.amenities.map((amenity, index) => (
                <li 
                  key={index}
                  className="flex items-start gap-3 font-sans body-1 text-gray-600"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-600 mt-2 shrink-0"></span>
                  <span>{amenity}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Other Rooms Section */}
        <div className="w-full bg-green-200 py-12 lg:py-16">
          {/* Section Title */}
          <div className="max-w-[1440px] mx-auto lg:px-[160px]">
            <h2 className="font-serif headline-3 text-gray-900 text-center mb-8 lg:mb-12">
              Other Rooms
            </h2>
          </div>

          {/* Room Cards Carousel */}
          <div className="relative">
            {/* Mobile: Single image carousel with peek effect */}
            <div className="relative lg:hidden px-4">
              {mobileRooms.prev && mobileRooms.current && mobileRooms.next ? (
                <div className="flex gap-3 w-full overflow-hidden justify-center items-center rounded-sm">
                  {[
                    mobileRooms.prev,
                    mobileRooms.current,
                    mobileRooms.next,
                  ].map((room, index) => (
                    <Link
                      key={`${room.slug}-${index}`}
                      href={`/rooms/${room.slug}`}
                      className={`relative overflow-hidden group block h-[200px] shrink-0 rounded-sm ${
                        index === 1 ? 'w-[80%] mx-auto' : 'w-[20%]'
                      } ${index !== 1 ? 'opacity-50' : ''}`}
                    >
                      <div className="absolute inset-0">
                        <img
                          src={room.image}
                          alt={room.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div
                          className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent"
                          aria-hidden
                        />
                      </div>
                      <div className="relative z-10 flex flex-col justify-end p-6 h-full">
                        <h3 className="font-serif text-white text-2xl mb-2">
                          {room.name}
                        </h3>
                        <span className="font-sans text-white text-sm inline-flex items-center gap-2 ">
                          Explore Room
                          <span aria-hidden>→</span>
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : null}

              {/* Mobile Navigation Buttons */}
              {mobileRooms.prev && mobileRooms.current && mobileRooms.next && (
                <div className="flex justify-center gap-4 mt-6">
                <button
                  onClick={goToPreviousMobileRooms}
                  className="w-10 h-10 rounded-full border-2 border-gray-600 flex items-center justify-center hover:border-gray-400 transition-colors"
                  aria-label="Previous room"
                >
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="text-gray-600"
                  >
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={goToNextMobileRooms}
                  className="w-10 h-10 rounded-full border-2 border-gray-600 flex items-center justify-center hover:border-gray-400 transition-colors"
                  aria-label="Next room"
                >
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="text-gray-600"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
                </div>
              )}
            </div>

            {/* Desktop: Carousel with 3 cards */}
            <div className="hidden lg:block relative w-full">
              <div className="flex gap-3 w-full overflow-hidden">
                {visibleRooms.map((room, index) => (
                  <Link
                    key={room.slug}
                    href={`/rooms/${room.slug}`}
                    className={`relative overflow-hidden group block h-[340px] shrink-0 ${
                      index === 1 ? 'w-[60%]' : 'w-[20%]'
                    }`}
                  >
                    <div className="absolute inset-0">
                      <img
                        src={room.image}
                        alt={room.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div
                        className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent"
                        aria-hidden
                      />
                    </div>
                    <div className="relative z-10 flex flex-col justify-end p-8 h-full">
                      <h3 className="font-serif text-white text-3xl mb-2">
                        {room.name}
                      </h3>
                      <span className="font-sans text-white text-base inline-flex items-center gap-2 hover:underline">
                        Explore Room
                        <span aria-hidden>→</span>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Navigation Arrows */}
              {shuffledRooms.length > 3 && (
                <div className="flex justify-center gap-10 mt-6">
                  <button
                    onClick={goToPreviousRooms}
                    className="w-12 h-12 rounded-full border border-gray-600 shadow-lg flex items-center justify-center hover:scale-110 transition-all"
                    aria-label="Previous rooms"
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
                      className="text-gray-600"
                    >
                      <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={goToNextRooms}
                    className="w-12 h-12 rounded-full border border-gray-600 shadow-lg flex items-center justify-center hover:scale-110 transition-all"
                    aria-label="Next rooms"
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
                      className="text-gray-600"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
      </div>
    </>
  );
}
