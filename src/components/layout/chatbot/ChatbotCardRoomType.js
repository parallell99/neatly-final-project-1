function formatPrice(value) {
  const num = typeof value === "string" ? parseFloat(value) : value
  if (Number.isNaN(num)) return value
  return `THB ${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function ChatbotCardRoomType({ room, buttonName = "View Details", onViewDetails }) {
  if (!room) return null
  const { image_main, title, price_per_night, description } = room
  const shortDescription = description?.length > 60 ? `${description.slice(0, 60)}...` : description

  return (
    <article className="w-[280px] shrink-0 rounded-[8px] overflow-hidden bg-white shadow-sm border border-gray-100 flex flex-col">
      {image_main && (
        <div className="w-full h-[155px] bg-gray-100 overflow-hidden">
          <img
            src={image_main}
            alt={title ?? "Room"}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-3 flex flex-col gap-1 flex-1 min-w-0">
        {title && (
          <h3 className="!font-semibold text-gray-900 body-1 truncate">{title}</h3>
        )}
        {price_per_night != null && (
          <p className="text-orange-500 !font-semibold body-1">
            {formatPrice(price_per_night)}
          </p>
        )}
        {shortDescription && (
          <p className="text-gray-500 body-2 line-clamp-2">{shortDescription}</p>
        )}
      </div>
      <button
          type="button"
          onClick={() => onViewDetails?.(room)}
          className="mt-auto flex items-center justify-center gap-1 w-full py-2 bg-orange-100 text-orange-500 body-1 !font-semibold hover:bg-orange-200 cursor-pointer"
        >
          {buttonName}
          <span className="text-orange-500" aria-hidden>→</span>
        </button>
    </article>
  )
}
