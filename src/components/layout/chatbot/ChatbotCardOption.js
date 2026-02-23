export default function ChatbotCardOption({ option, onSelect }) {
  if (!option?.option_text) return null
  return (
    <button
      type="button"
      onClick={() => onSelect?.(option)}
      className="w-full flex items-center justify-between text-green-700 bg-green-200 gap-2 rounded-[4px] px-4 py-2.5 hover:bg-green-300 body-1 text-left transition-colors cursor-pointer border border-transparent hover:border-green-200"
    >
      <span className="flex-1 min-w-0 ">{option.option_text}</span>
      <span className="shrink-0" aria-hidden>&gt;</span>
    </button>
  )
}
