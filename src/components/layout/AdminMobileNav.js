"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/authentication";
import LogoNav from "@/assets/logo/logo-nav-dashboard.svg";

/**
 * Mobile-only nav bar + dropdown (Profile, Homepage, Logout).
 * แสดงเฉพาะ lg:hidden เหมือน navbar หน้า homepage
 */
export default function AdminMobileNav() {
  const { logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  return (
    <>
      <nav
        className="flex flex-row lg:hidden justify-between items-center bg-green-800 py-[11.5px] px-[16px]"
        aria-label="Admin mobile navigation"
      >
        <div className="flex flex-row items-end gap-[3px]">
          <LogoNav className="h-fit w-fit" aria-hidden />
          <span className="body-3 text-green-400">Admin Panel Control</span>
        </div>
        <button
          type="button"
          onClick={toggleMenu}
          className="flex flex-col gap-1.5 p-2 relative z-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 rounded hover:cursor-pointer"
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
        >
          <span
            className={`w-6 h-0.5 bg-green-400 transition-all ${isMenuOpen ? "rotate-45 translate-y-2" : ""}`}
            aria-hidden
          />
          <span
            className={`w-6 h-0.5 bg-green-400 transition-all ${isMenuOpen ? "opacity-0" : ""}`}
            aria-hidden
          />
          <span
            className={`w-6 h-0.5 bg-green-400 transition-all ${isMenuOpen ? "-rotate-45 -translate-y-2" : ""}`}
            aria-hidden
          />
        </button>
      </nav>

      {isMenuOpen && (
        <div
          className="fixed left-0 right-0 top-16 w-full h-[calc(100vh-3rem)] bg-white shadow-lg z-40 lg:hidden overflow-y-auto"
          role="dialog"
          aria-label="Menu"
        >
          <div className="flex flex-col px-8 gap-6 py-4">
            <Link
              href="/userProfile"
              className="text-gray-600 font-sans text-base hover:text-green-700 transition-colors"
              onClick={toggleMenu}
            >
              Profile
            </Link>
            <Link
              href="/"
              className="text-gray-600 font-sans text-base hover:text-green-700 transition-colors"
              onClick={toggleMenu}
            >
              Homepage
            </Link>
            <div className="border-t border-gray-300" />
            <button
              type="button"
              onClick={() => {
                logout();
                toggleMenu();
              }}
              className="text-left text-gray-600 font-sans text-base hover:text-green-700 transition-colors hover:cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </>
  );
}
