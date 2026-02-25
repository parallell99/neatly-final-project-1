import ChatbotCardOption from "@/components/layout/chatbot/ChatbotCardOption.js"
import ChatbotCardRoomType from "@/components/layout/chatbot/ChatbotCardRoomType.js"

/** แปลงรูปแบบการ์ดจากแผน (cards) เป็นรูปแบบที่ ChatbotCardRoomType ใช้ (room) */
function cardToRoom(card) {
  if (!card) return null
  return {
    id: card.id ?? card.title,
    image_main: card.image ?? card.imageUrl,
    title: card.title,
    price_per_night: card.price ?? card.originalPrice,
    description: card.description,
    link: card.link,
  }
}

function TypingDots() {
  return (
    <div className="flex justify-start z-50">
      <div className="rounded-[8px] px-4 py-3 bg-white text-gray-600 shadow-sm flex gap-1 items-center">
        <span className="inline-block w-2 h-2 rounded-full bg-gray-700 chatbot-typing-dot" style={{ animationDelay: "0ms" }} />
        <span className="inline-block w-2 h-2 rounded-full bg-gray-700 chatbot-typing-dot" style={{ animationDelay: "150ms" }} />
        <span className="inline-block w-2 h-2 rounded-full bg-gray-700 chatbot-typing-dot" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  )
}

export function ChatbotResponse({ messages = [], isTyping = false, onOptionSelect, onRoomViewDetails }) {
  return (
    <div className="flex flex-col gap-3 pb-4">
      {messages.length === 0 && !isTyping && (
        <p className="text-gray-500">Welcome to Neatly Hotel! 🌟 I'm your virtual assistant. Choose a topic you'd like to know more about. I'm here to help! 😊</p>
      )}
      {messages.map((msg, i) => {
        if (msg.role === "bot" && msg.type === "loading") {
          return <TypingDots key={i} />
        }
        if (msg.role === "bot" && msg.type === "cards") {
          const cards = msg.cards ?? []
          const rooms = cards.map(cardToRoom).filter(Boolean)
          return (
            <div key={i} className="flex flex-col gap-2 z-50">
              <div className="flex justify-start">
                <div className="max-w-[85%] min-w-0 rounded-[8px] px-4 py-3 bg-white text-gray-700 shadow-sm">
                  {msg.text && (
                    <p className="body-1 break-words whitespace-pre-line">{msg.text}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1">
                {rooms.map((room) => (
                  <ChatbotCardRoomType
                    key={room.id}
                    room={room}
                    buttonName={msg.button_name ?? "View Details"}
                    onViewDetails={onRoomViewDetails}
                  />
                ))}
              </div>
            </div>
          )
        }
        if (msg.role === "bot" && msg.type === "option_with_details") {
          return (
            <div key={i} className="flex justify-start z-50">
              <div className="max-w-[70%] min-w-0 rounded-[8px] px-4 py-3 bg-white text-gray-700 shadow-sm flex flex-col gap-2">
                {msg.reply_title && (
                  <p className="body-1 break-words whitespace-pre-line">{msg.reply_title}</p>
                )}
                <div className="flex flex-col gap-2">
                  {(msg.options ?? []).map((opt, j) => (
                    <ChatbotCardOption
                      key={j}
                      option={opt}
                      onSelect={(option) => onOptionSelect?.(option?.option_text, option?.details)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )
        }
        if (msg.role === "bot" && msg.type === "room_type") {
          return (
            <div key={i} className="flex flex-col gap-2 z-50">
              <div className="flex justify-start">
                <div className="max-w-[85%] min-w-0 rounded-[8px] px-4 py-3 bg-white text-gray-700 shadow-sm">
                  {msg.reply_title && (
                    <p className="body-1 break-words whitespace-pre-line">{msg.reply_title}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1">
                {(msg.rooms ?? []).map((room) => (
                  <ChatbotCardRoomType
                    key={room.id}
                    room={room}
                    buttonName={msg.button_name ?? "View Details"}
                    onViewDetails={onRoomViewDetails}
                  />
                ))}
              </div>
            </div>
          )
        }
        return (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} z-50`}
          >
            <div
              className={`max-w-[62%] min-w-0 body-1 rounded-[8px] px-4 py-2 z-50 break-words whitespace-pre-line ${
                msg.role === "user"
                  ? "bg-orange-600 text-white"
                  : "bg-white text-gray-700"
              }`}
            >
              {msg.text || msg.message || msg.answer || ""}
            </div>
          </div>
        )
      })}
      {isTyping && <TypingDots />}
    </div>
  )
}