
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/contexts/authentication";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
import CancelBookingModal from "./CancelBookingModal";
import BookingHistorySkeleton from "./BookingHistorySkeleton";
import Button from "../ui/buttons/buttons";

function getBookingPolicy(booking) {
    const now = new Date();
    const bookingDate = new Date(booking.bookingDate);
    const checkIn = new Date(booking.checkIn);

    const hoursSinceBooking = (now - bookingDate) / (1000 * 60 * 60);
    const hoursBeforeCheckin = (checkIn - now) / (1000 * 60 * 60);

    const within24Booking = hoursSinceBooking < 24;
    const within24Checkin = hoursBeforeCheckin < 24;
    const alreadyCheckedIn = now > checkIn;

    let canChangeDate = false;
    let canCancel = false;
    let canRefund = false;

    if (alreadyCheckedIn) {
        // 4. after check-in → hide all CTA
        canChangeDate = false;
        canCancel = false;
    } else if (within24Booking) {
        // 1. within 24h of booking
        canChangeDate = true;
        canCancel = true;
        canRefund = true;
    } else if (within24Checkin) {
        // 3. within 24h before check-in
        canChangeDate = false;
        canCancel = true;
        canRefund = false;
    } else {
        // 2. after 24h booking (but not near check-in)
        canChangeDate = false;
        canCancel = true;
        canRefund = true;
    }

    return { canChangeDate, canCancel, canRefund };
}

export default function BookingHistory() {
    const { isAuthenticated } = useAuth();

    const [loading, setLoading] = useState(true);

    const router = useRouter();

    const [openId, setOpenId] = useState(null);
    const [bookings, setBookings] = useState([]);

    const [page, setPage] = useState(1);
    const itemsPerPage = 3;
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

                        console.log(booking);

                        const open = openId === booking.id;

                        const { canChangeDate, canCancel, canRefund } = getBookingPolicy(booking);

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
                                            <div className="px-4 py-2 lg:flex lg:justify-between lg:items-center">
                                                <p className="headline-4 pb-1">{booking.room}</p>
                                                <p className="flex items-center body-1 text-gray-600">
                                                    Booking date:{" "}
                                                    {new Date(booking.bookingDate).toLocaleDateString("en-GB", {
                                                        weekday: "short",
                                                        day: "2-digit",
                                                        month: "short",
                                                        year: "numeric"
                                                    })}
                                                </p>
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
                                            <button
                                                onClick={() => toggle(booking.id)}
                                                className="w-full h-[56px] flex items-center justify-between px-10 py-10 body-1 text-gray-900"
                                            >
                                                <span className="font-semibold">Booking Detail</span>
                                                {open ? (
                                                    <ChevronUp size={24} className="text-orange-500" />
                                                ) : (
                                                    <ChevronDown size={24} className="text-orange-500" />
                                                )}
                                            </button>

                                            {/* DROPDOWN DETAIL */}
                                            {open && (
                                                <div className="bg-gray-100 rounded p-6">
                                                    <div className="flex justify-between pb-6 body-1 text-gray-700">
                                                        <p>
                                                            {booking.guests} Guests ({booking.nights} Night)
                                                        </p>
                                                        <p className="font-semibold">
                                                            Payment success via {booking.payment || "Credit Card"}
                                                        </p>
                                                    </div>

                                                    <div className="flex justify-between body-1 py-2">
                                                        <p className="text-gray-700">{booking.room}</p>
                                                        <p className="font-semibold text-gray-900">
                                                            {booking.roomPrice.toLocaleString()}
                                                        </p>
                                                    </div>

                                                    {booking.extras?.map((extra) => (
                                                        <div
                                                            key={extra.name}
                                                            className="flex justify-between body-1 py-2"
                                                        >
                                                            <p className="text-gray-700">{extra.name}</p>
                                                            <p className="font-semibold text-gray-900">
                                                                {extra.price.toLocaleString()}
                                                            </p>
                                                        </div>
                                                    ))}

                                                    {booking.discount > 0 && (
                                                        <div className="flex justify-between py-2">
                                                            <p className="text-gray-700">Promotion Code</p>
                                                            <p className="font-semibold text-gray-900">
                                                               - {booking.discount.toLocaleString()}
                                                            </p>
                                                        </div>
                                                    )}

                                                    <div className="flex justify-between border-t-gray-400 pt-7">
                                                        <p className="text-gray-700">Total</p>
                                                        <p className="headline-5 font-semibold text-gray-900">
                                                            THB {booking.total.toLocaleString()}
                                                        </p>
                                                    </div>

                                                    {booking.request && (
                                                        <div className="body-1 text-gray-700 rounded pt-5">
                                                            <p className="font-semibold">Additional Request</p>
                                                            <p>{booking.request}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* ACTION BUTTONS */}
                                            <div className="p-4 border-t flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                                                <div className="flex items-center justify-center h-[48px] w-full lg:w-auto lg:order-2 lg:gap-4">
                                                    <Button
                                                        type="button"
                                                        buttonStyle="ghost"
                                                        buttonText="Room Detail"
                                                        onClick={() => {
                                                            router.push(`/rooms/${booking.room}`);
                                                        }}
                                                    />

                                                    {canChangeDate && (
                                                        <Button
                                                            type="button"
                                                            buttonStyle="primary"
                                                            buttonText="Change Date"
                                                            className="w-[190px] h-[50px]"
                                                            onClick={() =>
                                                                router.push(`/booking-action/${booking.id}/change-date`)
                                                            }
                                                        />

                                                    )}
                                                </div>

                                                <div className="flex justify-end pr-10 lg:pr-10 lg:order-1">
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
                                        </div>
                                    </div>
                                </div>
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