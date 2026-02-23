import Image from "next/image";

export default function RoomCard({ room, onClick }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[460px_1fr_280px] gap-10 py-12 px-6 border-b border-gray-200 items-start">

      {/* Image */}
      <div
        className="relative w-full h-[300px] cursor-pointer"
        onClick={onClick}
      >
        <Image
          src={room.images?.[0]}
          alt={room.title}
          fill
          className="object-cover rounded-xl"
        />
      </div>

      {/* Content Text */}
      <div>
        <h3
          className="text-2xl font-semibold mb-4 cursor-pointer"
          onClick={onClick}
        >
          {room.title}
        </h3>

        <div className="flex gap-3 text-sm text-gray-500 mb-4">
          <span>{room.guests}</span>
          <span>|</span>
          <span>{room.bed}</span>
          <span>|</span>
          <span>{room.size}</span>
        </div>

        <p className="text-gray-600 text-sm leading-relaxed">
          {room.description}
        </p>
      </div>

      {/* Price Section */}
      <div className="flex flex-col items-start md:items-end">
        {room.oldPrice && (
          <p className="text-sm line-through text-gray-400 mb-1">
            {room.oldPrice}
          </p>
        )}

        <p className="text-xl font-semibold">
          {room.price}
        </p>

        <p className="text-xs text-gray-500 mb-6 text-left md:text-right leading-tight">
          Per Night<br />
          (Including Taxes & Fees)
        </p>

        <div className="flex items-center gap-6">
          <button className="text-sm text-orange-600 hover:underline">
            Room Detail
          </button>

          <button className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-md text-sm font-medium transition">
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}