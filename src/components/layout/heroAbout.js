"use client";

import { useState, useEffect } from "react";
import SpaIcon from "@/assets/icons/bx_spa.svg?url";
import WifiIcon from "@/assets/icons/ant-design_wifi-outlined.svg?url";
import SaunaIcon from "@/assets/icons/ep_hot-water.svg?url";
import CarIcon from "@/assets/icons/carbon_car.svg?url";
import SofaIcon from "@/assets/icons/iconoir_two-seater-sofa.svg?url";
import PhoneIcon from "@/assets/icons/bx_phone-call.svg?url";
import DumpbelIcon from "@/assets/icons/dumpbel.svg?url";


// Fallback เมื่อไม่มี room_type หรือ API ล้มเหลว
import HotelImg1 from "@/assets/images/1.jpg";
import HotelImg2 from "@/assets/images/2.jpg";
import HotelImg3 from "@/assets/images/3.jpg";
import HotelImg4 from "@/assets/images/4.jpg";
import HotelImg5 from "@/assets/images/5.jpg";
import HotelImg6 from "@/assets/images/6.jpg";

const FALLBACK_IMAGES = [
  { src: HotelImg1?.src ?? HotelImg1, alt: "Hotel interior" },
  { src: HotelImg2?.src ?? HotelImg2, alt: "Hotel bathroom" },
  { src: HotelImg3?.src ?? HotelImg3, alt: "Hotel pool" },
  { src: HotelImg4?.src ?? HotelImg4, alt: "Hotel pool" },
  { src: HotelImg5?.src ?? HotelImg5, alt: "Hotel pool" },
  { src: HotelImg6?.src ?? HotelImg6, alt: "Hotel pool" },
];

const services = [
  { icon: SpaIcon, label: "Spa" },
  { icon: SaunaIcon, label: "Sauna" },
  { icon: DumpbelIcon, label: "Fitness" },
  { icon: SofaIcon, label: "Arrival Lounge" },
  { icon: WifiIcon, label: "Free Wifi" },
  { icon: CarIcon, label: "Parking" },
  { icon: PhoneIcon, label: "24 hours operation" },
];

const COLUMN_WIDTH_MOBILE = 180;
const COLUMN_WIDTH_DESKTOP = 400;
const GAP_MOBILE = 16;
const GAP_DESKTOP = 24;

const DEFAULT_DESCRIPTION = `Set in Bangkok, Thailand. Neatly Hotel offers 5-star accommodation with an outdoor pool, kids' club, sports facilities and a fitness centre. There is also a spa, an indoor pool and saunas.

All units at the hotel are equipped with a seating area, a flat-screen TV with satellite channels, a dining area and a private bathroom with free toiletries, a bathtub and a hairdryer. Every room in Neatly Hotel features a furnished balcony. Some rooms are equipped with a coffee machine.

Free WIFI and entertainment facilities are available at property and also rentals are provided to explore the area.`;

