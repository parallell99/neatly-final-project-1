
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/contexts/authentication";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
import CancelBookingModal from "./CancelBookingModal";
import BookingHistorySkeleton from "./BookingHistorySkeleton";
import Button from "../ui/buttons/buttons";

function createSlug(str) {
    if (!str || typeof str !== "string") return "";
    return str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function getBookingPolicy(booking) {
    const now = new Date();

    const bookingDate = new Date(booking.bookingDate);

    const checkIn = new Date(booking.checkIn);
    checkIn.setHours(14, 0, 0, 0); // ⭐ FIX: set check-in time = 14:00

    const hoursSinceBooking = (now - bookingDate) / (1000 * 60 * 60);
    const hoursBeforeCheckin = (checkIn - now) / (1000 * 60 * 60);

    const within24Booking = hoursSinceBooking < 24;
    const within24Checkin = hoursBeforeCheckin < 24;
    const alreadyCheckedIn = now >= checkIn;

    // 4. AFTER CHECK-IN
    if (alreadyCheckedIn) {
        return {
            canChangeDate: false,
            canCancel: false,
            canRefund: false,
        };
    }

    // Change date:
    // - only within 24h after booking
    // - but NOT allowed in the last 24h before check-in (14:00)
    const canChangeDate = within24Booking && !within24Checkin;

    // Refund:
    // - not allowed in the last 24h before check-in (14:00)
    const canRefund = !within24Checkin;

    return {
        canChangeDate,
        canCancel: true,
        canRefund,
    };
}

export default function BookingHistory() {
    const { isAuthenticated } = useAuth();

    const [loading, setLoading] = useState(true);

    const router = useRouter();

    const [openId, setOpenId] = useState(null);
    const [bookings, setBookings] = useState([]);

    const [page, setPage] = useState(1);
    const itemsPerPage = 5;
    const totalPages = Math.ceil(bookings.length / itemsPerPage);

    const [selectedBookingId, setSelectedBookingId] = useState(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelType, setCancelType] = useState("refund");

    const toggle = (id) => {
        setOpenId(openId === id ? null : id);
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchBookings();
        }
    }, [isAuthenticated]);

    const fetchBookings = async () => {
        try {
            setLoading(true);

            const token =
                typeof window !== "undefined"
                    ? window.localStorage.getItem("token")
                    : null;

            const { data } = await axios.get("/api/booking-history", {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });

            setBookings(data.bookings);
            setPage(1);
        } catch (err) {
            console.error("API ERROR:", err.response?.data || err.message);
        } finally {
            setLoading(false);
        }
    };

    const startIndex = (page - 1) * itemsPerPage;
    const currentBookings = bookings.slice(
        startIndex,
        startIndex + itemsPerPage
    );

    return (
        <div className="max-w-5xl mx-auto">
            <p className="headline-3 font-serif text-green-800 tracking-tighter px-4 pt-10 pb-6 lg:py-14">
                Booking History
            </p>

            <div className="space-y-10">
                {loading ? (
                    <>
                        <BookingHistorySkeleton />
                        <BookingHistorySkeleton />
                        <BookingHistorySkeleton />
                    </>
                ) : bookings.length === 0 ? (
                    <p className="text-center text-gray-500 py-20">
                        No booking history
                    </p>
                ) : (
                    currentBookings.map((booking) => {

                        const open = openId === booking.id;

                        const { canChangeDate, canCancel, canRefund } = getBookingPolicy(booking);
                        const status = typeof booking?.status === "string" ? booking.status.toLowerCase() : "";
                        const isClosed = status === "refunded" || status === "cancelled";

                        const hideAllCTA = isClosed || (!canCancel && !canChangeDate);

                        console.log(hideAllCTA)

                        return (
                            <div key={booking.id} className="border-b pb-10">
                                <div className="lg:flex lg:gap-8">

                                    {/* IMAGE */}
                                    <img
                                        src={booking.image || "/images/default-room.jpg"}
                                        className="w-full h-[220px] object-cover rounded-sm lg:w-[357px] lg:h-[220px]"
                                    />

                                    {/* CONTENT */}
                                    <div className="mt-4 lg:mt-0 flex-1">
                                        <div className="flex-1">
                                            <div className="px-4 py-2 lg:flex lg:justify-between lg:items-start">

                                                {/* LEFT */}
                                                <div>
                                                    <p className="headline-4 pb-1">{booking.room}</p>
                                                </div>

                                                {/* RIGHT */}
                                                <div className="lg:text-right">
                                                    <p className="body-1 text-gray-600">
                                                        Booking date:{" "}
                                                        {new Date(booking.bookingDate).toLocaleDateString("en-GB", {
                                                            weekday: "short",
                                                            day: "2-digit",
                                                            month: "short",
                                                            year: "numeric"
                                                        })}
                                                    </p>

                                                    {["cancelled", "refunded"].includes(booking.status?.toLowerCase()) && booking.cancelDate && (
                                                        <p className="body-1 text-gray-600">
                                                            Cancellation date:{" "}
                                                            {new Date(booking.cancelDate).toLocaleDateString("en-GB", {
                                                                weekday: "short",
                                                                day: "2-digit",
                                                                month: "short",
                                                                year: "numeric"
                                                            })}
                                                        </p>
                                                    )}
                                                </div>

                                            </div>


                                            {/* CHECK IN OUT */}
                                            <div className="p-4 space-y-3 body-1 text-gray-800 lg:flex lg:gap-10 lg:space-y-0">
                                                <div className="pb-2">
                                                    <p className="font-semibold">Check-in</p>
                                                    <p className="text-gray-800">
                                                        {new Date(booking.checkIn).toLocaleDateString("en-GB", {
                                                            weekday: "short",
                                                            day: "2-digit",
                                                            month: "short",
                                                            year: "numeric"
                                                        })} | After 2:00 PM
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="font-semibold">Check-out</p>
                                                    <p className="text-gray-800">
                                                        {new Date(booking.checkOut).toLocaleDateString("en-GB", {
                                                            weekday: "short",
                                                            day: "2-digit",
                                                            month: "short",
                                                            year: "numeric"
                                                        })} | Before 12:00 PM
                                                    </p>
                                                </div>
                                            </div>

                                            {/* BOOKING DETAIL BUTTON */}
                                            <div className="flex flex-col px-[16px] lg:px-0">
                                                <button
                                                    onClick={() => toggle(booking.id)}
                                                    className={`w-full h-[56px] flex items-center justify-between pl-[28px] pr-6 py-[16px] body-1 text-gray-900 bg-gray-200 hover:cursor-pointer hover:rounded-[4px] ${open ? "bg-gray-200 rounded-t-[4px]" : ""}`}
                                                >
                                                    <span className="font-semibold">Booking Detail</span>
                                                    {open ? (
                                                        <ChevronDown size={24} className="text-gray-900" />
                                                    ) : (
                                                        <ChevronUp size={24} className="text-orange-500" />
                                                    )}
                                                </button>
                                            
                                            {/* DROPDOWN DETAIL */}
                                            {open && (
                                                <div className="bg-gray-200 rounded-b-[4px] p-6">
                                                    <div className="flex justify-between pb-2 body-1 text-gray-700">
                                                        <p>
                                                            <span className="block lg:inline">
                                                                {booking.guests} Guests
                                                            </span>
                                                            <span className="block lg:inline lg:ml-1">
                                                                ({booking.nights} Night)
                                                            </span>
                                                        </p>
                                                        <p className="font-semibold">
                                                            {booking.payment ? (
                                                                <>
                                                                    <span className="block lg:inline">Payment success via</span>
                                                                    <span className="block lg:inline lg:ml-1">{booking.payment}</span>
                                                                </>
                                                            ) : (
                                                                <span className="text-gray-700">Pay at property (Cash)</span>
                                                            )}
                                                        </p>
                                                    </div>

                                                    <div className="flex justify-between body-1 py-2">
                                                        <p className="text-gray-700">{booking.room}</p>
                                                        <p className="font-semibold text-gray-900">
                                                            {booking.roomPrice.toLocaleString()}.00
                                                        </p>
                                                    </div>

                                                    {booking.extras?.map((extra) => (
                                                        <div
                                                            key={extra.name}
                                                            className="flex justify-between body-1 py-2"
                                                        >
                                                            <p className="text-gray-700">{extra.name}</p>
                                                            <p className="font-semibold text-gray-900">
                                                                {extra.price.toLocaleString()}.00
                                                            </p>
                                                        </div>
                                                    ))}

                                                    {booking.discount > 0 && (
                                                        <div className="flex justify-between py-2">
                                                            <p className="text-gray-700">Promotion Code</p>
                                                            <p className="font-semibold text-gray-900">
                                                                - {booking.discount}.00
                                                            </p>
                                                        </div>
                                                    )}

                                                    <div className="flex justify-between mt-[16px] border-t border-gray-400 pt-[16px]">
                                                        <p className="text-gray-700">Total</p>
                                                        <p className="headline-5 font-semibold text-gray-900">
                                                            THB {booking.total.toLocaleString()}
                                                        </p>
                                                    </div>

                                                    {booking.request && (
                                                        <div className="body-1 text-gray-700 rounded-b-[4px] mt-[12px] -mx-[24px] -mb-[24px] pb-[24px] px-[24px] pt-5 bg-gray-300">
                                                            <p className="font-semibold">Additional Request</p>
                                                            <p>{booking.request}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
</div>

                                        </div>
                                    </div>
                                </div>
                                {/* ACTION BUTTONS */}
                                {!hideAllCTA && (
                                    <div className="flex flex-col pt-[24px] gap-6 lg:flex-row lg:items-center lg:justify-between">
                                        <div className="flex items-center justify-between h-[48px] w-full gap-8 lg:w-auto lg:order-2 lg:gap-4 px-[16px] lg:px-0">
                                            <Button
                                                type="button"
                                                buttonStyle="ghost"
                                                buttonText="Room Detail"
                                                 className="w-[150px] lg:w-[150px] whitespace-nowrap px-5 py-3"
                                                onClick={() => {
                                                    router.push(`/rooms/${createSlug(booking.room)}`);
                                                }}
                                            />

                                            {canChangeDate && (
                                                <Button
                                                    type="button"
                                                    buttonStyle="primary"
                                                    buttonText="Change Date"
                                                    className="w-[150px] lg:w-[150px] whitespace-nowrap px-5 py-3"
                                                    onClick={() =>
                                                        router.push(`/booking-action/${booking.id}/change-date`)
                                                    }
                                                />

                                            )}
                                        </div>

                                        <div className="flex justify-end pr-[28px] lg:pr-10 lg:order-1">
                                            {canCancel && (
                                                <Button
                                                    type="button"
                                                    buttonStyle="ghost"
                                                    buttonText="Cancel Booking"
                                                    onClick={() => {
                                                        setSelectedBookingId(booking.id);
                                                        setCancelType(canRefund ? "refund" : "cancel");
                                                        setShowCancelModal(true);
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* PAGINATION */}
            <div className="flex items-center justify-center gap-1 py-12">
                <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="w-10 h-10 flex items-center justify-center text-gray-600 disabled:opacity-30"
                >
                    <ChevronLeft size={20} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                    <button
                        key={num}
                        onClick={() => setPage(num)}
                        className={`w-10 h-10 flex items-center justify-center rounded-md ${page === num
                            ? "border border-green-300 text-green-800 body-1"
                            : "text-gray-500"
                            }`}
                    >
                        {num}
                    </button>
                ))}

                <button
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page === totalPages}
                    className="w-10 h-10 flex items-center justify-center text-gray-600 disabled:opacity-30"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            <CancelBookingModal
                open={showCancelModal}
                type={cancelType}
                onClose={() => setShowCancelModal(false)}
                onConfirm={() => {
                    if (!selectedBookingId) return;

                    router.push(`/booking-action/${selectedBookingId}/${cancelType}`);

                    setShowCancelModal(false);
                }}
            />
        </div>
    );
}