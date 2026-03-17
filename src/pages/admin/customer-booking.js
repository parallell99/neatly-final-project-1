"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import SideBarAdmin from "@/components/layout/SideBarAdmin";

const PER_PAGE = 10;

function formatTableDate(str) {
  if (!str) return "—";
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return str;
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export default function CustomerBooking() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/admin/orders-list")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load bookings");
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setOrders(Array.isArray(json?.data) ? json.data : []);
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
    if (!search.trim()) return orders;
    const q = search.trim().toLowerCase();
    return orders.filter(
      (o) =>
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.roomType && o.roomType.toLowerCase().includes(q)) ||
        (o.bedType && o.bedType.toLowerCase().includes(q))
    );
  }, [orders, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * PER_PAGE;
  const rows = useMemo(() => filtered.slice(start, start + PER_PAGE), [filtered, start]);

  return (
    <div className="flex">
      <SideBarAdmin />
      <div className="flex flex-col flex-1 min-h-screen">
        <div className="flex-1 pt-px pb-px pl-0 pr-0">
          {/* Header: title + search - separate box */}
          <div className="h-[80px] flex items-center justify-between px-[60px] border-b border-gray-300">
            <h1 className="headline-5 text-gray-900">Customer Booking</h1>
            <div className="h-[48px] w-[320px]">
              <div className="relative h-full">
                <svg className="w-6 h-6 absolute translate-y-1/2 text-gray-700 left-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden>
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
          </div>
          <div className="bg-gray-100  rounded h-dvh py-2.5 px-[60px] pt-[48px] ">


            {error && (
              <p className="text-red-600 mb-4">{error}</p>
            )}

            {loading ? (
              <div className="py-12 text-center text-gray-500 ">Loading...</div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-[4px] border border-gray-300 bg-white">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-gray-800 font-medium bg-gray-300 h-[45px]">
                        <th className="body-2 px-4 py-[10px] bg-gray-300 w-[150px]">Customer name</th>
                        <th className="body-2 px-3 py-[10px] bg-gray-300 w-[85px]">Guest(s)</th>
                        <th className="body-2 px-3 py-[10px] bg-gray-300 w-[180px]">Room type</th>
                        <th className="body-2 px-3 py-[10px] bg-gray-300 w-[100px]">Amount</th>
                        <th className="body-2 px-3 py-[10px] bg-gray-300 w-[180px]">Bed Type</th>
                        <th className="body-2 px-3 py-[10px] bg-gray-300 w-[180px]">Check-in</th>
                        <th className="body-2 px-3 py-[10px] bg-gray-300 w-[180px]">Check-out</th>
                      </tr>
                    </thead>

                    <tbody>
                      {rows.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-gray-500">
                            No bookings found.
                          </td>
                        </tr>
                      ) : (
                        rows.map((row) => (
                          <tr key={row.id} className="border-b border-gray-300 hover:bg-gray-50">
                            <td className="body-2 px-4 py-2 text-gray-900 h-[72px]">
                              <Link href={`/admin/customer-booking-detail?id=${row.id}`} className="body-2 text-green-700 hover:underline">
                                {row.customerName}
                              </Link>
                            </td>
                            <td className="body-2 px-3 py-4 text-gray-900">{row.guests}</td>
                            <td className="body-2 px-3 py-4 text-gray-900">{row.roomType}</td>
                            <td className="body-2 px-3 py-4 text-gray-900">{row.amount}</td>
                            <td className="body-2 px-3 py-4 text-gray-900">{row.bedType}</td>
                            <td className="body-2 px-3 py-4 text-gray-900">{formatTableDate(row.checkIn)}</td>
                            <td className="body-2 px-3 py-4 text-gray-900">{formatTableDate(row.checkOut)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded cursor-pointer border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Previous page"
                    >
                      &lt;
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPage(p)}
                        className={`min-w-[36px] py-2 px-2 cursor-pointer rounded border text-sm font-medium ${
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
                      className="p-2 cursor-pointer rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Next page"
                    >
                      &gt;
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
