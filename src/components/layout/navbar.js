"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/authentication";
import * as Popover from "@radix-ui/react-popover";
import LogoNav from "@/assets/logo/logo-nav.svg";
import notiIcon from "@/assets/icons/noti.svg?url";
import profileIcon from "@/assets/icons/people.svg?url";
import paymentIcon from "@/assets/icons/credit.svg?url";
import bookingIcon from "@/assets/icons/cs_booking.svg?url";
import logoutIcon from "@/assets/icons/logout.svg?url";
import adminIcon from "@/assets/icons/manage.svg?url";
import promotionIcon from "@/assets/icons/ticket-percent.svg?url";

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
  const [isUserNotiOpen, setIsUserNotiOpen] = useState(false);
  const [isAgentNotiOpen, setIsAgentNotiOpen] = useState(false);
  const [navbarHeight, setNavbarHeight] = useState(0);
  const [navLogoUrl, setNavLogoUrl] = useState(null);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [newOrdersList, setNewOrdersList] = useState([]);
  const navRef = useRef(null);

  // แจ้งเตือนสำหรับ user จาก API: จ่ายเงินสำเร็จ + เตือน check-in ล่วงหน้า 1 วัน
  const [userNotifications, setUserNotifications] = useState([]);

  useEffect(() => {
    fetch("/api/hotel-information")
      .then((res) => res.json())
      .then((json) => {
        const url = json?.data?.hotelLogoUrl ?? null;
        setNavLogoUrl(url || null);
      })
      .catch(() => { });
  }, []);

  const NOTIFICATION_READ_KEY = "neatly_admin_orders_read_at";
  const USER_NOTIFICATIONS_VIEWED_COUNT_KEY = "neatly_user_notifications_viewed_count";

  const getUserNotificationsViewedCount = () => {
    if (typeof window === "undefined") return 0;
    try {
      return parseInt(window.localStorage.getItem(USER_NOTIFICATIONS_VIEWED_COUNT_KEY), 10) || 0;
    } catch (_) {
      return 0;
    }
  };

  const markUserNotificationsViewed = () => {
    if (typeof window !== "undefined" && userNotifications.length > 0) {
      try {
        window.localStorage.setItem(USER_NOTIFICATIONS_VIEWED_COUNT_KEY, String(userNotifications.length));
      } catch (_) { }
    }
  };

  const markNotificationsRead = () => {
    const now = new Date().toISOString();
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(NOTIFICATION_READ_KEY, now);
      } catch (_) { }
    }
    setNewOrdersCount(0);
  };

  // Notification: จำนวน order ใหม่ (paid หลังเวลาที่อ่านล่าสุด หรือ 24 ชม.) — แสดงเฉพาะ agent
  useEffect(() => {
    if (!isAgent) return;
    const fetchCount = () => {
      let url = "/api/admin/orders-new-count";
      if (typeof window !== "undefined") {
        try {
          const readAt = window.localStorage.getItem(NOTIFICATION_READ_KEY);
          if (readAt) url += "?since=" + encodeURIComponent(readAt);
        } catch (_) { }
      }
      fetch(url)
        .then((res) => res.json())
        .then((json) => setNewOrdersCount(json?.count ?? 0))
        .catch(() => setNewOrdersCount(0));
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60 * 1000);
    return () => clearInterval(interval);
  }, [isAgent]);

  // ดึงแจ้งเตือน user จริง: จ่ายเงินสำเร็จ (7 วันล่าสุด) + เตือน check-in พรุ่งนี้
  useEffect(() => {
    if (!isAuthenticated || !user || isAgent) {
      setUserNotifications([]);
      return;
    }
    const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
    if (!token) return;
    fetch("/api/booking/notifications", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((json) => setUserNotifications(json?.notifications ?? []))
      .catch(() => setUserNotifications([]));
  }, [isAuthenticated, user, isAgent]);

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

  //neatly

  return (
    <>
      {/* Main Navbar */}
      <nav ref={navRef} className=" top-0 w-full pt-3 lg:h-[100px] bg-white flex items-center justify-between px-4 pb-3 border-b border-gray-300 lg:px-[160px] max-w-[1440px] mx-auto z-50">
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
                <Popover.Root
                  onOpenChange={(open) => {
                    if (open) {
                      markNotificationsRead();
                      fetch("/api/admin/orders-list")
                        .then((res) => res.json())
                        .then((json) => setNewOrdersList(json?.data ?? []))
                        .catch(() => setNewOrdersList([]));
                    } else {
                      setNewOrdersList([]);
                    }
                  }}
                >
                  <Popover.Trigger asChild>
                    <button
                      className="p-2 relative hover:opacity-80 transition-opacity cursor-pointer"
                      aria-label="Notifications"
                    >
                      <img src={getImageSrc(notiIcon)} alt="Notifications" className="w-6 h-6" />
                      {newOrdersCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-xs font-semibold rounded-full">
                          {newOrdersCount > 99 ? "99+" : newOrdersCount}
                        </span>
                      )}
                    </button>
                  </Popover.Trigger>
                  <Popover.Portal>
                    <Popover.Content
                      className="bg-white rounded-lg shadow-lg border border-gray-200 p-0 min-w-[280px] max-w-[360px] max-h-[400px] overflow-hidden flex flex-col z-50"
                      sideOffset={8}
                      align="end"
                    >
                      {newOrdersList.length > 0 ? (
                        <div className="overflow-y-auto flex-1 divide-y divide-gray-100 max-h-[280px]">
                          {newOrdersList.slice(0, 10).map((order) => (
                            <Link
                              key={order.id}
                              href={`/admin/customer-booking-detail?id=${order.id}`}
                              className="block px-3 py-2 hover:bg-gray-50 text-left"
                              onClick={markNotificationsRead}
                            >
                              <p className="text-gray-800 font-sans text-sm font-medium truncate">
                                {order.customerName || "—"}
                              </p>
                              <p className="text-gray-500 font-sans text-xs truncate">
                                {order.roomType || "—"} · Check-in {String(order.checkIn).slice(0, 10)}
                              </p>
                            </Link>
                          ))}
                        </div>
                      ) : null}
                      <div className="p-3 border-t border-gray-100">
                        <Link
                          href="/admin/customer-booking"
                          className="inline-block text-orange-500 font-sans text-sm hover:underline font-medium"
                          onClick={markNotificationsRead}
                        >
                          View Customer Booking →
                        </Link>
                      </div>
                      <Popover.Arrow className="fill-white" />
                    </Popover.Content>
                  </Popover.Portal>
                </Popover.Root>
              ) : (
                <Popover.Root
                  onOpenChange={(open) => {
                    if (open) markUserNotificationsViewed();
                  }}
                >
                  <Popover.Trigger asChild>
                    <button
                      className="p-2 relative hover:opacity-80 transition-opacity cursor-pointer"
                      aria-label="Notifications"
                    >
                      <img src={getImageSrc(notiIcon)} alt="Notifications" className="w-6 h-6" />
                      {userNotifications.length > 0 && userNotifications.length > getUserNotificationsViewedCount() && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-xs font-semibold rounded-full">
                          {userNotifications.length > 99 ? "99+" : userNotifications.length}
                        </span>
                      )}
                    </button>
                  </Popover.Trigger>
                  <Popover.Portal>
                    <Popover.Content
                      className="bg-white rounded-lg shadow-lg border border-gray-200 p-0 min-w-[320px] max-w-[380px] max-h-[360px] overflow-y-auto z-50"
                      sideOffset={8}
                      align="end"
                    >
                      <div className="divide-y divide-gray-100">
                        {userNotifications.length === 0 ? (
                          <p className="p-4 text-gray-500 font-sans text-sm">No notifications yet.</p>
                        ) : (
                          userNotifications.map((noti) => (
                            <div
                              key={noti.id}
                              className="flex gap-3 p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                              <img
                                src={noti.imageUrl}
                                alt=""
                                className="w-12 h-12 rounded-full object-cover shrink-0 border border-gray-200"
                              />
                              <p className="text-gray-700 font-sans text-sm leading-snug flex-1 min-w-0">
                                {noti.message}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                      <Popover.Arrow className="fill-white" />
                    </Popover.Content>
                  </Popover.Portal>
                </Popover.Root>
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
                        <>
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
                          <Link
                            href="/admin/promotion"
                            className="flex items-center gap-3 px-4 py-2 text-gray-700 font-sans text-base hover:text-gray-800 transition-colors rounded"
                          >
                            <img
                              src={getImageSrc(adminIcon)}
                              alt="Promotions"
                              className="w-5 h-5 brightness-0 opacity-60"
                            />
                            Promotions
                          </Link>
                        </>
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
          {/* Notification Bell - mobile: agent ใช้แผงเต็มจอเหมือน user */}
          {isAuthenticated && user && (
            isAgent ? (
              <>
                <button
                  type="button"
                  className="p-2 relative hover:opacity-80 transition-opacity cursor-pointer"
                  aria-label="Notifications"
                  aria-expanded={isAgentNotiOpen}
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsAgentNotiOpen((prev) => {
                      if (!prev) {
                        markNotificationsRead();
                        fetch("/api/admin/orders-list")
                          .then((res) => res.json())
                          .then((json) => setNewOrdersList(json?.data ?? []))
                          .catch(() => setNewOrdersList([]));
                      }
                      return !prev;
                    });
                  }}
                >
                  <img src={getImageSrc(notiIcon)} alt="Notifications" className="w-6 h-6" />
                  {newOrdersCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-xs font-semibold rounded-full">
                      {newOrdersCount > 99 ? "99+" : newOrdersCount}
                    </span>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="p-2 relative hover:opacity-80 transition-opacity cursor-pointer"
                  aria-label="Notifications"
                  aria-expanded={isUserNotiOpen}
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsUserNotiOpen((prev) => {
                      if (!prev) markUserNotificationsViewed();
                      return !prev;
                    });
                  }}
                >
                  <img src={getImageSrc(notiIcon)} alt="Notifications" className="w-6 h-6" />
                  {userNotifications.length > 0 && userNotifications.length > getUserNotificationsViewedCount() && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-xs font-semibold rounded-full">
                      {userNotifications.length > 99 ? "99+" : userNotifications.length}
                    </span>
                  )}
                </button>
              </>
            )
          )}

          {/* Hamburger Menu Button */}
          <button
            onClick={() => {
              setIsUserNotiOpen(false);
              setIsAgentNotiOpen(false);
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
      </nav>

      {/* Agent Notifications - แผงเต็มจอบน mobile (เหมือน user) */}
      {isAgentNotiOpen && isAgent && (
        <div
          className="fixed inset-0 w-full bg-white shadow-lg z-40 lg:hidden overflow-y-auto"
          style={{ paddingTop: `${navbarHeight || 65}px` }}
        >
          <div className="divide-y divide-gray-100 min-h-full">
            {newOrdersList.length === 0 ? (
              <p className="p-6 text-gray-500 font-sans text-sm">No new orders.</p>
            ) : (
              newOrdersList.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/customer-booking-detail?id=${order.id}`}
                  className="flex gap-4 p-4 hover:bg-gray-50 transition-colors active:bg-gray-100"
                  onClick={() => setIsAgentNotiOpen(false)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 font-sans text-sm font-medium">
                      {order.customerName || "—"}
                    </p>
                    <p className="text-gray-500 font-sans text-sm mt-0.5">
                      {order.roomType || "—"} · Check-in {String(order.checkIn).slice(0, 10)}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
          <div className="p-4 border-t border-gray-100">
            <Link
              href="/admin/customer-booking"
              className="inline-block text-orange-500 font-sans text-sm font-medium hover:underline"
              onClick={() => setIsAgentNotiOpen(false)}
            >
              View Customer Booking →
            </Link>
          </div>
        </div>
      )}

      {/* User Notifications - แผงเต็มจอบน mobile (เหมือน hamburger) */}
      {isUserNotiOpen && !isAgent && (
        <div
          className="fixed inset-0 w-full bg-white shadow-lg z-40 lg:hidden overflow-y-auto"
          style={{
            paddingTop: `${navbarHeight || 65}px`,
          }}
        >
          <div className="divide-y divide-gray-100 min-h-full">
            {userNotifications.length === 0 ? (
              <p className="p-6 text-gray-500 font-sans text-sm">No notifications yet.</p>
            ) : (
              userNotifications.map((noti) => (
                <div
                  key={noti.id}
                  className="flex gap-4 p-4 hover:bg-gray-50 transition-colors active:bg-gray-100"
                >
                  <img
                    src={noti.imageUrl}
                    alt=""
                    className="w-14 h-14 rounded-full object-cover shrink-0 border border-gray-200"
                  />
                  <p className="text-gray-700 font-sans text-sm leading-snug flex-1 min-w-0 pt-0.5">
                    {noti.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Dropdown Menu - แสดงเมื่อเปิด menu บน mobile */}
      {isMenuOpen && (
        <div
          className="fixed left-0 right-0 w-full bg-white shadow-lg z-40 lg:hidden overflow-y-auto"
          style={{
            top: `${navbarHeight}px`,
            height: `calc(100vh - ${navbarHeight}px)`
          }}
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
                    <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-semibold">
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
                    >
                      <img src={getImageSrc(promotionIcon)} alt="Special offers" className="w-5 h-5 brightness-0 opacity-60" />
                      Special Offers
                    </Link>
                  </>
                )}
                {isAgent && (
                  <>
                    <Link
                      href="/admin/customer-booking"
                      className="flex items-center pl-3 gap-5 text-gray-600 font-sans text-base hover:text-[#4A6D6C] transition-colors"
                      onClick={toggleMenu}
                    >
                      <img src={adminIcon?.src || adminIcon || ''} alt="Admin panel" className="w-5 h-5 brightness-0 opacity-60" />
                      Admin Panel
                    </Link>

                    <Link
                      href="/admin/promotion"
                      className="flex items-center pl-3 gap-5 text-gray-600 font-sans text-base hover:text-[#4A6D6C] transition-colors"
                      onClick={toggleMenu}
                    >
                      <img src={adminIcon?.src || adminIcon || ''} alt="Promotions" className="w-5 h-5 brightness-0 opacity-60" />
                      Promotions
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