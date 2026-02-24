"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/buttons/buttons";
import ChatbotButton from "@/components/layout/chatbot/ChatbotButton";
import OtherRoomsSection from "@/components/layout/RoomDetail/OtherRoomsSection";
import RoomImg1 from "@/assets/images/1.jpg";
import RoomImg2 from "@/assets/images/2.jpg";
import RoomImg3 from "@/assets/images/3.jpg";
import RoomImg4 from "@/assets/images/4.jpg";

function createSlug(title) {
  if (!title || typeof title !== "string") return "";
  return title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function formatPrice(num) {
  if (num == null || Number.isNaN(Number(num))) return "—";
  return `THB ${Number(num).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function mapApiRoomToRoomData(apiRoom) {
  const mainImg = apiRoom.image_main || null;
  const galleryUrls = (apiRoom.image_gallery || []).map((g) => g.image_url || g.image);
  let roomImages = [mainImg, ...galleryUrls].filter(Boolean).map((src) => ({ src: String(src), alt: apiRoom.title }));
  if (roomImages.length === 0) roomImages = [{ src: "", alt: apiRoom.title }];

  return {
    title: apiRoom.title ?? "Room",
    roomNumber: apiRoom.room_number ?? "",
    description: apiRoom.description ?? "",
    statistics: {
      guestAdult: apiRoom.room_guest_adult ?? null,
      guestKid: apiRoom.room_guest_kid ?? null,
      bed: apiRoom.bed_type?.name ?? "—",
      size: apiRoom.location ?? "—",
    },
    pricing: {
      original: formatPrice(apiRoom.price_per_night),
      current: formatPrice(apiRoom.price_per_night),
    },
    amenities: (apiRoom.amenities || []).map((a) => a.name || a).filter(Boolean),
    imageAlt: `${apiRoom.title ?? "Room"} Room`,
    roomImages,
  };
}

export default function RoomDetail({ roomId }) {
  const [roomData, setRoomData] = useState(null);
  const [otherRoomsList, setOtherRoomsList] = useState([]);
  const [sameTypeRoomsList, setSameTypeRoomsList] = useState([]);
  const [sameTypeImageIndices, setSameTypeImageIndices] = useState({});
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const getImageSrc = (img) => {
    if (!img) return "";
    if (typeof img === "string") return img;
    return img?.src ?? String(img);
  };

  const defaultRoomImages = [
    { src: getImageSrc(RoomImg1), alt: "Room Image" },
    { src: getImageSrc(RoomImg2), alt: "Room Image" },
    { src: getImageSrc(RoomImg3), alt: "Room Image" },
    { src: getImageSrc(RoomImg4), alt: "Room Image" },
  ];

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setFetchError(null);
    fetch("/api/chatbot/all-room")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load room");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data?.data) ? data.data : [];
        const current = list.find(
          (r) => createSlug(r.title) === roomId || String(r.id) === roomId
        );
        if (!current) {
          setRoomData(null);
          setOtherRoomsList([]);
          setSameTypeRoomsList([]);
          return;
        }
        const currentMapped = mapApiRoomToRoomData(current);
        const otherRoomsList = [];
        const sameTypeRoomsList = [];
        list.forEach((r) => {
          const isCurrent = createSlug(r.title) === roomId || String(r.id) === roomId;
          if (isCurrent) return;
          const base = {
            name: r.title ?? r.room_type?.name ?? "Room",
            roomTypeName: r.room_type?.name ?? "",
            slug: createSlug(r.title) || String(r.id),
            image: r.image_main || "",
          };
          otherRoomsList.push(base);
          if (r.room_type?.id === current.room_type?.id) {
            const amenityList = (r.amenities || []).map((a) => a.name || a).filter(Boolean);
            const mainImg = r.image_main || "";
            const galleryUrls = (r.image_gallery || []).map((g) => g.image_url || g.image).filter(Boolean);
            const images = mainImg ? [mainImg, ...galleryUrls.filter((u) => u !== mainImg)] : galleryUrls;
            sameTypeRoomsList.push({
              ...base,
              images: images.length > 0 ? images : [mainImg].filter(Boolean),
              description: r.description ?? currentMapped.description ?? "",
              roomNumber: r.room_number ?? "",
              guestAdult: r.room_guest_adult ?? null,
              guestKid: r.room_guest_kid ?? null,
              bed: r.bed_type?.name ?? "",
              location: r.location ?? "",
              pricePerNight: r.price_per_night,
              amenities: amenityList.length > 0 ? amenityList : (currentMapped.amenities || []),
            });
          }
        });
        setRoomData(currentMapped);
        setOtherRoomsList(otherRoomsList);
        setSameTypeRoomsList(sameTypeRoomsList);
      })
      .catch((err) => {
        if (!cancelled) {
          setFetchError(err.message);
          setRoomData(null);
          setOtherRoomsList([]);
          setSameTypeRoomsList([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [roomId]);

  const roomImages = roomData?.roomImages?.length ? roomData.roomImages : defaultRoomImages;

  if (loading) {
    return (
      <div className="w-full bg-white min-h-[400px] flex items-center justify-center">
        <p className="text-gray-600">Loading room...</p>
      </div>
    );
  }

  if (!roomData) {
    return (
      <div className="w-full bg-white min-h-[400px] flex items-center justify-center">
        <p className="text-gray-600">{fetchError || "Room not found."}</p>
      </div>
    );
  }
  
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
  // Ensure src is always a string
  const imagesWithAlt = roomImages.map(img => {
    const src = typeof img.src === 'string' ? img.src : String(img.src || '');
    return {
      src,
      alt: roomData.imageAlt || "Room Image"
    };
  });

  return (
    <>
      <ChatbotButton />

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

        {/* Content Section: main room + same-type rooms in one .map */}
        <div className="max-w-[1440px] mx-auto px-2 lg:px-[160px] py-8 lg:py-12 overflow-x-hidden">
          {[
            {
              isMain: true,
              slug: roomId,
              name: roomData.title,
              description: roomData.description,
              roomNumber: roomData.roomNumber,
              guestAdult: roomData.statistics.guestAdult,
              guestKid: roomData.statistics.guestKid,
              bed: roomData.statistics.bed,
              location: roomData.statistics.size,
              priceOriginal: roomData.pricing.original,
              priceCurrent: roomData.pricing.current,
              amenities: roomData.amenities,
              images: roomImages.map((img) => (typeof img.src === "string" ? img.src : String(img?.src || ""))).filter(Boolean),
            },
            ...sameTypeRoomsList.map((r) => ({
              isMain: false,
              slug: r.slug,
              name: r.name,
              description: r.description,
              roomNumber: r.roomNumber,
              bed: r.bed,
              location: r.location,
              priceOriginal: null,
              priceCurrent: null,
              pricePerNight: r.pricePerNight,
              amenities: r.amenities || [],
              images: (r.images?.length > 0 ? r.images : [r.image].filter(Boolean)),
            })),
          ].map((block, blockIndex) => {
            const roomImagesList = block.images?.length > 0 ? block.images : [].filter(Boolean);
            const slideIndex = block.isMain ? 0 : (sameTypeImageIndices[block.slug] ?? 0);
            const goPrev = (e) => {
              e.preventDefault();
              if (block.isMain) return;
              setSameTypeImageIndices((prev) => ({
                ...prev,
                [block.slug]: slideIndex === 0 ? roomImagesList.length - 1 : slideIndex - 1,
              }));
            };
            const goNext = (e) => {
              e.preventDefault();
              if (block.isMain) return;
              setSameTypeImageIndices((prev) => ({
                ...prev,
                [block.slug]: (slideIndex + 1) % roomImagesList.length,
              }));
            };
            return (
              <div
                key={block.isMain ? "main" : block.slug}
                className={`border-b border-gray-200 pb-12 lg:pb-16 last:border-b-0 last:pb-0 ${!block.isMain && blockIndex > 0 ? "pt-12 lg:pt-16 border-t border-gray-200 mt-12 lg:mt-16" : ""}`}
              >
                {/* Image carousel - skip for main; full width แนวนอน (เต็มจอ) */}
                {!block.isMain && roomImagesList.length > 0 && (
                  <div className="relative left-1/2 -translate-x-1/2 w-screen mb-8 lg:mb-10">
                    <div className="relative w-full h-[249px] lg:h-[400px] overflow-hidden bg-gray-100">
                      <div
                        className="flex h-full gap-3 transition-transform duration-500 ease-out"
                        style={{ transform: `translateX(calc(-${slideIndex * 100}% - ${slideIndex * 0.75}rem))` }}
                      >
                        {roomImagesList.map((src, idx) => (
                          <div key={idx} className="h-full w-full shrink-0">
                            <img src={src} alt={`${block.name} ${idx + 1}`} className="w-full h-full object-cover object-center" />
                          </div>
                        ))}
                      </div>
                      {roomImagesList.length > 1 && (
                        <>
                          <button type="button" onClick={goPrev} className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-white flex items-center justify-center shadow-lg z-10 transition-all bg-black/20" aria-label="Previous image">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                          </button>
                          <button type="button" onClick={goNext} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-white flex items-center justify-center shadow-lg z-10 transition-all bg-black/20" aria-label="Next image">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                          </button>
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-2">
                            {roomImagesList.map((_, idx) => (
                              <button key={idx} type="button" onClick={(e) => { e.preventDefault(); setSameTypeImageIndices((prev) => ({ ...prev, [block.slug]: idx })); }} className={`w-2 h-2 rounded-full transition-colors ${idx === slideIndex ? "bg-white" : "bg-white/50"}`} aria-label={`Go to slide ${idx + 1}`} />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Title */}
                {block.isMain ? (
                  <h1 className="font-serif headline-3 text-gray-900 mb-10 lg:mb-6">
                    {block.name.split(" ").map((word, index) => {
                      if ((block.name === "Superior Garden View" || block.name === "Premier Sea View") && index === 1) {
                        return <span key={index}><br className="lg:hidden" /> {word}</span>;
                      }
                      return index === 0 ? word : ` ${word}`;
                    })}
                  </h1>
                ) : (
                  <h3 className="font-serif headline-3 text-gray-900 mb-4">{block.name}</h3>
                )}

                {/* Description */}
                {block.description && (
                  <p className={`font-sans body-1 text-gray-900 ${block.isMain ? "mb-10 lg:mb-12 lg:mt-2 lg:pr-80" : "mb-8 lg:mb-10"}`}>
                    {block.description}
                  </p>
                )}

                {/* Specs: guest adult/kid (icons) + bed (icon) - ทั้งห้องหลักและห้องประเภทเดียวกัน */}
                {(block.bed || block.guestAdult != null || block.guestKid != null) && (
                  <div className={`flex flex-wrap items-center gap-4 text-gray-900 font-sans body-1 ${block.isMain ? "mb-8 lg:mb-12" : "mb-8 lg:mb-10"}`}>
                    <>
                      <span className="flex items-center gap-1.5" title="Adults">
                        <svg className="w-5 h-5 text-gray-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        <span>{Number(block.guestAdult) || 0}</span>
                      </span>
                      <span className="flex items-center gap-1.5" title="Children">
                        <svg className="w-4 h-4 text-gray-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        <span>{Number(block.guestKid) || 0}</span>
                      </span>
                      {block.bed && <span className="text-gray-300">|</span>}
                    </>
                    {block.bed && (
                      <span className="flex items-center gap-1.5">
                        <svg className="w-5 h-5 text-gray-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M2 4v16" /><path d="M2 8h18a2 2 0 0 1 2 2v10" /><path d="M2 17h20" /><path d="M6 8V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4" /></svg>
                        <span>{block.bed}</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Pricing + Book Now */}
                <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10 lg:mb-12 pb-8 lg:pb-10 border-b border-gray-200 ${block.isMain ? "lg:flex lg:items-start lg:justify-between lg:gap-8" : ""}`}>
                  <div className="flex flex-col">
                    {block.priceCurrent != null ? (
                      <>
                        {block.priceOriginal && <span className="font-sans body-1 text-gray-700 line-through mb-1">{block.priceOriginal}</span>}
                        <span className="font-sans headline-5 lg:text-3xl font-semibold text-gray-900">{block.priceCurrent}</span>
                      </>
                    ) : (block.pricePerNight != null && !Number.isNaN(Number(block.pricePerNight))) ? (
                      <>
                        <span className="font-sans body-1 text-gray-700 line-through mb-1">{formatPrice(block.pricePerNight)}</span>
                        <span className="font-sans headline-5 lg:text-3xl font-semibold text-gray-900">{formatPrice(block.pricePerNight)}</span>
                      </>
                    ) : (
                      <span className="font-sans body-1 text-gray-700">Price on request</span>
                    )}
                  </div>
                  <Button
                    type="button"
                    buttonStyle="primary"
                    buttonText="Book Now"
                    className="h-[48px] lg:w-auto lg:px-8"
                    onClick={() => { window.location.href = `/booking${block.slug ? `?room=${block.slug}` : ""}`; }}
                  />
                </div>

                {/* Room Amenities */}
                {block.amenities?.length > 0 && (
                  <div>
                    <h2 className="font-sans headline-5 lg:text-2xl font-semibold text-gray-900 mb-6">
                      Room Amenities
                    </h2>
                    <div className="px-4 lg:px-3">
                      <ul className="space-y-2 body-1 lg:grid lg:grid-cols-2">
                        {block.amenities.map((amenity, idx) => (
                          <li key={idx} className="flex items-start gap-3 font-sans body-1 text-gray-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-700 mt-2 shrink-0" />
                            <span>{amenity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <OtherRoomsSection rooms={otherRoomsList} />
      </div>
    </>
  );
}
