"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/authentication";
import * as Popover from "@radix-ui/react-popover";
import LogoNav from "@/assets/logo/logo-nav.svg";
import profileIcon from "@/assets/icons/people.svg?url";
import paymentIcon from "@/assets/icons/credit.svg?url";
import bookingIcon from "@/assets/icons/cs_booking.svg?url";
import logoutIcon from "@/assets/icons/logout.svg?url";
import adminIcon from "@/assets/icons/manage.svg?url";
import promotionIcon from "@/assets/icons/ticket-percent.svg?url";
import NotificationBell from "@/components/notifications/NotificationBell";
import AgentNotificationBell from "@/components/notifications/AgentNotificationBell";

// Helper function to get image source (handles both string and object)
const getImageSrc = (img) => {
  if (!img) return '';
  if (typeof img === 'string') return img;
  return img?.src ?? String(img);
};

export default function Navbar() {
  const router = useRouter();
  const isHome = router.pathname === "/";
  const { isAuthenticated, user, userRole, logout } = useAuth();
  const isAgent = userRole === "agent";
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [navLogoUrl, setNavLogoUrl] = useState(null);
  const navRef = useRef(null);


  useEffect(() => {
    fetch("/api/hotel-information")
      .then((res) => res.json())
      .then((json) => {
        const url = json?.data?.hotelLogoUrl ?? null;
        setNavLogoUrl(url || null);
      })
      .catch(() => { });
  }, []);

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


  // จัดการ body scroll เมื่อเปิด/ปิด menu
  useEffect(() => {
    // ให้ body scroll ได้เสมอ
    document.body.style.overflow = 'auto';

    // Cleanup
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMenuOpen]);

  //neatly

  return (
    <>
      {/* Main Navbar */}
      <nav
        ref={navRef}
        className="fixed top-0 left-0 right-0 w-full bg-white h-[65px] lg:h-[100px] border-b border-gray-300 z-50"
      >
        <div className="w-full max-w-[1440px] mx-auto pt-3 lg:h-[100px] flex items-center justify-between px-4 pb-3 lg:px-[160px]">
          {/* Logo: จาก hotel_information.hotel_logo_url หรือ fallback เป็น SVG */}
          <Link href="/" className="flex items-center" aria-label="Neatly">
            {navLogoUrl ? (
              <img src={navLogoUrl} alt="Neatly logo" className="w-30 lg:w-40 h-auto object-contain" />
            ) : (
              <LogoNav className="w-30 lg:w-40" aria-hidden />
            )}
          </Link>

        {/* Desktop Navigation - แสดงเฉพาะบน desktop */}
        <div className="hidden lg:flex items-center gap-10 flex-1 justify-between ml-10">
          <div className="flex items-center gap-8">
            {isHome ? (
              <>
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
              </>
            ) : (
              <>
                <Link
                  href="/#about"
                  className="text-[#666666] font-sans text-base hover:text-[#4A6D6C] transition-colors cursor-pointer"
                >
                  About Neatly
                </Link>
                <Link
                  href="/#service"
                  className="text-[#666666] font-sans text-base hover:text-[#4A6D6C] transition-colors cursor-pointer"
                >
                  Service & Facilities
                </Link>
                <Link
                  href="/#rooms"
                  className="text-[#666666] font-sans text-base hover:text-[#4A6D6C] transition-colors cursor-pointer"
                >
                  Rooms & Suites
                </Link>
              </>
            )}
            <Link
              href="/special-offers"
              className="text-[#666666] font-sans text-base hover:text-[#4A6D6C] transition-colors cursor-pointer"
            >
              Special Offers
            </Link>
          </div>

          {/* Desktop Login/User */}
          <div className="flex items-center gap-6">
            {/* Notification Bell - desktop (agent: แจ้งเตือนมี order ใหม่) */}
            {isAuthenticated && user && (
              isAgent ? (
                <AgentNotificationBell />
              ) : (
                <NotificationBell user={user ?? null} />
              )
            )}
            {isAuthenticated && user ? (
              <Popover.Root>
                <Popover.Trigger asChild>
                  <button className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                    {(user?.profile_image_url || user?.profile_image) ? (
                      <img
                        src={getImageSrc(user.profile_image_url || user.profile_image)}
                        alt="User avatar"
                        className="w-8 h-8 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-semibold">
                        {(user?.username || user?.first_name || "U")?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    <span className="text-[#666666] font-sans text-base">
                      {user?.username || user?.first_name || user?.email || "User"}
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
                        href="/userProfile"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 font-sans text-base  hover:text-gray-800 transition-colors rounded"
                      >
                        <img src={getImageSrc(profileIcon)} alt="" className="w-5 h-5 brightness-0 opacity-60" />
                        Profile
                      </Link>
                      {!isAgent && (
                        <>
                          <Link
                            href="/payment-method"
                            className="flex items-center gap-3 px-4 py-2 text-gray-700 font-sans text-base  hover:text-gray-800 transition-colors rounded"
                          >
                            <img src={getImageSrc(paymentIcon)} alt="" className="w-5 h-5 brightness-0 opacity-60" />
                            Payment Method
                          </Link>
                          <Link
                            href="/booking-history"
                            className="flex items-center gap-3 px-4 py-2 text-gray-700 font-sans text-base  hover:text-gray-800 transition-colors rounded"
                          >
                            <img src={getImageSrc(bookingIcon)} alt="" className="w-5 h-5 brightness-0 opacity-60" />
                            Booking History
                          </Link>
                        </>
                      )}
                      {isAgent && (
                        <Link
                          href="/admin/customer-booking"
                          className="flex items-center gap-3 px-4 py-2 text-gray-700 font-sans text-base hover:text-gray-800 transition-colors rounded"
                        >
                          <img
                            src={getImageSrc(adminIcon)}
                            alt="Admin panel"
                            className="w-5 h-5 brightness-0 opacity-60"
                          />
                          Admin Panel
                        </Link>
                      )}
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
            {isAuthenticated && user && (
              isAgent ? (
                <AgentNotificationBell />
              ) : (
                <NotificationBell user={user ?? null} />
              )
            )
            }

            {/* Hamburger Menu Button */}
            <button
              onClick={() => {
                toggleMenu();
              }}
              className="flex flex-col gap-1.5 p-2 relative z-50"
              aria-label="Toggle menu"
            >
              <span className={`w-6 h-0.5 bg-[#666666] transition-all ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
              <span className={`w-6 h-0.5 bg-[#666666] transition-all ${isMenuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`w-6 h-0.5 bg-[#666666] transition-all ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
            </button>
          </div>
        </div>
      </nav>

      {/* Dropdown Menu - แสดงเมื่อเปิด menu บน mobile */}
      {isMenuOpen && (
        <div
          className="fixed top-[65px] h-full left-0 right-0 w-full bg-white shadow-lg z-60 lg:hidden overflow-y-auto"
        >
          {/* Navigation Links */}
          <div className="flex flex-col px-8 gap-6 py-4">
            {!isAuthenticated ? (
              <>
                {isHome ? (
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
                  </>
                ) : (
                  <>
                    <Link
                      href="/#about"
                      className="text-[#666666] font-sans text-base hover:text-[#4A6D6C] transition-colors cursor-pointer"
                      onClick={toggleMenu}
                    >
                      About Neatly
                    </Link>
                    <Link
                      href="/#service"
                      className="text-[#666666] font-sans text-base hover:text-[#4A6D6C] transition-colors cursor-pointer"
                      onClick={toggleMenu}
                    >
                      Service & Facilities
                    </Link>
                    <Link
                      href="/#rooms"
                      className="text-[#666666] font-sans text-base hover:text-[#4A6D6C] transition-colors cursor-pointer"
                      onClick={toggleMenu}
                    >
                      Rooms & Suites
                    </Link>
                  </>
                )}
                <Link
                  href="/special-offers"
                  className="text-[#666666] font-sans text-base hover:text-[#4A6D6C] transition-colors cursor-pointer"
                >
                  Special Offers
                </Link>

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
                <div className="flex items-center gap-3 px-1 py-2 pb-3 mb-2 border-b border-gray-300">
                  {user?.profile_image_url || user?.profile_image ? (
                    <img
                      src={user.profile_image_url || user.profile_image}
                      alt="User avatar"
                      className="w-9 h-9 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-semibold">
                      {(user?.username || user?.first_name || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-gray-600 font-semibold text-base font-sans truncate max-w-[120px]">
                    {(() => {
                      const displayName = user?.username ?? user?.first_name ?? "User";
                      const name = String(displayName);
                      return name ? `${name.charAt(0).toUpperCase()}${name.slice(1)}` : "User";
                    })()}
                  </span>
                </div>
                <Link
                  href="/userProfile"
                  className="flex items-center pl-3 gap-5 text-gray-600 font-sans text-base hover:text-[#4A6D6C] transition-colors"
                  onClick={toggleMenu}
                >
                  <img src={profileIcon?.src || profileIcon || ''} alt="Profile" className="w-5 h-5 brightness-0 opacity-60" />
                  Profile
                </Link>
                {!isAgent && (
                  <>
                    <Link
                      href="/payment-method"
                      className="flex items-center pl-3 gap-5 text-gray-600 font-sans text-base hover:text-[#4A6D6C] transition-colors"
                      onClick={toggleMenu}
                    >
                      <img src={paymentIcon?.src || paymentIcon || ''} alt="Payment method" className="w-5 h-5 brightness-0 opacity-60" />
                      Payment Method
                    </Link>
                    <Link
                      href="/booking-history"
                      className="flex items-center pl-3 gap-5 text-gray-600 font-sans text-base hover:text-[#4A6D6C] transition-colors"
                      onClick={toggleMenu}
                    >
                      <img src={bookingIcon?.src || bookingIcon || ''} alt="Booking history" className="w-5 h-5 brightness-0 opacity-60" />
                      Booking History
                    </Link>
                    <Link
                      href="/special-offers"
                      className="flex items-center pl-3 gap-5 text-gray-600 font-sans text-base hover:text-[#4A6D6C] transition-colors"
                      onClick={toggleMenu}
                    >
                      <img src={getImageSrc(promotionIcon)} alt="Special offers" className="w-5 h-5 brightness-0 opacity-60" />
                      Special Offers
                    </Link>
                  </>
                )}
                {isAgent && (
                  <>
                    <Link
                      href="/special-offers"
                      className="flex items-center pl-3 gap-5 text-gray-600 font-sans text-base hover:text-[#4A6D6C] transition-colors"
                      onClick={toggleMenu}
                    >
                      <img src={getImageSrc(promotionIcon)} alt="Special offers" className="w-5 h-5 brightness-0 opacity-60" />
                      Special Offers
                    </Link>
                  </>
                )}

                {/* Separator */}
                <div className="border-t border-gray-300"></div>

                {/* Logout Button */}
                <button
                  onClick={() => {
                    logout();
                    toggleMenu();
                  }}
                  className="flex items-center pl-3 gap-5 text-left text-gray-600 font-sans text-base hover:text-[#4A6D6C] transition-colors"
                >
                  <img src={logoutIcon?.src || logoutIcon || ''} alt="Logout" className="w-5 h-5 brightness-0 opacity-60" />
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