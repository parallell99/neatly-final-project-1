"use client";

import { useState, useEffect } from "react";

const testimonials = [
  {
    quote:
      "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.",
    name: "Katherine",
    company: "Company®",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop&crop=face",
  },
  {
    quote:
      "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.",
    name: "James",
    company: "Travel Co.",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=face",
  },
  {
    quote:
      "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore.",
    name: "Sarah",
    company: "Stay Ltd.",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=96&h=96&fit=crop&crop=face",
  },
];

const AUTO_SLIDE_MS = 8000;

export default function HeroSlide() {
  const [current, setCurrent] = useState(0);
  const t = testimonials[current];

  useEffect(() => {
    const id = setInterval(() => {
      setCurrent((i) => (i === testimonials.length - 1 ? 0 : i + 1));
    }, AUTO_SLIDE_MS);
    return () => clearInterval(id);
  }, []);

  const goPrev = () => {
    setCurrent((i) => (i === 0 ? testimonials.length - 1 : i - 1));
  };

  const goNext = () => {
    setCurrent((i) => (i === testimonials.length - 1 ? 0 : i + 1));
  };

  const arrowButtonClass =
    "w-12 h-12 rounded-full border-2 border-orange-500 flex items-center justify-center text-orange-500 hover:bg-orange-500 hover:text-white transition-colors  shrink-0";

  const arrowIcon = (isPrev) => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {isPrev ? (
        <path d="M19 12H5M12 19l-7-7 7-7" />
      ) : (
        <path d="M5 12h14M12 5l7 7-7 7" />
      )}
    </svg>
  );

  return (
    <section className="w-full h-[752px] py-16 px-4 bg-green-200 flex items-center justify-center">
      <div className="max-w-[1440px] mx-auto w-full relative flex items-center justify-center">
        {/* Desktop: ลูกศรอยู่ตำแหน่งคงที่ซ้าย-ขวาของกล่องกลาง ไม่ขยับตามเนื้อหา */}
        <div className="hidden lg:block w-full max-w-5xl mx-auto relative">
          {/* ปุ่มลูกศร ตำแหน่งคงที่ซ้าย-ขวาของกล่อง max-w-5xl */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
            <button
              onClick={goPrev}
              className={arrowButtonClass}
              aria-label="Previous testimonial"
            >
              {arrowIcon(true)}
            </button>
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
            <button
              onClick={goNext}
              className={arrowButtonClass}
              aria-label="Next testimonial"
            >
              {arrowIcon(false)}
            </button>
          </div>

          {/* กล่องเนื้อหากลาง กว้างคงที่ + ความสูง quote คงที่ เพื่อไม่ให้จุด/ปุ่มขยับ */}
          <div className="text-center w-full max-w-3xl mx-auto px-4">
            <h2 className="font-serif headline-3 text-green-800 pb-7">
              Our Customer Says
            </h2>

            <blockquote className="mb-10 min-h-30 flex flex-col justify-center">
              <p className="headline-5 text-green-700 leading-relaxed relative">
                <span className="headline-5 leading-none align-top">
                  &ldquo;
                </span>
                {t.quote}
                <span className="headline-5 leading-none align-bottom">
                  &rdquo;
                </span>
              </p>
            </blockquote>

            <div className="flex justify-center items-center gap-4 mb-8 min-h-10">
              <img
                src={t.avatar}
                alt={t.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow shrink-0"
              />
              <p className="font-sans text-gray-600 text-sm md:text-base">
                {t.name}, {t.company}
              </p>
            </div>

            <div className="flex justify-center gap-2 min-h-5">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className="w-2.5 h-2.5 rounded-full transition-colors shrink-0"
                  style={{
                    backgroundColor: i === current ? "#6B7280" : "#D1D5DB",
                  }}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Mobile: เนื้อหากลาง + ลูกศรอยู่ล่าง พื้นที่ quote คงที่ */}
        <div className="lg:hidden text-center w-full max-w-3xl mx-auto">
          <h2 className="font-serif headline-3 text-green-800 pb-7">
            Our Customer
            <br />
            Says
          </h2>

          <blockquote className="mb-10 min-h-30 flex flex-col justify-center">
            <p className="headline-5 text-green-700 leading-relaxed relative">
              <span className="headline-5 leading-none align-top">
                &ldquo;
              </span>
              {t.quote}
              <span className="headline-5 leading-none align-bottom">
                &rdquo;
              </span>
            </p>
          </blockquote>

          <div className="flex justify-center items-center gap-4 mb-8 min-h-10">
            <img
              src={t.avatar}
              alt={t.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow shrink-0"
            />
            <p className="font-sans text-gray-600 text-sm md:text-base">
              {t.name}, {t.company}
            </p>
          </div>

          <div className="flex justify-center gap-2 mb-8 min-h-5">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className="w-2.5 h-2.5 rounded-full transition-colors shrink-0 "
                style={{
                  backgroundColor: i === current ? "#6B7280" : "#D1D5DB",
                }}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          <div className="flex justify-center gap-4 min-h-12">
            <button
              onClick={goPrev}
              className={arrowButtonClass}
              aria-label="Previous testimonial"
            >
              {arrowIcon(true)}
            </button>
            <button
              onClick={goNext}
              className={arrowButtonClass}
              aria-label="Next testimonial"
            >
              {arrowIcon(false)}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
