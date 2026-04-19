import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/router"
import axios from "axios"
import ChatbotLogo from "@/assets/icons/chatbot_inside_logo.svg"
import CirLogo from "@/assets/icons/circlelogo-chatbot.svg?url"
import StarLogo from "@/assets/icons/starlogo-chatbot.svg?url"
import SendLogo from "@/assets/icons/send.svg"
import { ChatbotResponse } from "@/components/layout/chatbot/ChatbotResponse.js"
import { useAuth } from "@/contexts/authentication"

function createSlug(title) {
  if (!title || typeof title !== "string") return ""
  return title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
}

/** สร้าง axios config พร้อม Authorization header */
function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
}

export default function ChatbotWindow({ onClose }) {
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState("")
  const [topics, setTopics] = useState([])
  const [greetingMessage, setGreetingMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [animateIn, setAnimateIn] = useState(false)

  // conversation ที่กำลังเปิดอยู่ (null = ยังไม่ได้สร้าง / ยังไม่ได้ login)
  const [activeConversationId, setActiveConversationId] = useState(null)

  // เก็บ history สำหรับ OpenRouter [{ role, content }]
  const aiHistoryRef = useRef([])

  // ---- animation ----
  useEffect(() => {
    const t = setTimeout(() => setAnimateIn(true), 120)
    return () => clearTimeout(t)
  }, [])

  // ---- auto scroll ----
  const chatScrollRef = useRef(null)
  useEffect(() => {
    const el = chatScrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, isTyping])

  // ---- โหลด suggestions ----
  useEffect(() => {
    axios.get("/api/chatbot/suggestions")
      .then((res) => {
        const data = res.data?.data ?? {}
        const list = data?.topics ?? []
        const sorted = [...list].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        setTopics(sorted)
        const greeting = (data?.greetingMessages ?? []).find((m) => m?.type_text === "greeting_message")
        setGreetingMessage(greeting?.message ?? "")
      })
      .catch(() => {
        setTopics([])
        setGreetingMessage("")
      })
  }, [])

  // ---- โหลดประวัติแชทล่าสุด (เฉพาะ user ที่ login) ----
  useEffect(() => {
    if (!isAuthenticated) return

    async function loadLatestConversation() {
      try {
        const res = await axios.get("/api/chatbot/conversations", authHeaders())
        const conversations = res.data?.data ?? []
        if (conversations.length === 0) return

        // เปิด conversation ล่าสุด
        const latest = conversations[0]
        setActiveConversationId(latest.id)

        const msgRes = await axios.get(
          `/api/chatbot/conversations/${latest.id}/messages`,
          authHeaders()
        )
        const loadedMessages = msgRes.data?.data ?? []
        setMessages(loadedMessages)

        // rebuild aiHistory จาก messages ที่โหลดมา
        aiHistoryRef.current = loadedMessages
          .filter((m) => m.role === "user" || m.role === "bot")
          .map((m) => ({
            role: m.role === "bot" ? "assistant" : "user",
            content: m.text ?? "",
          }))
      } catch {
        // ถ้าโหลดไม่ได้ก็ข้ามไป ไม่ต้อง block การใช้งาน
      }
    }

    loadLatestConversation()
  }, [isAuthenticated])

  // ---- สร้าง conversation ใหม่ (ลบอันเก่าทิ้งก่อน) ----
  async function handleNewConversation() {
    if (!isAuthenticated) {
      setMessages([])
      aiHistoryRef.current = []
      return
    }

    try {
      // ลบ conversation เก่าก่อน (ถ้ามี)
      if (activeConversationId) {
        await axios.delete(`/api/chatbot/conversations/${activeConversationId}`, authHeaders())
      }
      // สร้าง conversation ใหม่
      const res = await axios.post("/api/chatbot/conversations", {}, authHeaders())
      const conversation = res.data?.data
      setActiveConversationId(conversation.id)
      setMessages([])
      aiHistoryRef.current = []
    } catch {
      setMessages([])
      aiHistoryRef.current = []
    }
  }

  // ---- helper: บันทึก user+bot คู่ลง DB (silent fail) ----
  async function saveToDb(userText, botResponse) {
    if (!isAuthenticated) return
    let conversationId = activeConversationId
    if (!conversationId) {
      try {
        const res = await axios.post("/api/chatbot/conversations", {}, authHeaders())
        conversationId = res.data?.data?.id
        setActiveConversationId(conversationId)
      } catch {
        return
      }
    }
    axios.post(
      `/api/chatbot/conversations/${conversationId}/messages`,
      { userText, botResponse: { role: "bot", ...botResponse } },
      authHeaders()
    ).catch(() => {})
  }

  // ---- ส่งข้อความ ----
  async function handleSend() {
    const text = inputValue.trim()
    if (!text || isTyping) return
    setInputValue("")
    setMessages((prev) => [...prev, { role: "user", text }])
    setIsTyping(true)

    // ถ้า login แต่ยังไม่มี conversation → สร้างใหม่ก่อน
    let conversationId = activeConversationId
    if (isAuthenticated && !conversationId) {
      try {
        const res = await axios.post("/api/chatbot/conversations", {}, authHeaders())
        conversationId = res.data?.data?.id
        setActiveConversationId(conversationId)
      } catch {
        // ไม่สามารถสร้างได้ก็ส่งข้อความต่อโดยไม่บันทึก
      }
    }

    try {
      const res = await axios.post("/api/chatbot/ai", {
        message: text,
        history: aiHistoryRef.current,
      })
      const data = res.data

      // อัปเดต aiHistory
      const assistantContent = data.text ?? data.reply_title ?? ""
      aiHistoryRef.current = [
        ...aiHistoryRef.current,
        { role: "user", content: text },
        { role: "assistant", content: assistantContent },
      ]

      setMessages((prev) => [...prev, { role: "bot", ...data }])

      // บันทึกลง DB (เฉพาะ login และมี conversationId)
      if (isAuthenticated && conversationId) {
        axios.post(
          `/api/chatbot/conversations/${conversationId}/messages`,
          { userText: text, botResponse: { role: "bot", ...data } },
          authHeaders()
        ).catch(() => {}) // silent fail — ไม่ให้ error นี้รบกวน UX
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", type: "message", text: "ขออภัย AI Chatbot ใช้งานไม่ได้ในขณะนี้ กรุณากดใช้เมนูด้านล่างแทนค่ะ" },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  function handleTopicClick(item) {
    setMessages((prev) => [...prev, { role: "user", text: item.topic }])
    if (item.reply_format === "Message" && item.reply_message) {
      setIsTyping(true)
      setTimeout(() => {
        const botMsg = { text: item.reply_message }
        setMessages((prev) => [...prev, { role: "bot", ...botMsg }])
        setIsTyping(false)
        saveToDb(item.topic, botMsg)
      }, 1000)
    }
    if (item.reply_format === "Option with details" && item.reply_title && Array.isArray(item.options)) {
      setIsTyping(true)
      setTimeout(() => {
        const botMsg = {
          type: "option_with_details",
          reply_title: item.reply_title,
          options: item.options,
        }
        setMessages((prev) => [...prev, { role: "bot", ...botMsg }])
        setIsTyping(false)
        saveToDb(item.topic, botMsg)
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
          const botMsg = {
            type: "room_type",
            reply_title: item.reply_title,
            button_name: item.button_name ?? "View Details",
            rooms,
          }
          setMessages((prev) => [...prev, { role: "bot", ...botMsg }])
          saveToDb(item.topic, botMsg)
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
    const botMsg = { text: details ?? "" }
    setMessages((prev) => [
      ...prev,
      { role: "user", text: optionText },
      { role: "bot", ...botMsg },
    ])
    saveToDb(optionText, botMsg)
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-[60] lg:hidden" onClick={onClose} />
      {/* Chat window */}
      <div
        className={[
          "fixed bottom-0 left-0 right-0 h-[calc(831/871*100%)] rounded-t-[8px] lg:bottom-26 lg:right-6 lg:left-auto lg:w-[calc(454/1440*100%)] lg:h-[calc(625/1000*100%)] lg:max-h-[850px] lg:max-w-[600px] lg:rounded-xl bg-white flex flex-col z-[70]",
          "transition-all duration-200 ease-out will-change-transform",
          animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        ].join(" ")}
      >
        {/* head */}
        <section className="flex items-center pl-4 h-[60px] justify-between">
          <div className="flex items-center gap-2">
            <div className="w-[40px] h-[40px] bg-green-100 rounded-full flex justify-center items-center">
              <ChatbotLogo className="w-[32px] h-[32px]" alt="" aria-hidden />
            </div>
            <span className="lg:text-[20px]! headline-5 text-[16px]! text-gray-900">Neatly Assistant</span>
          </div>
          <div className="flex items-center gap-1 pr-2">
            {/* ปุ่ม New Conversation */}
            <button
              onClick={handleNewConversation}
              title="New Conversation"
              className="text-gray-500 hover:text-orange-500 cursor-pointer text-sm px-2 py-1 rounded-lg hover:bg-orange-50 transition-colors"
            >
              + New Chat
            </button>
            <div className="w-[48px] h-[60px] flex justify-center items-center">
              <button onClick={onClose} className="text-gray-700 hover:text-gray-900 cursor-pointer font-medium text-2xl flex justify-center items-center">✕</button>
            </div>
          </div>
        </section>
        {/* content */}
        <section ref={chatScrollRef} className="relative flex-1 overflow-y-auto pt-6 px-4 bg-bg">
          <img src={CirLogo} className="absolute top-[12%] right-0 w-auto h-auto" alt="" aria-hidden />
          <img src={StarLogo} className="absolute left-0 lg:hidden w-auto h-auto" alt="" aria-hidden />
          <img src={StarLogo} className="absolute right-5 bottom-[15%] lg:hidden w-auto h-auto" alt="" aria-hidden />
          <img src={StarLogo} className="absolute left-4 bottom-[15%] scale-200 w-auto h-auto" alt="" aria-hidden />
          <ChatbotResponse
            messages={messages}
            isTyping={isTyping}
            onOptionSelect={handleOptionSelect}
            onRoomViewDetails={(room) => {
              const slug = createSlug(room.title ?? room.room_type?.name ?? "")
              if (slug) router.push(`/rooms/${slug}`)
            }}
            greetingMessage={greetingMessage}
          />
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
