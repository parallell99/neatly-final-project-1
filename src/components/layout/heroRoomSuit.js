import Link from "next/link";

// รูปจาก src/assets/images/ (ชื่อไฟล์: superior-garden-view.jpg, deluxe.jpg, superior.jpg, premier-sea-view.jpg, supreme.jpg, suite.jpg)
import superiorGardenViewImg from "@/assets/images/6.jpg";
import deluxeImg from "@/assets/images/5.jpg";
import superiorImg from "@/assets/images/4.jpg";
import premierSeaViewImg from "@/assets/images/3.jpg";
import supremeImg from "@/assets/images/2.jpg";
import suiteImg from "@/assets/images/1.jpg";

const rooms = [
  {
    name: "Superior Garden View",
    slug: "superior-garden-view",
    image: superiorGardenViewImg?.src ?? superiorGardenViewImg,
  },
  {
    name: "Deluxe",
    slug: "deluxe",
    image: deluxeImg?.src ?? deluxeImg,
  },
  {
    name: "Superior",
    slug: "superior",
    image: superiorImg?.src ?? superiorImg,
  },
  {
    name: "Premier Sea View",
    slug: "premier-sea-view",
    image: premierSeaViewImg?.src ?? premierSeaViewImg,
  },
  {
    name: "Supreme",
    slug: "supreme",
    image: supremeImg?.src ?? supremeImg,
  },
  {
    name: "Suite",
    slug: "suite",
    image: suiteImg?.src ?? suiteImg,
  },
];

function RoomCard({ room, className = "", fill = false }) {
  return (
    <article
      className={`relative overflow-hidden group ${fill ? "h-full w-full min-h-0" : "w-full min-h-[280px] md:min-h-[360px]"} ${className}`}
    >
      <div className="absolute inset-0">
        <img
          src={room.image}
          alt={room.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div
          className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent"
          aria-hidden
        />
      </div>
      <div className={`relative z-10 flex flex-col justify-end p-6 md:p-8 lg:p-10 ${fill ? "h-full min-h-0" : "h-full min-h-[280px] md:min-h-[360px]"}`}>
        <h3 className="font-serif text-white text-2xl md:text-3xl mb-2">
          {room.name}
        </h3>
        <Link
          href={`/rooms/${room.slug}`}
          className="font-sans text-white text-sm md:text-base inline-flex items-center gap-2 hover:underline focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent rounded"
        >
          Explore Room
          <span aria-hidden>→</span>
        </Link>
      </div>
    </article>
  );
}

export default function HeroRoomSuit() {
  return (
    <section id="rooms" className="w-full bg-white mb-10 lg:mb-30">
      {/* Header */}
      <div className="max-w-[1440px] mx-auto py-12 lg:py-16 px-4 text-center">
        <h2 className="font-serif headline-3 text-green-800">
          Rooms & Suits
        </h2>
      </div>

      {/* Mobile: stacked */}
      <div className="w-full flex flex-col gap-4 lg:hidden max-w-[1440px] mx-auto px-4">
        {rooms.map((room) => (
          <RoomCard key={room.slug} room={room} />
        ))}
      </div>

      {/* Desktop: grid - แถว1 เต็ม, แถว2 คู่กว้าง/แคบ, แถว3-4 Premier ซ้าย | Supreme+Suite ขวา เต็มกล่อง */}
      <div className="hidden lg:grid lg:grid-cols-3 lg:grid-rows-[540px_400px_338px_338px] lg:max-w-[1440px] lg:mx-auto lg:gap-4 lg:px-4">
        {/* Row 1: Superior Garden View เต็มความกว้าง */}
        <div className="col-span-3 min-h-0">
          <RoomCard room={rooms[0]} className="h-full min-h-0" fill />
        </div>
        {/* Row 2: Deluxe (กว้าง) | Superior (แคบ) */}
        <div className="col-span-2 min-h-0">
          <RoomCard room={rooms[1]} className="h-full min-h-0" fill />
        </div>
        <div className="col-span-1 min-h-0">
          <RoomCard room={rooms[2]} className="h-full min-h-0" fill />
        </div>
        {/* Row 3-4: Premier Sea View แนวตั้ง (ซ้าย) | Supreme กับ Suite ทางขวา เต็มกล่อง */}
        <div className="col-span-1 row-span-2 min-h-0">
          <RoomCard room={rooms[3]} className="h-full min-h-0" fill />
        </div>
        <div className="col-span-2 min-h-0">
          <RoomCard room={rooms[4]} className="h-full w-full min-h-0" fill />
        </div>
        <div className="col-span-2 min-h-0">
          <RoomCard room={rooms[5]} className="h-full w-full min-h-0" fill />
        </div>
      </div>
    </section>
  );
}
