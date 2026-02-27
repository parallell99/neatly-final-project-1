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
      <div className="flex flex-col flex-1 bg-gray-100 min-h-screen">
        <div className="flex-1 pt-px pb-px pl-0 pr-0">
          <div className="bg-white rounded border border-gray-300 h-[900px] py-2.5 px-5">
            {/* Header: title + search */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 py-[25px] px-[7px]">
              <h1 className="font-serif text-2xl font-semibold text-gray-900">Customer Booking</h1>
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-600 mb-4">{error}</p>
            )}

            {loading ? (
              <div className="py-12 text-center text-gray-500">Loading...</div>
            ) : (
              <>
                <div className="overflow-x-auto border border-gray-200 rounded">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="text-left text-gray-700 font-medium">
                        <th className="px-3 py-4 border-b border-gray-200 bg-white w-[180px]">Customer name</th>
                        <th className="px-3 py-4 border-b border-gray-200 bg-white w-[180px]">Guest(s)</th>
                        <th className="px-3 py-4 border-b border-gray-200 bg-white w-[180px]">Room type</th>
                        <th className="px-3 py-4 border-b border-gray-200 bg-white w-[180px]">Amount</th>
                        <th className="px-3 py-4 border-b border-gray-200 bg-white w-[180px]">Bed Type</th>
                        <th className="px-3 py-4 border-b border-gray-200 bg-white w-[180px]">Check-in</th>
                        <th className="px-3 py-4 border-b border-gray-200 bg-white w-[180px]">Check-out</th>
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
                          <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-3 py-4 text-gray-900">
                              <Link href={`/admin/customer-booking-detail?id=${row.id}`} className="text-green-700 hover:underline font-medium">
                                {row.customerName}
                              </Link>
                            </td>
                            <td className="px-3 py-4 text-gray-700">{row.guests}</td>
                            <td className="px-3 py-4 text-gray-700">{row.roomType}</td>
                            <td className="px-3 py-4 text-gray-700">{row.amount}</td>
                            <td className="px-3 py-4 text-gray-700">{row.bedType}</td>
                            <td className="px-3 py-4 text-gray-700">{formatTableDate(row.checkIn)}</td>
                            <td className="px-3 py-4 text-gray-700">{formatTableDate(row.checkOut)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1 mt-6">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
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
                            ? "bg-gray-200 border-gray-300 text-gray-900"
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
                      className="p-2 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
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
