import ChatbotLogo from "@/assets/icons/chatbot_inside_logo.svg"
import CirLogo from "@/assets/icons/circlelogo-chatbot.svg"
import StarLogo from "@/assets/icons/starLogo-chatbot.svg"
import SendLogo from "@/assets/icons/send.svg"

export default function ChatbotWindow({ onClose }) {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose}>
      </div>
      {/* Chat window */}
      <div className="fixed bottom-0 left-0 right-0 h-[calc(831/871*100%)] rounded-t-[8px] lg:bottom-24 lg:right-10 lg:left-auto lg:w-[454px] lg:h-[625px] lg:rounded-xl bg-white flex flex-col z-50">
        {/* head */}
        <section className="flex items-center pl-4 h-[60px] justify-between">
          <div className="flex items-center gap-2">
            <div className="w-[40px] h-[40px] bg-green-100 rounded-full flex justify-center items-center">
              <ChatbotLogo className="w-[32px] h-[32px]" />
            </div>
            <span className="headline-5 text-gray-900">Neatly Assistant</span>
          </div>
          <div className="w-[60px] h-[60px] flex justify-center items-center">
            <button onClick={onClose} className="text-gray-700 hover:text-gray-900 cursor-pointer font-medium text-2xl flex justify-center items-center">✕</button>
          </div>
        </section>
        {/* content */}
        <section className="relative flex-1 overflow-y-auto pt-6 px-4 bg-bg">
          <CirLogo className="absolute top-[12%] right-0"/>
          <StarLogo className="absolute left-0 lg:hidden"/>
          <StarLogo className="absolute right-5 bottom-[15%] lg:hidden"/>
          <StarLogo className="absolute left-4 bottom-[15%] scale-200"/>
        </section>
        {/* write message */}
        <section className="flex items-center p-4 gap-2 shadow-[0px_-8px_12px_6px_#0000000D] relative z-10">
          <input className="flex-1 rounded-4xl px-3 body-1 h-[33px] border border-white outline-none focus:border-gray-500" placeholder="Write your message" />
          <SendLogo className="text-orange-500 cursor-pointer"/>
        </section>
      </div>
    </>
  )
}