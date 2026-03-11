import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/router"
import axios from "axios"
import ChatbotLogo from "@/assets/icons/chatbot_inside_logo.svg"
import CirLogo from "@/assets/icons/circlelogo-chatbot.svg?url"
import StarLogo from "@/assets/icons/starlogo-chatbot.svg?url"
import SendLogo from "@/assets/icons/send.svg"
import { ChatbotResponse } from "@/components/layout/chatbot/ChatbotResponse.js"

function createSlug(title) {
  if (!title || typeof title !== "string") return ""
  return title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
}

export default function ChatbotWindow({ onClose }) {
  const router = useRouter()
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState("")
  const [topics, setTopics] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const chatScrollRef = useRef(null)
  // เก็บ history ในรูปแบบที่ OpenRouter ต้องการ [{ role, content }]
  const aiHistoryRef = useRef([])

  useEffect(() => {
    const el = chatScrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, isTyping])

  useEffect(() => {
    axios.get("/api/chatbot/suggestions")
      .then((res) => {
        const list = res.data?.data?.topics ?? []
        const sorted = [...list].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        setTopics(sorted)
      })
      .catch(() => setTopics([]))
  }, [])

  async function handleSend() {
    const text = inputValue.trim()
    if (!text || isTyping) return
    setInputValue("")
    setMessages((prev) => [...prev, { role: "user", text }])
    setIsTyping(true)

    try {
      const res = await axios.post("/api/chatbot/ai", {
        message: text,
        history: aiHistoryRef.current,
      })
      const data = res.data

      // อัปเดต history สำหรับรอบถัดไป — ส่งแค่ text ธรรมดา ไม่ใช่ JSON string
      const assistantContent = data.text ?? data.reply_title ?? ""
      aiHistoryRef.current = [
        ...aiHistoryRef.current,
        { role: "user", content: text },
        { role: "assistant", content: assistantContent },
      ]

      setMessages((prev) => [...prev, { role: "bot", ...data }])
    } catch {
      setMessages((prev) => [...prev, { role: "bot", type: "message", text: "ขออภัย AI Chatbot ใช้งานไม่ได้ในขณะนี้ กรุณากดใช้เมนูด้านล่างแทนค่ะ" }])
    } finally {
      setIsTyping(false)
    }
  }

  function handleTopicClick(item) {
    setMessages((prev) => [...prev, { role: "user", text: item.topic }])
    if (item.reply_format === "Message" && item.reply_message) {
      setIsTyping(true)
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: "bot", text: item.reply_message }])
        setIsTyping(false)
      }, 1000)
    }
    if (item.reply_format === "Option with details" && item.reply_title && Array.isArray(item.options)) {
      setIsTyping(true)
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            type: "option_with_details",
            reply_title: item.reply_title,
            options: item.options,
          },
        ])
        setIsTyping(false)
      }, 1000)
    }
    if (item.reply_format === "Room type" && item.reply_title) {
      setIsTyping(true)
      axios.get("/api/rooms/availablerooms")
        .then((res) => {
          const allRoomTypes = res.data?.data ?? []
          const roomTypeNames = Array.isArray(item.roomTypes) ? item.roomTypes.map((n) => String(n).trim().toLowerCase()) : []
          const filtered =
            roomTypeNames.length > 0
              ? allRoomTypes.filter((r) => r?.room_type_name && roomTypeNames.includes(String(r.room_type_name).trim().toLowerCase()))
              : allRoomTypes
          const rooms = filtered.map((r) => ({
            id: r.room_type_id,
            title: r.room_type_name,
            description: r.description,
            price_per_night: r.price_per_night,
            image_main: r.image_main,
            room_type: { name: r.room_type_name },
          }))
          setMessages((prev) => [
            ...prev,
            {
              role: "bot",
              type: "room_type",
              reply_title: item.reply_title,
              button_name: item.button_name ?? "View Details",
              rooms,
            },
          ])
        })
        .catch(() => {
          setMessages((prev) => [
            ...prev,
            { role: "bot", type: "room_type", reply_title: item.reply_title, button_name: item.button_name ?? "View Details", rooms: [] },
          ])
        })
        .finally(() => setIsTyping(false))
    }
  }

  function handleOptionSelect(optionText, details) {
    if (!optionText) return
    setMessages((prev) => [
      ...prev,
      { role: "user", text: optionText },
      { role: "bot", text: details ?? "" },
    ])
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose}>
      </div>
      {/* Chat window */}
      <div className="fixed bottom-0 left-0 right-0 h-[calc(831/871*100%)] rounded-t-[8px] lg:bottom-26 lg:right-6 lg:left-auto lg:w-[calc(454/1440*100%)] lg:h-[calc(625/1000*100%)] lg:max-h-[850px] lg:max-w-[600px] lg:rounded-xl bg-white flex flex-col z-50">
        {/* head */}
        <section className="flex items-center pl-4 h-[60px] justify-between">
          <div className="flex items-center gap-2">
            <div className="w-[40px] h-[40px] bg-green-100 rounded-full flex justify-center items-center">
              <ChatbotLogo className="w-[32px] h-[32px]" alt="" aria-hidden />
            </div>
            <span className="headline-5 text-gray-900">Neatly Assistant</span>
          </div>
          <div className="w-[60px] h-[60px] flex justify-center items-center">
            <button onClick={onClose} className="text-gray-700 hover:text-gray-900 cursor-pointer font-medium text-2xl flex justify-center items-center">✕</button>
          </div>
        </section>
        {/* content */}
        <section ref={chatScrollRef} className="relative flex-1 overflow-y-auto pt-6 px-4 bg-bg">
          <img src={CirLogo} className="absolute top-[12%] right-0 w-auto h-auto" alt="" aria-hidden />
          <img src={StarLogo} className="absolute left-0 lg:hidden w-auto h-auto" alt="" aria-hidden />
          <img src={StarLogo} className="absolute right-5 bottom-[15%] lg:hidden w-auto h-auto" alt="" aria-hidden />
          <img src={StarLogo} className="absolute left-4 bottom-[15%] scale-200 w-auto h-auto" alt="" aria-hidden />
          <ChatbotResponse messages={messages} isTyping={isTyping} onOptionSelect={handleOptionSelect} onRoomViewDetails={(room) => {
              const slug = createSlug(room.title ?? room.room_type?.name ?? "")
              if (slug) router.push(`/rooms/${slug}`)
            }} />
        </section>
        {/* menu suggestions bar */}
        <section className="flex gap-2 px-4 py-2 overflow-x-auto">
          {topics.map((item) => (
            <button
              key={item.suggestion_topics_id}
              className="whitespace-nowrap px-3 py-1.5 rounded-full border border-orange-500 text-orange-500 body-2 hover:bg-orange-50 cursor-pointer"
              onClick={() => handleTopicClick(item)}
            >
              {item.topic}
            </button>
          ))}
        </section>
        {/* write message */}
        <section className="flex items-center p-4 gap-2 shadow-[0px_-8px_12px_6px_#0000000D] relative z-10">
          <input
            className="flex-1 rounded-xl px-3 body-1 h-[33px] border border-white outline-none focus:border-gray-500"
            placeholder="Write your message"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button type="button" onClick={handleSend} className="shrink-0" aria-label="Send">
            <SendLogo className="text-orange-500 cursor-pointer w-8 h-8 transition-transform active:text-orange-600" alt="" />
          </button>
        </section>
      </div>
    </>
  )
}