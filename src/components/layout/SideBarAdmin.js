"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import Logo from "@/assets/logo/logo-foot.svg?url"
import CustomerBookingLogo from "@/assets/icons/cs_booking.svg"
import RoomManagementLogo from "@/assets/icons/manage.svg"
import HotelInformationLogo from "@/assets/icons/hotel.svg"
import RoomNPropertyLogo from "@/assets/icons/room.svg"
import AnalyticDashboard from "@/assets/icons/analytic.svg"
import ChatbotSetupLogo from "@/assets/icons/chat.svg"
import LogoutLogo from "@/assets/icons/logout.svg"

const menuItems = [
  { id: "customer-booking", label: "Customer Booking", icon: CustomerBookingLogo, href: "/admin/customer-booking" },
  { id: "room-management", label: "Room Management", icon: RoomManagementLogo, href: "/admin/room-management" },
  { id: "hotel-information", label: "Hotel Infomation", icon: HotelInformationLogo, href: "/admin/hotel-information" },
  { id: "room-property", label: "Room & Property", icon: RoomNPropertyLogo, href: "/admin/room-property" },
  { id: "analytics", label: "Analytics Dashboard", icon: AnalyticDashboard, href: "/admin/analytics" },
  { id: "chatbot", label: "Chatbot Setup", icon: ChatbotSetupLogo, href: "/admin/chatbot" },
]

export default function SideBarAdmin() {
  const router = useRouter()
  const pathname = router?.pathname ?? ""
  const [sidebarLogoUrl, setSidebarLogoUrl] = useState(null)

  useEffect(() => {
    fetch("/api/hotel-information")
      .then((res) => res.json())
      .then((json) => {
        const url = json?.data?.hotelLogoFooterUrl ?? null
        setSidebarLogoUrl(url || null)
      })
      .catch(() => {})
  }, [])

  const logoSrc = sidebarLogoUrl || (typeof Logo === "string" ? Logo : Logo?.src) || Logo

  return (
    <>
      <div className="bg-green-800 h-dvh w-[240px] flex flex-col gap-[40px]">
        <div className="h-[153px] flex flex-col justify-center items-center gap-4">
          <Link href="/" className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 rounded">
            <img src={logoSrc} className="w-[120px] h-auto object-contain" alt="Neatly logo" />
          </Link>
          <span className="body-1 text-green-400">Admin Panel Control</span>
        </div>
        <div className="flex flex-col">
          {menuItems.map(({ id, label, icon, href }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/") || pathname.startsWith(href + "-")
            return (
              <Link
                key={id}
                href={href}
                className={`flex items-center gap-4 body-1 p-6 cursor-pointer w-full text-green-300 hover:bg-green-700 hover:text-green-100 active:bg-green-600 active:text-green-100 ${isActive ? "bg-green-600 text-green-100" : ""}`}
              >
                {React.createElement(icon, { className: "w-6 h-6 shrink-0 text-green-500", "aria-hidden": true })}
                <span className="text-inherit">{label}</span>
              </Link>
            )
          })}
        </div>
        <div className="flex gap-4 border-t border-green-700 p-6 mt-auto mb-[210px] text-green-300 hover:bg-green-700 hover:text-green-100 active:bg-green-600 active:text-green-100 cursor-pointer">
          <LogoutLogo className="w-6 h-6 shrink-0 text-green-500" aria-hidden />
          <span>Log Out</span>
        </div>
      </div>
    </>
  )
}