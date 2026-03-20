import { useState } from "react"
import ChatbotLOGO from "@/assets/icons/chatbot_inside_logo.svg"
import ChatbotWindow from "./ChatbotWindow"

export default function ChatbotButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {isOpen && <ChatbotWindow onClose={() => setIsOpen(false)} />}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="z-[1200] w-[52px] lg:w-[64px] lg:h-[64px] h-[52px] flex justify-center bg-green-100 items-center fixed bottom-6 right-6 rounded-full cursor-pointer hover:brightness-95 transition-all shadow-[4px_4px_16px_0px_#00000014]"
      >
        {isOpen?<span className="text-[32px] text-green-700 font-normal">✕</span> : <ChatbotLOGO className="w-[36px] lg:w-[48px] h-[36px] lg:h-[48px]" alt="" aria-hidden />}
      </div>
    </>
  )
}