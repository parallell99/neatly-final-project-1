"use client";

import { useState } from "react";
import Button from "../ui/buttons/buttons";
import { useAuth } from "@/contexts/authentication";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function RoomCard({ room, searchParams, onClick }) {
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const [booking, setBooking] = useState(false);
    const [bookingError, setBookingError] = useState(null);

    function createSlug(title) {
        if (!title || typeof title !== "string") return "";
        return title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    }

    const slug = room?.slug || createSlug(room?.title) || (room?.id ? String(room.id) : "");

    // --- คำนวณ availability ---
    const availableRooms = Number(room.available_rooms ?? 0);
    const requestedRooms = searchParams?.numRooms ?? 1;
    const requestedAdults = searchParams?.numAdults ?? 2;
    const requestedKids = searchParams?.numKids ?? 0;
    const totalGuests = requestedAdults + requestedKids;
    const guestsPerRoom = Number(room.room_guest_adult + room.room_guest_kid);
    const roomsNeededForGuests = Math.ceil(totalGuests / guestsPerRoom);
    const roomsNeeded = Math.max(requestedRooms, roomsNeededForGuests);
    const notEnoughRooms = availableRooms < roomsNeeded;
    const bookingQuantity = notEnoughRooms ? availableRooms : roomsNeeded;
    const unaccommodatedGuests = notEnoughRooms
        ? Math.max(0, totalGuests - availableRooms * guestsPerRoom)
        : 0;

    const hasSearchParams = !!(searchParams?.checkIn && searchParams?.checkOut);

    // --- handle Book Now ---
    const handleBook = async () => {
        if (!isAuthenticated) {
            router.push("/login");
            return;
        }

        try {
            setBooking(true);
            setBookingError(null);

            const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

            if (!token) {
                router.push("/login");
                return;
            }

            await axios.post(
                "/api/rooms/order",
                {
                    room_type_id: room.room_type_id,
                    check_in_date: searchParams.checkIn,
                    check_out_date: searchParams.checkOut,
                    quantity: bookingQuantity,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            // สำเร็จ → ไปหน้า bookingไปหน้าคุณโม
            router.push(`/booking`);
        } catch (err) {
            console.error("Booking error:", err);
            setBookingError(err.response?.data?.error || "Booking failed. Please try again.");
        } finally {
            setBooking(false);
        }
    };

    return (
        <article className="flex flex-col gap-4 lg:flex-row lg:gap-12 border-b border-gray-200 lg:py-10">

            {/* Image */}
            <div
                className="relative w-full h-[300px] object-cover overflow-hidden cursor-pointer lg:w-[453px] lg:h-[320px] rounded-sm"
                onClick={onClick}
            >
                <img
                    src={room.image_main}
                    alt={room.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                />
            </div>

            <div className="grow flex flex-col gap-4 px-4 pb-6 lg:py-6 lg:justify-between">
                <div className="flex gap-4 flex-col lg:flex-row lg:justify-between">

                    {/* Content Text */}
                    <div className="flex-1 lg:w-[620px]">
                        <p className="headline-4 mb-2 cursor-pointer" onClick={onClick}>
                            {room.room_type_name}
                        </p>

                        <div className="flex gap-3 body-1 text-gray-700 mb-4">
                            <span>{guestsPerRoom} Guests</span>
                            <span>|</span>
                            <span>{room.bed_type}</span>
                            <span>|</span>
                            <span>{room.room_size} sqm</span>
                        </div>

                        {/* Available rooms */}
                        <p className="headline-5 text-gray-900 leading-relaxed mb-2">
                            Available {availableRooms} rooms
                        </p>

                        {/* ── Availability Warning: Not enough rooms ── */}
                        {hasSearchParams && notEnoughRooms && availableRooms > 0 && (
                            <div className="mb-3 rounded-md bg-amber-50 border border-amber-300 px-4 py-3">
                                <p className="body-1 text-amber-800 font-medium">
                                    Limited room availability for your search
                                </p>
                                <p className="body-1 text-amber-700 mt-1">
                                    You requested <strong>{roomsNeeded} rooms</strong>, but only{" "}
                                    <strong>{availableRooms} rooms</strong> are currently available
                                    {unaccommodatedGuests > 0 && (
                                        <>
                                            {" "}— <strong>{unaccommodatedGuests} guests</strong> cannot be accommodated
                                        </>
                                    )}
                                </p>
                            </div>
                        )}

                        {/* ── No rooms available ── */}
                        {hasSearchParams && availableRooms === 0 && (
                            <div className="mb-3 rounded-md bg-red-50 border border-red-300 px-4 py-3">
                                <p className="body-1 text-red-700 font-medium">
                                    No rooms available for the selected dates
                                </p>
                            </div>
                        )}

                        {/* ── Booking error ── */}
                        {bookingError && (
                            <div className="mb-3 rounded-md bg-red-50 border border-red-300 px-4 py-3">
                                <p className="body-1 text-red-700">{bookingError}</p>
                            </div>
                        )}

                        <p className="body-1 text-gray-700 leading-relaxed line-clamp-5">
                            {room.description}
                        </p>
                    </div>

                    {/* Price Section */}
                    <div className="flex flex-col items-end">
                        {room.price_per_night && (
                            <p className="body-1 line-through text-gray-700 mb-1">
                                THB {room.price_per_night}
                            </p>
                        )}
                        <p className="headline-5 text-gray-900 mb-3">
                            THB {room.promotion_price_per_night || "THB 2500.00"}
                        </p>
                        <p className="body-1 text-gray-700 leading-tight">
                            Per Night
                            <br />
                            (Including Taxes & Fees)
                        </p>
                    </div>
                </div>

                {/* Button Section */}
                <div className="w-full grid grid-cols-2 lg:flex lg:justify-end lg:gap-4">
                    <Button
                        type="button"
                        buttonStyle="ghost"
                        buttonText="Room Detail"
                        onClick={() => {
                            if (slug) router.push(`/rooms/${slug}`);
                        }}
                    />

                    <Button
                        type="button"
                        buttonStyle="primary"
                        buttonText={booking ? "Booking..." : "Book Now"}
                        disabled={booking || availableRooms === 0}
                        onClick={handleBook}
                    />
                </div>
            </div>
        </article>
    );
}