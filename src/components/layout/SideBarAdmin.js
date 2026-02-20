import { useState } from "react"
import Logo from "@/assets/logo/logo-foot.svg?url"
import CustomerBookingLogo from "@/assets/icons/cs_booking.svg?url"
import RoomManagementLogo from "@/assets/icons/manage.svg?url"
import HotelInformationLogo from "@/assets/icons/hotel.svg?url"
import RoomNPropertyLogo from "@/assets/icons/room.svg?url"
import AnalyticDashboard from "@/assets/icons/analytic.svg?url"
import ChatbotSetupLogo from "@/assets/icons/chat.svg?url"
import LogoutLogo from "@/assets/icons/logout.svg?url"

const menuItems = [
  { id: "customer-booking", label: "Customer Booking", icon: CustomerBookingLogo },
  { id: "room-management", label: "Room Management", icon: RoomManagementLogo },
  { id: "hotel-information", label: "Hotel Infomation", icon: HotelInformationLogo },
  { id: "room-property", label: "Room & Property", icon: RoomNPropertyLogo },
  { id: "analytics", label: "Analytics Dashboard", icon: AnalyticDashboard },
  { id: "chatbot", label: "Chatbot Setup", icon: ChatbotSetupLogo },
]

export default function SideBarAdmin() {
  const [selected, setSelected] = useState(null)

  return (
    <>
      <div className="bg-green-800 h-dvh w-[240px] flex flex-col gap-[40px]">
        <div className="h-[153px] flex flex-col justify-center items-center gap-4">
          <img src={Logo} className="w-[120px]" alt="Neatly logo" />
          <span className="body-1 text-green-400">Admin Panel Control</span>
        </div>
        <div className="flex flex-col">
          {menuItems.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setSelected(id)}
              className={`flex items-center gap-4 body-1 p-6 cursor-pointer w-full hover:bg-green-700 hover:text-green-100 ${selected === id ? "bg-green-600 text-green-100" : ""}`}
            >
              <img src={icon} className="w-6 h-6 shrink-0" alt="" aria-hidden />
              <span className="text-green-300">{label}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-4 border-t border-green-700 p-6 mt-auto mb-[210px]">
          <img src={LogoutLogo} className="w-[24px] h-[24px] shrink-0" alt="" aria-hidden />
          <span className="text-green-300">Log Out</span>
        </div>
      </div>
    </>
  )
}