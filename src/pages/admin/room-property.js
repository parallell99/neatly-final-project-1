"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import SideBarAdmin from "@/components/layout/SideBarAdmin";
import Button from "@/components/ui/buttons/buttons";

const PER_PAGE = 10;

function formatPrice(value) {
  if (value == null) return "—";
  return Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function RoomProperty() {
  const router = useRouter();
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
      <div className="flex flex-col flex-1 min-h-screen">
        <div className="flex-1 pt-px pb-px pl-0 pr-0">
          {/* Header: title + search + Create Room - same as Customer Booking */}
          <div className="h-[80px] flex items-center justify-between px-[60px] border-b border-gray-300">
            <h1 className="headline-5">Room & Property</h1>
            <div className="flex gap-4">
              <div className="h-[48px] w-[320px]">
                <div className="relative h-full">
                  <svg className="w-6 h-6 absolute translate-y-1/2 text-gray-700 left-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-12 py-2 w-full h-full body-1 text-gray-800 border border-gray-400 focus:border-transparent rounded focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder:text-gray-500"
                    placeholder="Search..."
                  />
                </div>
              </div>
              <Button
                type="button"
                onClick={() => router.push("/admin/create-room")}
                buttonStyle="primary"
                buttonText="+ Create Room"
                className="w-[178px] h-[48px] cursor-pointer items-center gap-2 rounded-[4px] p-2!"
              />
            </div>
          </div>
          <div className="bg-gray-100 h-dvh rounded h-[900px] py-2.5 px-[60px] pt-[48px]">
            {error && <p className="text-red-600 mb-4">{error}</p>}

            {loading ? (
              <div className="py-12 text-center text-gray-500">Loading...</div>
            ) : (
              <>
                <div className="overflow-x-auto border border-gray-200 rounded-[4px]">
                  <table className="w-full border-collapse bg-white">
                    <thead>
                      <tr className="body-2 text-left text-gray-900 font-medium bg-gray-300 border-b border-gray-200">
                        <th className="body-2 px-4 py-3 border-b border-gray-200 bg-gray-300 w-[153px]">Image</th>
                        <th className="body-2 px-4 py-3 border-b border-gray-200 bg-gray-300">Room type</th>
                        <th className="body-2 px-4 py-3 border-b border-gray-200 bg-gray-300">Price</th>
                        <th className="body-2 px-4 py-3 border-b border-gray-200 bg-gray-300">Promotion Price</th>
                        <th className="body-2 px-4 py-3 border-b border-gray-200 bg-gray-300">Adults</th>
                        <th className="body-2 px-4 py-3 border-b border-gray-200 bg-gray-300">Kids</th>
                        <th className="body-2 px-4 py-3 border-b border-gray-200 bg-gray-300">Bed Type</th>
                        <th className="body-2 px-4 py-3 border-b border-gray-200 bg-gray-300">Room Size</th>
                        <th className="body-2 px-4 py-3 border-b border-gray-200 bg-gray-300">Total Room</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr className="body-2">
                          <td colSpan={9} className="body-2 p-8 text-center text-gray-500 border-b border-gray-300">
                            No room types found.
                          </td>
                        </tr>
                      ) : (
                        rows.map((room) => (
                          <tr key={room.id} className="body-2 border-b border-gray-100 hover:bg-gray-50">
                            <td className="body-2 px-4 py-3 w-[153px] h-[120px] align-middle border-b border-gray-300">
                              <div className="w-[153px] h-[120px] rounded overflow-hidden bg-gray-100 shrink-0">
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
                            <td className="body-2 px-4 py-3 text-gray-900 font-medium border-b border-gray-200">
                              <Link
                                href={`/admin/edit-room?id=${room.id}`}
                                className="text-gray-900 hover:text-gray-800 hover:underline"
                              >
                                {room.name ?? room.title ?? "—"}
                              </Link>
                            </td>
                            <td className="body-2 px-4 py-3 text-gray-900 border-b border-gray-200">{formatPrice(room.price_per_night)}</td>
                            <td className="body-2 px-4 py-3 text-gray-900 border-b border-gray-200">
                              {room.promotion_price != null ? formatPrice(room.promotion_price) : "-"}
                            </td>
                            <td className="body-2 px-4 py-3 text-gray-900 border-b border-gray-200">
                              {room.room_guest_adult != null ? String(room.room_guest_adult) : "2"}
                            </td>
                            <td className="body-2 px-4 py-3 text-gray-900 border-b border-gray-200">
                              {room.room_guest_kid != null ? String(room.room_guest_kid) : "0"}
                            </td>
                            <td className="body-2 px-4 py-3 text-gray-900 border-b border-gray-200">{room.bed_type?.name ?? "—"}</td>
                            <td className="body-2 px-4 py-3 text-gray-900 border-b border-gray-200">
                              {room.room_size != null ? `${room.room_size} sqm` : "—"}
                            </td>
                            <td className="body-2 px-4 py-3 text-gray-900 border-b border-gray-200">
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
