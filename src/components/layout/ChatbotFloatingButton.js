"use client";

import ChatbotIcon from "@/assets/icons/chatbot_inside_logo.svg?url";

export default function ChatbotFloatingButton({ onClick }) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      console.log("Chatbot clicked");
    }
  };

  return (
    <button
      className="fixed right-4 lg:right-8 bottom-4 lg:bottom-18 z-50 w-12 h-12 lg:w-16 lg:h-16 bg-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 flex items-center justify-center"
      aria-label="Open chatbot"
      onClick={handleClick}
    >
      <img 
        src={ChatbotIcon} 
        alt="Chatbot" 
        className="w-8 h-8 lg:w-12 lg:h-12"
      />
    </button>
  );
}
