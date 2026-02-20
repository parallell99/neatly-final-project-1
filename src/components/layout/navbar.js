"use client";

import { useState, useEffect, useRef } from "react";
import logoNav from "@/assets/logo/logo-nav.svg?url";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [navbarHeight, setNavbarHeight] = useState(0);
  const navRef = useRef(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // คำนวณความสูงของ navbar
  useEffect(() => {
    if (navRef.current) {
      setNavbarHeight(navRef.current.offsetHeight);
    }
  }, []);

  // จัดการ body scroll เมื่อเปิด/ปิด menu
  useEffect(() => {
    // ให้ body scroll ได้เสมอ
    document.body.style.overflow = 'auto';
    
    // Cleanup
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMenuOpen]);

  return (
    <>
      {/* Main Navbar */}
      <nav ref={navRef} className="top-0 w-full pt-3 lg:h-[100px] bg-white flex items-center justify-between px-4 pb-3 border-b border-gray-200 lg:px-[160px] max-w-[1440px] mx-auto z-50">
        {/* Logo */}
        <div className="flex items-center">
          <img src={logoNav} alt="Neatly" className="w-30 lg:w-40" />
        </div>

        {/* Desktop Navigation - แสดงเฉพาะบน desktop */}
        <div className="hidden lg:flex items-center gap-10 flex-1 justify-between ml-10">
          <div className="flex items-center gap-8">
            <a href="#" className="text-[#666666] font-sans text-base hover:text-[#4A6D6C] transition-colors">
              About Neatly
            </a>
            <a href="#" className="text-[#666666] font-sans text-base hover:text-[#4A6D6C] transition-colors">
              Service & Facilities
            </a>
            <a href="#" className="text-[#666666] font-sans text-base hover:text-[#4A6D6C] transition-colors">
              Rooms & Suites
            </a>
          </div>

          {/* Desktop Login */}
          <div>
            <a href="#" className="text-[#EB8D61] font-sans text-base hover:text-[#C14817] transition-colors">
              Log in
            </a>
          </div>
        </div>

        {/* Hamburger Menu Button - แสดงเฉพาะบน mobile (lg และเล็กกว่า) */}
        <button
          onClick={toggleMenu}
          className="lg:hidden flex flex-col gap-1.5 p-2 relative z-50"
          aria-label="Toggle menu"
        >
          <span className={`w-6 h-0.5 bg-[#666666] transition-all ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
          <span className={`w-6 h-0.5 bg-[#666666] transition-all ${isMenuOpen ? 'opacity-0' : ''}`}></span>
          <span className={`w-6 h-0.5 bg-[#666666] transition-all ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
        </button>
      </nav>

      {/* Dropdown Menu - แสดงเมื่อเปิด menu บน mobile */}
      {isMenuOpen && (
        <div 
          className=" left-0 right-0 w-full bg-white shadow-lg z-40 lg:hidden overflow-y-auto"
          style={{ 
            top: `${navbarHeight}px`,
            height: `calc(100vh - ${navbarHeight}px)`
          }}
        >
          {/* Navigation Links */}
          <div className="flex flex-col px-8 gap-6 py-4">
            <a 
              href="#" 
              className="text-[#666666] font-sans text-base hover:text-[#4A6D6C] transition-colors"
              onClick={toggleMenu}
            >
              About Neatly
            </a>
            <a 
              href="#" 
              className="text-[#666666] font-sans text-base hover:text-[#4A6D6C] transition-colors"
              onClick={toggleMenu}
            >
              Service & Facilities
            </a>
            <a 
              href="#" 
              className="text-[#666666] font-sans text-base hover:text-[#4A6D6C] transition-colors"
              onClick={toggleMenu}
            >
              Rooms & Suites
            </a>

            {/* Separator */}
            <div className="border-t border-gray-300 "></div>

            {/* Login Link */}
            <a 
              href="#" 
              className="text-[#EB8D61] font-sans text-base hover:text-[#C14817] transition-colors"
              onClick={toggleMenu}
            >
              Log in
            </a>
          </div>
        </div>
      )}
    </>
  );
}