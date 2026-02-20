import { useState } from "react"
import Logo from "@/assets/logo/logo-foot.svg?url"
import CustomerBookingLogo from "@/assets/icons/cs_booking.svg"
import RoomManagementLogo from "@/assets/icons/manage.svg"
import HotelInformationLogo from "@/assets/icons/hotel.svg"
import RoomNPropertyLogo from "@/assets/icons/room.svg"
import AnalyticDashboard from "@/assets/icons/analytic.svg"
import ChatbotSetupLogo from "@/assets/icons/chat.svg"
import LogoutLogo from "@/assets/icons/logout.svg"

const menuItems = [
  { id: "customer-booking", label: "Customer Booking", Icon: CustomerBookingLogo },
  { id: "room-management", label: "Room Management", Icon: RoomManagementLogo },
  { id: "hotel-information", label: "Hotel Infomation", Icon: HotelInformationLogo },
  { id: "room-property", label: "Room & Property", Icon: RoomNPropertyLogo },
  { id: "analytics", label: "Analytics Dashboard", Icon: AnalyticDashboard },
  { id: "chatbot", label: "Chatbot Setup", Icon: ChatbotSetupLogo },
]

export default function SideBarAdmin() {
  const [selected, setSelected] = useState(null)

  return (
    <>
      <div className="bg-green-800 h-dvh w-[240px] flex flex-col gap-[40px]">
        <div className="h-[153px] flex flex-col justify-center items-center gap-4">
          <img src={Logo} className="w-[120px]"/>
          <span className="body-1 text-green-400">Admin Panel Control</span>
        </div>
        <div className="flex flex-col">
          {menuItems.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setSelected(id)}
              className={`flex items-center gap-4 body-1 p-6 cursor-pointer w-full hover:bg-green-700 hover:text-green-100 ${selected === id ? "bg-green-600 text-green-100" : ""}`}
            >
              <Icon className="text-green-500" />
              <span className="text-green-300">{label}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-4 border-t border-green-700 p-6 mt-auto mb-[210px]">
          <LogoutLogo className="w-[24px] h-[24px] text-green-500"/>
          <span className="text-green-300">Log Out</span>
        </div>
      </div>
    </>
  )
}