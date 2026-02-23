import { useState, useEffect, useRef } from "react"
import ChatbotLogo from "@/assets/icons/chatbot_inside_logo.svg?url"
import CirLogo from "@/assets/icons/circlelogo-chatbot.svg?url"
import StarLogo from "@/assets/icons/starlogo-chatbot.svg?url"
import SendLogo from "@/assets/icons/send.svg?url"
import { ChatbotResponse } from "@/components/layout/chatbot/ChatbotResponse.js"

// ตัวอย่างคำที่ตั้งไว้ → คำตอบอัตโนมัติ
const AUTO_REPLIES = {
  สวัสดี: "สวัสดีจ้า",
}

export default function ChatbotWindow({ onClose }) {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState("")
  const [topics, setTopics] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const chatScrollRef = useRef(null)

  useEffect(() => {
    const el = chatScrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, isTyping])

  useEffect(() => {
    fetch("/api/chatbot/suggestions")
      .then((res) => res.json())
      .then((json) => {
        const list = json?.data?.topics ?? []
        const sorted = [...list].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        setTopics(sorted)
      })
      .catch(() => setTopics([]))
  }, [])

  function handleSend() {
    const text = inputValue.trim()
    if (!text) return
    setInputValue("")
    setMessages((prev) => [...prev, { role: "user", text }])
    const reply = AUTO_REPLIES[text]
    if (reply) {
      setIsTyping(true)
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: "bot", text: reply }])
        setIsTyping(false)
      }, 1000)
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
      <div className="fixed bottom-0 left-0 right-0 h-[calc(831/871*100%)] rounded-t-[8px] lg:bottom-26 lg:right-6 lg:left-auto lg:w-[calc(454/1440*100%)] lg:h-[calc(625/1000*100%)] lg:max-h-[900px] lg:max-w-[640px] lg:rounded-xl bg-white flex flex-col z-50">
        {/* head */}
        <section className="flex items-center pl-4 h-[60px] justify-between">
          <div className="flex items-center gap-2">
            <div className="w-[40px] h-[40px] bg-green-100 rounded-full flex justify-center items-center">
              <img src={ChatbotLogo} className="w-[32px] h-[32px]" alt="" aria-hidden />
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
          <ChatbotResponse messages={messages} isTyping={isTyping} onOptionSelect={handleOptionSelect} />
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
            className="flex-1 rounded-4xl px-3 body-1 h-[33px] border border-white outline-none focus:border-gray-500"
            placeholder="Write your message"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button type="button" onClick={handleSend} className="shrink-0" aria-label="Send">
            <img src={SendLogo} className="text-orange-500 cursor-pointer w-8 h-8" alt="" />
          </button>
        </section>
      </div>
    </>
  )
}