"use client";

import React, { useState, useEffect } from "react";
import SideBarAdmin from "@/components/layout/SideBarAdmin";
import AdminMobileNav from "@/components/layout/AdminMobileNav";
import DashboardTopCard from "@/components/dashboard/dashboardTopCard";
import RoomAvailabilityCard from "@/components/dashboard/RoomAvailability";
import BookingTrendsByDayCard from "@/components/dashboard/BookingTrendsByDay";
import RevenueTrendCard from "@/components/dashboard/RevenueTrend";
import OccupancyGuestCard from "@/components/dashboard/OccupancyGuest";
import CheckInCheckOutTimesCard from "@/components/dashboard/CheckInCheckOutTimes";
import WebsiteTrafficCard from "@/components/dashboard/WebsiteTraffic";

import Cart from "@/assets/icons/cart.svg";
import Booking from "@/assets/icons/booking.svg";
import Site from "@/assets/icons/site.svg";
import Wallet from "@/assets/icons/wallet.svg";

import { useRoomAvailability } from "@/hooks/analytics/useRoomAvailability";
import { useBookingTrends } from "@/hooks/analytics/useBookingTrends";
import { useRevenueTrend } from "@/hooks/analytics/useRevenueTrend";
import { useOccupancyGuest } from "@/hooks/analytics/useOccupancyGuest";
import { useCheckInCheckOut } from "@/hooks/analytics/useCheckInCheckOut";
import { useTrafficData } from "@/hooks/analytics/useTrafficData";

//Dashboard top card-----------------------------------------------------Dashboard top card Data
const dashboardStats = [
    {
        key: "totalBooking",
        label: "Total Booking",
        value: 76,
        percentChange: 52,
        trend: "up",
        type: "number",
    },
    {
        key: "totalSales",
        label: "Total Sales",
        value: 58829,
        percentChange: 17.7,
        trend: "up",
        type: "currency",
        currency: "THB",
    },
    {
        key: "totalBookingUsers",
        label: "Total Booking Users",
        value: 66,
        percentChange: -2.9,
        trend: "down",
        type: "number",
    },
    {
        key: "totalSiteVisitors",
        label: "Total site visitors",
        value: 459,
        percentChange: 8.5,
        trend: "up",
        type: "number",
    },
];

const iconMap = {

    totalSales: Wallet,
    totalBooking: Cart,
    totalBookingUsers: Booking,
    totalSiteVisitors: Site,
};