export default function HeroAbout() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(1440);
  const [sliderImages, setSliderImages] = useState(FALLBACK_IMAGES);
  const [hotelName, setHotelName] = useState("Neatly Hotel");
  const [hotelDescription, setHotelDescription] = useState(DEFAULT_DESCRIPTION);

  // หัวข้อและคำอธิบายจากตาราง hotel_information (hotel_name, hotel_description)
  useEffect(() => {
    fetch("/api/hotel-information")
      .then((res) => res.json())
      .then((json) => {
        const d = json?.data;
        if (d) {
          setHotelName(d.hotelName ?? "Neatly Hotel");
          setHotelDescription(d.hotelDescription?.trim() || DEFAULT_DESCRIPTION);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/rooms/rooms-all")
      .then((res) => res.json())
      .then((json) => {
        const list = Array.isArray(json?.data) ? json.data : [];
        const withMain = list
          .filter((r) => r.image_main)
          .map((r) => ({ src: r.image_main, alt: r.name || r.room_type?.name || "Room" }));
        if (withMain.length > 0) setSliderImages(withMain);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const updateViewport = () => {
      const width = window.innerWidth;
      setIsDesktop(width >= 1024);
      setViewportWidth(width);
    };
    
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  const getMaxSlide = () => {
    if (isDesktop) {
      const step = COLUMN_WIDTH_DESKTOP + GAP_DESKTOP;
      const totalWidth = (COLUMN_WIDTH_DESKTOP + GAP_DESKTOP) * (sliderImages.length - 1) + COLUMN_WIDTH_DESKTOP;
      const maxTranslate = Math.max(0, totalWidth - viewportWidth);
      return maxTranslate > 0 ? Math.ceil(maxTranslate / step) : sliderImages.length - 1;
    } else {
      const step = COLUMN_WIDTH_MOBILE + GAP_MOBILE;
      const totalWidth = (COLUMN_WIDTH_MOBILE + GAP_MOBILE) * (sliderImages.length - 1) + COLUMN_WIDTH_MOBILE;
      const maxTranslate = Math.max(0, totalWidth - viewportWidth);
      return maxTranslate > 0 ? Math.ceil(maxTranslate / step) : sliderImages.length - 1;
    }
  };

  const goPrev = () => {
    setCurrentSlide((i) => (i <= 0 ? getMaxSlide() : i - 1));
  };
  const goNext = () => {
    setCurrentSlide((i) => {
      const maxSlide = getMaxSlide();
      return i >= maxSlide ? 0 : i + 1;
    });
  };

  const getTransform = () => {
    if (isDesktop) {
      const step = COLUMN_WIDTH_DESKTOP + GAP_DESKTOP;
      const totalWidth = (COLUMN_WIDTH_DESKTOP + GAP_DESKTOP) * (sliderImages.length - 1) + COLUMN_WIDTH_DESKTOP;
      const maxTranslate = Math.max(0, totalWidth - viewportWidth);
      const translate = Math.min(0, Math.max(-maxTranslate, -currentSlide * step));
      return `translateX(${translate}px)`;
    } else {
      const step = COLUMN_WIDTH_MOBILE + GAP_MOBILE;
      const totalWidth = (COLUMN_WIDTH_MOBILE + GAP_MOBILE) * (sliderImages.length - 1) + COLUMN_WIDTH_MOBILE;
      const maxTranslate = Math.max(0, totalWidth - viewportWidth);
      const translate = Math.min(0, Math.max(-maxTranslate, -currentSlide * step));
      return `translateX(${translate}px)`;
    }
  };

  return (
    <section id="about" className="w-full bg-white">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-[160px]">
        {/* Hotel Overview Section */}
        <div className="py-12 lg:py-16">
          <div className="flex flex-col lg:flex-row lg:items-start lg:ml-19">
            <h2 className={`font-serif text-start ${isDesktop ? 'headline-2' : 'headline-3'} text-green-800 mb-6 lg:text-left lg:mb-0 lg:w-[280px] lg:shrink-0 whitespace-nowrap`}>
              {hotelName}
            </h2>
            {/* hotelName มาจาก hotel_information.hotel_name */}

            <div className="space-y-4 text-gray-700 body-1 max-w-3xl lg:ml-[-80px] lg:mt-[140px]">
              {hotelDescription.split(/\n\n+/).map((paragraph, i) => (
                <p key={i}>{paragraph.trim()}</p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Image Slider - กว้างเต็มจอ, mobile: 180x255, desktop: 400x500 */}
      <div className="relative mb-12 lg:mb-16 w-full overflow-hidden">
        <div className="overflow-hidden w-full">
          <div
            className="flex gap-3 lg:gap-3 transition-transform duration-500 ease-out"
            style={{
              transform: getTransform(),
            }}
          >
            {sliderImages.map((img, index) => (
              <div
                key={index}
                className="w-[180px] h-[255px] lg:w-[400px] lg:h-[500px] overflow-hidden shrink-0"
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={goPrev}
          className="absolute left-15 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-white hover:bg-white flex items-center justify-center shadow-lg z-10 "
          aria-label="Previous"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={goNext}
          className="absolute right-15 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-white hover:bg-white flex items-center justify-center shadow-lg z-10 "
          aria-label="Next"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      
    </section>
  );
}
