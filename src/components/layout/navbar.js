"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/authentication";
import * as Popover from "@radix-ui/react-popover";
import LogoNav from "@/assets/logo/logo-nav.svg";
import notiIcon from "@/assets/icons/noti.svg?url";
import profileIcon from "@/assets/icons/people.svg?url";
import paymentIcon from "@/assets/icons/credit.svg?url";
import bookingIcon from "@/assets/icons/cs_booking.svg?url";
import logoutIcon from "@/assets/icons/logout.svg?url";

// Helper function to get image source (handles both string and object)
const getImageSrc = (img) => {
  if (!img) return '';
  if (typeof img === 'string') return img;
  return img?.src ?? String(img);
};

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [navbarHeight, setNavbarHeight] = useState(0);
  const navRef = useRef(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const navbarHeight = navRef.current?.offsetHeight || 0;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
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
        <Link href="/" className="flex items-center" aria-label="Neatly">
          <LogoNav className="w-30 lg:w-40" aria-hidden />
        </Link>

        {/* Desktop Navigation - แสดงเฉพาะบน desktop */}
        <div className="hidden lg:flex items-center gap-10 flex-1 justify-between ml-10">
          <div className="flex items-center gap-8">
            <a 
              href="#about" 
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('about');
              }}
              className="text-[#666666] font-sans text-base hover:text-[#4A6D6C] transition-colors cursor-pointer"
            >
              About Neatly
            </a>
            <a 
              href="#service" 
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('service');
              }}
              className="text-[#666666] font-sans text-base hover:text-[#4A6D6C] transition-colors cursor-pointer"
            >
              Service & Facilities
            </a>
            <a 
              href="#rooms" 
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('rooms');
              }}
              className="text-[#666666] font-sans text-base hover:text-[#4A6D6C] transition-colors cursor-pointer"
            >
              Rooms & Suites
            </a>
          </div>

          {/* Desktop Login/User */}
          <div className="flex items-center gap-6">
            {isAuthenticated && user ? (
              <Popover.Root>
                <Popover.Trigger asChild>
                  <button className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                    {user?.profile_image_url || user?.profile_image ? (
                      <img
                        src={user.profile_image_url || user.profile_image}
                        alt="User avatar"
                        className="w-8 h-8 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-semibold">
                        {(user?.username || user?.first_name || "U")?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    <span className="text-[#666666] font-sans text-base">
                      {user.username || user.first_name || user.email || "User"}
                    </span>
                    <svg 
                      width="12" 
                      height="12" 
                      viewBox="0 0 12 12" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-[#666666]"
                    >
                      <path 
                        d="M2 4L6 8L10 4" 
                        stroke="currentColor" 
                        strokeWidth="1.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Content
                    className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 min-w-[200px] z-50"
                    sideOffset={8}
                    align="end"
                  >
                    <div className="flex flex-col gap-1">
                      <Link 
                        href="/profile" 
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 font-sans text-base  hover:text-gray-800 transition-colors rounded"
                      >
                        <img src={getImageSrc(profileIcon)} alt="" className="w-5 h-5 brightness-0 opacity-60" />
                        Profile
                      </Link>
                      <Link 
                        href="/payment" 
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 font-sans text-base  hover:text-gray-800 transition-colors rounded"
                      >
                        <img src={getImageSrc(paymentIcon)} alt="" className="w-5 h-5 brightness-0 opacity-60" />
                        Payment Method
                      </Link>
                      <Link 
                        href="/booking" 
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 font-sans text-base  hover:text-gray-800 transition-colors rounded"
                      >
                        <img src={getImageSrc(bookingIcon)} alt="" className="w-5 h-5 brightness-0 opacity-60" />
                        Booking History
                      </Link>
                      <div className="border-t border-gray-200 my-1"></div>
                      <button 
                        onClick={logout}
                        className="flex items-center gap-3 px-4 py-2 text-left text-gray-700 font-sans text-base  hover:text-gray-800 transition-colors rounded hover:cursor-pointer"
                      >
                        <img src={getImageSrc(logoutIcon)} alt="" className="w-5 h-5 brightness-0 opacity-60" />
                        Logout
                      </button>
                    </div>
                    <Popover.Arrow className="fill-white" />
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            ) : (
              <Link href="/login" className="text-[#EB8D61] font-sans text-base hover:text-[#C14817] transition-colors">
                Log in
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Right Side - Notification & Hamburger */}
        <div className="lg:hidden flex items-center gap-3">
          {/* Notification Bell - แสดงเฉพาะเมื่อ login แล้ว */}
          {isAuthenticated && user && (
            <button
              className="p-2 relative"
              aria-label="Notifications"
            >
              <img src={getImageSrc(notiIcon)} alt="Notifications" className="w-6 h-6" />
              {/* Notification Badge - สามารถเพิ่มจำนวนแจ้งเตือนได้ */}
              {/* <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span> */}
            </button>
          )}
          
          {/* Hamburger Menu Button */}
          <button
            onClick={toggleMenu}
            className="flex flex-col gap-1.5 p-2 relative z-50"
            aria-label="Toggle menu"
          >
            <span className={`w-6 h-0.5 bg-[#666666] transition-all ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`w-6 h-0.5 bg-[#666666] transition-all ${isMenuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`w-6 h-0.5 bg-[#666666] transition-all ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
          </button>
        </div>
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
            {!isAuthenticated ? (
              <>
                <a 
                  href="#about" 
                  className="text-[#666666] font-sans text-base hover:text-[#4A6D6C] transition-colors cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection('about');
                    toggleMenu();
                  }}
                >
                  About Neatly
                </a>
                <a 
                  href="#service" 
                  className="text-[#666666] font-sans text-base hover:text-[#4A6D6C] transition-colors cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection('service');
                    toggleMenu();
                  }}
                >
                  Service & Facilities
                </a>
                <a 
                  href="#rooms" 
                  className="text-[#666666] font-sans text-base hover:text-[#4A6D6C] transition-colors cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection('rooms');
                    toggleMenu();
                  }}
                >
                  Rooms & Suites
                </a>

                {/* Separator */}
                <div className="border-t border-gray-300"></div>

                {/* Login Link */}
                <Link 
                  href="/login" 
                  className="text-[#EB8D61] font-sans text-base hover:text-[#C14817] transition-colors"
                  onClick={toggleMenu}
                >
                  Log in
                </Link>
              </>
            ) : (
              <>
                {/* User Menu Items */}
                <div className="flex items-center gap-3 px-1 py-2">
                  {user?.profile_image ? (
                    <img
                      src={user.profile_image}
                      alt="User avatar"
                      className="w-9 h-9 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-lg font-semibold">
                      {user?.username?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}
                  <span className="text-gray-600 font-semibold text-base font-sans truncate max-w-[120px]">
                    {user?.username ?? user?.first_name ?? "User"}
                  </span>
                </div>
                <Link 
                  href="/profile" 
                  className="flex items-center gap-3 text-gray-600 font-sans text-base hover:text-[#4A6D6C] transition-colors"
                  onClick={toggleMenu}
                >
                  <img src={profileIcon?.src || profileIcon || ''} alt="" className="w-5 h-5 brightness-0 opacity-60" />
                  Profile
                </Link>
                <Link 
                  href="/payment" 
                  className="flex items-center gap-3 text-gray-600 font-sans text-base hover:text-[#4A6D6C] transition-colors"
                  onClick={toggleMenu}
                >
                  <img src={paymentIcon?.src || paymentIcon || ''} alt="" className="w-5 h-5 brightness-0 opacity-60" />
                  Payment Method
                </Link>
                <Link 
                  href="/booking" 
                  className="flex items-center gap-3 text-gray-600 font-sans text-base hover:text-[#4A6D6C] transition-colors"
                  onClick={toggleMenu}
                >
                  <img src={bookingIcon?.src || bookingIcon || ''} alt="" className="w-5 h-5 brightness-0 opacity-60" />
                  Booking History
                </Link>

                {/* Separator */}
                <div className="border-t border-gray-300"></div>

                {/* Logout Button */}
                <button 
                  onClick={() => {
                    logout();
                    toggleMenu();
                  }}
                  className="flex items-center gap-3 text-left text-gray-600 font-sans text-base hover:text-[#4A6D6C] transition-colors"
                >
                  <img src={logoutIcon?.src || logoutIcon || ''} alt="" className="w-5 h-5 brightness-0 opacity-60" />
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}