// ── Room Availability mock , transform -------------------------------------------------------
function AnalyticDashboard() {
    const today = new Date();
    const currentYear = today.getFullYear();
    useEffect(() => {
        if (typeof window === "undefined") return;
        document.documentElement.classList.add("allow-x-scroll");
        document.body.classList.add("allow-x-scroll");
        return () => {
            document.documentElement.classList.remove("allow-x-scroll");
            document.body.classList.remove("allow-x-scroll");
        };
    }, []);
    // ── Room Availability mock , transform -------------------------------------------------------
    const [roomPeriod, setRoomPeriod] = useState("month");
    const { data: roomData, loading: roomLoading } = useRoomAvailability(roomPeriod);
    // ── Booking Trends (mock + live) ---------------------------------------------------------------
    const [bookingPeriod, setBookingPeriod] = useState("month");
    const [bookingUseLive, setBookingUseLive] = useState(false);
    const { data: bookingData, loading: bookingLoading } = useBookingTrends(
        bookingPeriod,
        bookingUseLive
    );
    // ── Revenue Trend (date range, mock + live API) --------------------------------------------------------
    const [revenueDateFrom, setRevenueDateFrom] = useState(
        () => new Date(currentYear, 0, 1)
    );
    const [revenueDateTo, setRevenueDateTo] = useState(() => today);
    const [revenueMode, setRevenueMode] = useState("booking_date");
    const [revenueGranularity, setRevenueGranularity] = useState("month");
    const [revenueUseLive, setRevenueUseLive] = useState(false);
    const { data: revenueData, loading: revenueLoading } = useRevenueTrend(
        revenueDateFrom,
        revenueDateTo,
        revenueMode,
        revenueUseLive
    );
    // ── Occupancy & Guest ---------------------------------------------------------------------------
    const [occFrom, setOccFrom] = useState(
        () => new Date(currentYear, 0, 1)
    );
    const [occTo, setOccTo] = useState(() => new Date());
    const [occViewBy, setOccViewBy] = useState("overall");
    const [occGranularity, setOccGranularity] = useState("month");
    const [occUseLive, setOccUseLive] = useState(false);
    const { data: occData, loading: occLoading, meta: occMeta } = useOccupancyGuest(
        occFrom,
        occTo,
        occViewBy,
        occGranularity,
        occUseLive
    );
    // ── Check-in / Check-out averages ----------------------------------------------------------------
    const { data: checkTimeData, loading: checkTimeLoading } = useCheckInCheckOut();
    // ── Website traffic ------------------------------------------------------------------------------
    const [trafficPeriod, setTrafficPeriod] = useState("last_7_days");
    const [trafficPage, setTrafficPage] = useState("all");
    const {
        data: trafficData,
        loading: trafficLoading,
        roomOptions: trafficRoomOptions,
    } = useTrafficData(trafficPeriod, trafficPage);

    return (
        <div className="flex flex-col xl:flex-row">
            <div className="hidden xl:block">
                <SideBarAdmin />
            </div>

            <AdminMobileNav />

            <div className="xl:flex xl:flex-col xl:w-full">
                <header className="flex h-[80px] bg-white border border-b border-gray-300 p-[16px] xl:px-[60px] xl:py-[16px] xl:items-center">
                    <h5 className="headline-5 text-gray-900">
                        Analytics Dashboard
                    </h5>
                </header>

                <main className="flex flex-col bg-gray-100 gap-[24px] xl:px-[60px] xl:py-[40px] pb-[119px]">
                    {/*upper card */}
                    <section className="grid grid-cols-1 xl:grid-cols-4 p-[16px] xl:p-0 gap-[16px] xl:gap-[8px] ">
                        {dashboardStats.map((stat) => {
                            const Icon = iconMap[stat.key];
                            return (<DashboardTopCard key={stat.key} {...stat} icon={Icon} />)

                        })}
                    </section>

                    {/*room availability and booking trend*/}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-[24px] xl:gap-[8px]">
                        <section className="rounded-[8px] border border-gray-300 p-[16px] xl:pt-[24px] xl:pr-[40px] xl:pl-[40px] xl:pb-[24px] bg-white flex flex-col gap-[8px] relative">
                            <RoomAvailabilityCard
                                periodId={roomPeriod}
                                onPeriodChange={setRoomPeriod}
                                data={roomData}
                                loading={roomLoading}
                            />
                        </section>
                        {/*booking trend */}
                        <section className="rounded-[8px] border border-gray-300 p-[16px] xl:pt-[24px] xl:pr-[40px] xl:pl-[40px] xl:pb-[24px] bg-white flex flex-col gap-[8px] relative">
                            <BookingTrendsByDayCard
                                periodId={bookingPeriod}
                                onPeriodChange={setBookingPeriod}
                                data={bookingData}
                                loading={bookingLoading}
                                useLive={bookingUseLive}
                                onToggleLive={() => setBookingUseLive((prev) => !prev)}
                            />
                        </section>
                    </div>


                    <section className="rounded-[8px] border border-gray-300 p-[16px] bg-white flex flex-col gap-[8px] relative">
                        <RevenueTrendCard
                            dateFrom={revenueDateFrom}
                            dateTo={revenueDateTo}
                            onDateFromChange={setRevenueDateFrom}
                            onDateToChange={setRevenueDateTo}
                            mode={revenueMode}
                            onModeChange={setRevenueMode}
                            data={revenueData}
                            granularity={revenueGranularity}
                            onGranularityChange={setRevenueGranularity}
                            loading={revenueLoading}
                            useLive={revenueUseLive}
                            onToggleLive={() => setRevenueUseLive((prev) => !prev)}
                        />
                    </section>

                    <section className="rounded-[8px] border border-gray-300 p-[16px] bg-white flex flex-col gap-[8px] relative">
                        <OccupancyGuestCard
                            dateFrom={occFrom}
                            dateTo={occTo}
                            onDateFromChange={(date) => {
                                setOccFrom(date);
                            }}
                            onDateToChange={(date) => {
                                setOccTo(date);
                            }}
                            viewBy={occViewBy}
                            onViewByChange={setOccViewBy}
                            granularity={occGranularity}
                            onGranularityChange={(v) => setOccGranularity(v)}
                            data={occData}
                            loading={occLoading}
                            resolvedGranularity={occMeta?.resolvedGranularity}
                            autoGroupMeta={occMeta}
                            useLive={occUseLive}
                            onToggleLive={() => setOccUseLive((prev) => !prev)}
                        />
                    </section>

                    <section className="rounded-[8px] border border-gray-300 p-[16px] bg-white flex flex-col gap-[8px] relative">
                        <CheckInCheckOutTimesCard
                            data={checkTimeData}
                            loading={checkTimeLoading}
                        />
                    </section>

                    <section className="rounded-[8px] border border-gray-300 p-[16px] bg-white flex flex-col gap-[8px] relative">
                        <WebsiteTrafficCard
                            pageId={trafficPage}
                            onPageChange={setTrafficPage}
                            periodId={trafficPeriod}
                            onPeriodChange={setTrafficPeriod}
                            data={trafficData}
                            loading={trafficLoading}
                            roomOptions={trafficRoomOptions}
                        />
                    </section>
                </main>
            </div >
        </div >
    );
}

export default AnalyticDashboard;
