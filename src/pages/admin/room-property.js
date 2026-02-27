"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import SideBarAdmin from "@/components/layout/SideBarAdmin";

const PER_PAGE = 10;

function formatPrice(value) {
  if (value == null) return "—";
  return Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function RoomProperty() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/rooms/rooms-all")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load room types");
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setList(Array.isArray(json?.data) ? json.data : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter(
      (r) =>
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.title && r.title.toLowerCase().includes(q)) ||
        (r.bed_type?.name && r.bed_type.name.toLowerCase().includes(q))
    );
  }, [list, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * PER_PAGE;
  const rows = useMemo(() => filtered.slice(start, start + PER_PAGE), [filtered, start]);

  return (
    <div className="flex">
      <SideBarAdmin />
      <div className="flex flex-col flex-1 bg-gray-100 min-h-screen">
        <div className="flex-1 pt-px pb-px pl-0 pr-0">
          <div className="bg-white rounded border border-gray-300 min-h-[600px] py-2.5 px-5">
            {/* Header: title + avatar + search + Create Room */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 py-[25px] px-[7px]">
              <h1 className="font-serif text-2xl font-semibold text-gray-900">Room & Property</h1>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative w-full sm:w-64">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="w-full h-12 pl-10 pr-4 py-2 border border-gray-300 rounded bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <Link
                  href="/admin/create-room"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded bg-orange-600 text-white font-medium hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 w-[178px] h-12"
                >
                  <span className="text-lg leading-none">+</span>
                  Create Room
                </Link>
              </div>
            </div>

            {error && <p className="text-red-600 mb-4">{error}</p>}

            {loading ? (
              <div className="py-12 text-center text-gray-500">Loading...</div>
            ) : (
              <>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full border-collapse bg-white">
                    <thead>
                      <tr className="text-left text-gray-700 font-medium bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 border-b border-gray-200 w-[100px]">Image</th>
                        <th className="px-4 py-3 border-b border-gray-200">Room type</th>
                        <th className="px-4 py-3 border-b border-gray-200">Price</th>
                        <th className="px-4 py-3 border-b border-gray-200">Promotion Price</th>
                        <th className="px-4 py-3 border-b border-gray-200">Adults</th>
                        <th className="px-4 py-3 border-b border-gray-200">Kids</th>
                        <th className="px-4 py-3 border-b border-gray-200">Bed Type</th>
                        <th className="px-4 py-3 border-b border-gray-200">Room Size</th>
                        <th className="px-4 py-3 border-b border-gray-200">Total Room</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-gray-500">
                            No room types found.
                          </td>
                        </tr>
                      ) : (
                        rows.map((room) => (
                          <tr key={room.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="w-16 h-16 rounded overflow-hidden bg-gray-100 shrink-0">
                                {room.image_main ? (
                                  <img
                                    src={room.image_main}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No image</div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-900 font-medium">
                              <Link
                                href={`/admin/edit-room?id=${room.id}`}
                                className="text-orange-600 hover:text-orange-700 hover:underline"
                              >
                                {room.name ?? room.title ?? "—"}
                              </Link>
                            </td>
                            <td className="px-4 py-3 text-gray-700">{formatPrice(room.price_per_night)}</td>
                            <td className="px-4 py-3 text-gray-700">
                              {room.promotion_price != null ? formatPrice(room.promotion_price) : (room.price_per_night != null ? formatPrice(Number(room.price_per_night) - 500) : "—")}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {room.room_guest_adult != null ? String(room.room_guest_adult) : "2"}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {room.room_guest_kid != null ? String(room.room_guest_kid) : "0"}
                            </td>
                            <td className="px-4 py-3 text-gray-700">{room.bed_type?.name ?? "—"}</td>
                            <td className="px-4 py-3 text-gray-700">
                              {room.room_size != null ? `${room.room_size} sqm` : "—"}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {String(room.total_rooms ?? room.totalRooms ?? "0")}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-center gap-1 mt-6">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Previous page"
                  >
                    &lt;
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`min-w-[36px] py-2 px-2 rounded border text-sm font-medium ${
                        p === currentPage
                          ? "bg-green-100 border-green-300 text-green-800"
                          : "border-gray-300 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Next page"
                  >
                    &gt;
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
