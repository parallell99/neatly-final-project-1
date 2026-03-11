"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/authentication";
import { supabase } from "@/lib/supabase";
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
import CancelBookingModal from "./CancelBookingModal";



export default function BookingHistory() {
    const { user } = useAuth();
    
    const [openId, setOpenId] = useState(null);
    const [bookings, setBookings] = useState([]);

    const [page, setPage] = useState(1);
    const totalPages = 5;


    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelType, setCancelType] = useState("refund");

    const toggle = (id) => {
        setOpenId(openId === id ? null : id);
    };

    useEffect(() => {
        if (user) {
            fetchBookings();
        }
    }, [user]);

    const fetchBookings = async () => {

        if (!user) return;

        console.log("USER ID:", user.id);
    
        const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          check_in_date,
          check_out_date,
          total_price,
          quantity,
          created_at,
          additional_request,
          card_brand,
          card_last4,
          room_types (
            name,
            image_main
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
        
        console.log("QUERY RESULT:", data, error);
        console.log("ORDERS:", data);
    
        if (error) {
            console.log(error);
            return;
        }
    
        const formatted = data.map((order) => {
            const nights =
                (new Date(order.check_out_date) -
                    new Date(order.check_in_date)) /
                (1000 * 60 * 60 * 24);
    
            return {
                id: order.id,
                room: order.room_types?.name,
                image: order.room_types?.image_main,
                checkIn: order.check_in_date,
                checkOut: order.check_out_date,
                guests: order.quantity,
                nights: nights,
                total: order.total_price,
                payment: `${order.card_brand} •••• ${order.card_last4}`,
                request: order.additional_request,
                bookingDate: order.created_at
            };
        });
    
        setBookings(formatted);
    };

    return (
        <div className="max-w-5xl mx-auto">
            <p className="headline-3 font-serif text-green-800 tracking-tighter px-4 pt-10 pb-6 lg:py-14">
                Booking History
            </p>
            <div className="space-y-10">
                {bookings.length === 0 ? (
                    <p className="text-center text-gray-500 py-20">
                        No booking history
                    </p>
                ) : (
                    bookings.map((booking) => {
                        const open = openId === booking.id;

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
                                                <p className="headline-4 pb-1">
                                                    {booking.room}
                                                </p>
                                                <p className="flex items-center body-1 text-gray-600">
                                                    Booking date: {new Date(booking.bookingDate).toDateString()}
                                                </p>
                                            </div>
                                            {/* CHECK IN OUT */}
                                            <div className="p-4 space-y-3 body-1 text-gray-800 lg:flex lg:gap-10 lg:space-y-0">
                                                <div className="pb-2">
                                                    <p className="font-semibold">Check-in</p>
                                                    <p className="text-gray-800">
                                                        {booking.checkIn} | After 2:00 PM
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="font-semibold">Check-out</p>
                                                    <p className="text-gray-800">
                                                        {booking.checkOut} | Before 12:00 PM
                                                    </p>
                                                </div>
                                            </div>

                                            {/* BOOKING DETAIL BUTTON */}
                                            <button
                                                onClick={() => toggle(booking.id)}
                                                className="w-full h-[56px] flex items-center justify-between px-10 py-10 body-1 text-gray-900"
                                            >
                                                <span className="font-semibold">
                                                    Booking Detail
                                                </span>

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
                                                            Payment success via {booking.payment}
                                                        </p>
                                                    </div>

                                                    <div className="flex justify-between body-1 py-2">
                                                        <p className="text-gray-700">
                                                            {booking.room}
                                                        </p>
                                                        <p className="font-semibold text-gray-900">
                                                            {booking.total.toLocaleString()}
                                                        </p>
                                                    </div>

                                                    {/* <div className="flex justify-between body-1 py-2">
                                                        <p className="text-gray-700">
                                                            Airport transfer
                                                        </p>
                                                        <p className="font-semibold text-gray-900">
                                                            {booking.extras.toLocaleString()}
                                                        </p>
                                                    </div>

                                                    <div className="flex justify-between py-2">
                                                        <p className="text-gray-700">
                                                            Promotion Code
                                                        </p>
                                                        <p className="font-semibold text-gray-900">
                                                            {booking.discount}
                                                        </p>
                                                    </div> */}

                                                    <div className="flex justify-between border-t-gray-400 pt-7">
                                                        <p className="text-gray-700">
                                                            Total
                                                        </p>
                                                        <p className="headline-5 font-semibold text-gray-900">
                                                            THB {booking.total.toLocaleString()}
                                                        </p>
                                                    </div>

                                                    {booking.request && (
                                                        <div className="body-1 text-gray-700 rounded pt-5">
                                                            <p className="font-semibold">
                                                                Additional Request
                                                            </p>

                                                            <p>
                                                                {booking.request}
                                                            </p>
                                                        </div>
                                                    )}

                                                </div>
                                            )}

                                            {/* ACTION BUTTONS */}
                                            <div className="p-4 border-t flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                                                {/* top buttons */}
                                                <div className="flex items-center justify-center h-[48px] w-full lg:w-auto lg:order-2 lg:gap-4">

                                                    <button className="text-orange-500 body-1 px-8 py-4">
                                                        Room Detail
                                                    </button>

                                                    <button className="bg-orange-600 text-white rounded-sm body-1 px-8 py-4">
                                                        Change Date
                                                    </button>

                                                </div>

                                                {/* cancel */}
                                                <div className="flex justify-end pr-10 lg:pr-10 lg:order-1">
                                                    <button className="text-orange-500 body-1"
                                                        onClick={() => {
                                                            const canRefund = true; // logic จาก backend
                                                            setCancelType(canRefund ? "refund" : "no-refund");
                                                            setShowCancelModal(true);
                                                        }}
                                                    >
                                                        Cancel Booking
                                                    </button>
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

                {/* prev */}
                <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="w-10 h-10 flex items-center justify-center text-gray-600 disabled:opacity-30"
                >
                    <ChevronLeft size={20} />
                </button>

                {/* numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                    <button
                        key={num}
                        onClick={() => setPage(num)}
                        className={`w-10 h-10 flex items-center justify-center rounded-md
                                ${page === num
                                ? "border border-green-300 text-green-800 body-1"
                                : "text-gray-500"
                            }`}
                    >
                        {num}
                    </button>
                ))}

                {/* next */}
                <button
                    onClick={() => setPage(page + 1)}
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
                    console.log("cancel booking");
                    setShowCancelModal(false);
                }}
            />
        </div>
    );
}