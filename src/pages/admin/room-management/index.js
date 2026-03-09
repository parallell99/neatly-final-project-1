"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import SideBarAdmin from "@/components/layout/SideBarAdmin";

function getStatusColor(status) {
  switch (status) {
    case "Vacant":
      return "bg-[#F0F2F8] text-[#006753]";
    case "Occupied":
      return "bg-[#E4ECFF] text-[#084BAF]";
    case "Assign Clean":
      return "bg-[#E6FFFA] text-[#006753]";
    case "Assign Dirty":
      return "bg-[#FFE6E6] text-[#A50606]";
    case "Vacant Clean":
      return "bg-[#E6FFFA] text-[#006753]";
    case "Vacant Clean Pick Up":
      return "bg-[#E6FFFA] text-[#006753]";
    case "Vacant Clean Inspected":
      return "bg-[#FFF9E6] text-[#766A00]";
    case "Occupied Clean":
      return "bg-[#E4ECFF] text-[#084BAF]";
    case "Occupied Clean Inspected":
      return "bg-[#FFF9E6] text-[#766A00]";
    case "Occupied Dirty":
      return "bg-[#FFE6E6] text-[#A50606]";
    case "Out of Order":
      return "bg-[#F0F1F8] text-[#6E7288]";
    case "Out of Service":
      return "bg-[#F0F1F8] text-[#6E7288]";
    case "Out of Inventory":
      return "bg-[#F0F1F8] text-[#6E7288]";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

const PER_PAGE = 10;

export default function RoomManagementPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [statusList, setStatusList] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [updating, setUpdating] = useState(false);
  const [statusSearch, setStatusSearch] = useState("");
  const [search, setSearch] = useState("");

  const filteredRooms = rooms.filter((room) => {
    const q = search.toLowerCase();
    return (
      room.no.toLowerCase().includes(q) ||
      (room.type ?? "").toLowerCase().includes(q) ||
      (room.bed ?? "").toLowerCase().includes(q) ||
      (room.status ?? "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredRooms.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginatedRooms = filteredRooms.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
  const pageNumbers = [...Array(totalPages)].map((_, i) => i + 1);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (totalPages >= 1 && page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  async function fetchRooms() {
    try {
      setLoading(true);
      const { data: json } = await axios.get("/api/admin/room-status");
      const data = Array.isArray(json.data) ? json.data : [];

      const mapped = data.map((item) => ({
        no: String(item.room_number).padStart(4, "0"),
        room_number: item.room_number,
        type: item.room_type,
        bed: item.bed_type,
        status: item.status,
        color: getStatusColor(item.status),
      }));

      setRooms(mapped);
      setPage(1);
      setError(null);
    } catch (err) {
      console.error("[RoomManagementPage] fetch error:", err);
      setError(err.response?.data?.error || err.message || "Failed to load room status");
    } finally {
      setLoading(false);
    }
  }

  async function fetchStatuses() {
    try {
      const { data: json } = await axios.get("/api/admin/room-status", {
        params: { statuses: "1" },
      });
      setStatusList(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      console.error("[RoomManagementPage] fetch statuses error:", err);
    }
  }

  useEffect(() => {
    fetchRooms();
    fetchStatuses();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const close = () => {
      setOpenDropdown(null);
      setStatusSearch("");
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  async function handleStatusChange(roomNumber, statusId) {
    if (updating) return;
    setUpdating(true);
    try {
      await axios.post("/api/admin/room-status", {
        room_number: roomNumber,
        status_id: statusId,
      });
      setOpenDropdown(null);
      await fetchRooms();
    } catch (err) {
      console.error("[RoomManagementPage] update status error:", err);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <>
      <div className="flex">
        <SideBarAdmin />
        <div className="flex flex-col flex-1">
          <div className="h-[80px] flex items-center justify-between px-[60px] border-b border-gray-300">
            <span className="headline-5 ">Room Management</span>
            <div className="flex gap-4">
              <div className="h-[48px] w-[320px]">
                <div className="relative h-full">
                  <svg className="w-6 h-6 absolute translate-y-1/2 text-gray-700 left-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-12 py-2 w-full h-full body-1 text-gray-800 border border-gray-400 focus:border-transparent rounded focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder:text-gray-500"
                    placeholder="Search..."
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push("/admin/create-room")}
                className="w-[178px] h-[48px] cursor-pointer items-center gap-2 rounded-[4px] bg-orange-600 text-white font-medium hover:bg-orange-700"
              >
                + Create Room
              </button>
            </div>
          </div>
          <div className="px-[60px] pt-[48px] bg-gray-100 h-full">
            <div className="overflow-x-auto rounded-[4px] border border-gray-300 bg-white">
              <table className="min-w-full text-left">
                <thead className="bg-gray-300">
                  <tr className="body-2 text-gray-800 h-[41px]">
                    <th className="px-6 py-3 font-medium">Room no.</th>
                    <th className="px-6 py-3 font-medium">Room type</th>
                    <th className="px-6 py-3 font-medium">Bed Type</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300 text-black body-1">
                  {loading && (
                    <tr>
                      <td colSpan={4} className="px-6 py-6 text-center text-gray-500">
                        Loading rooms...
                      </td>
                    </tr>
                  )}
                  {!loading && error && (
                    <tr>
                      <td colSpan={4} className="px-6 py-6 text-center text-red-600">
                        {error}
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    !error &&
                    paginatedRooms.map((room) => (
                      <tr key={room.no} className="hover:bg-gray-50 h-[77px]">
                        <td className="px-6">{room.no}</td>
                        <td className="px-6">{room.type}</td>
                        <td className="px-6">{room.bed}</td>
                        <td className="px-6">
                          <div className="relative inline-block">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdown(openDropdown === room.no ? null : room.no);
                              }}
                              className={`inline-flex items-center gap-1 rounded-[4px] px-3 py-1 body-2 font-medium cursor-pointer ${room.color}`}
                            >
                              {room.status}
                              <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            {openDropdown === room.no && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute left-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-xl min-w-[220px]"
                              >
                                {/* Search box */}
                                <div className="p-2 border-b border-gray-300">
                                  <input
                                    autoFocus
                                    type="text"
                                    value={statusSearch}
                                    onChange={(e) => setStatusSearch(e.target.value)}
                                    placeholder="Search status..."
                                    className="w-full px-3 py-1.5 body-2 font-normal! text-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder:text-gray-500"
                                  />
                                </div>
                                {/* Status list */}
                                <div className="py-2 px-2 flex flex-col gap-1 max-h-[260px] overflow-y-auto">
                                  {statusList
                                    .filter((s) =>
                                      s.status_name.toLowerCase().includes(statusSearch.toLowerCase())
                                    )
                                    .map((s) => (
                                      <button
                                        key={s.id}
                                        type="button"
                                        disabled={updating}
                                        onClick={() => {
                                          setStatusSearch("");
                                          handleStatusChange(room.room_number, s.id);
                                        }}
                                        className={`w-full text-left px-3 py-1.5 text-sm font-medium rounded-full cursor-pointer hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed ${getStatusColor(s.status_name)}`}
                                      >
                                        {s.status_name}
                                      </button>
                                    ))}
                                  {statusList.filter((s) =>
                                    s.status_name.toLowerCase().includes(statusSearch.toLowerCase())
                                  ).length === 0 && (
                                    <p className="text-center text-sm text-gray-400 py-2">No status found</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {!loading && !error && rooms.length > 0 && (
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
                {pageNumbers.map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setPage(pageNum)}
                    className={`min-w-[36px] py-2 px-2 cursor-pointer rounded border text-sm font-medium ${
                      pageNum === currentPage
                        ? "bg-green-100 border-green-300 text-green-800"
                        : "border-gray-300 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {pageNum}
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
          </div>
        </div>
      </div>
    </>
  );
}
