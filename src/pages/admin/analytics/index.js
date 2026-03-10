"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import SideBarAdmin from "@/components/layout/SideBarAdmin";
import DashboardTopCard from "@/components/dashboard/dashboardTopCard";
import RoomAvailabilityCard from "@/components/dashboard/RoomAvailability";
import BookingTrendsByDayCard from "@/components/dashboard/BookingTrendsByDay";
import RevenueTrendCard from "@/components/dashboard/RevenueTrend";
import OccupancyGuestCard from "@/components/dashboard/OccupancyGuest";
import CheckInCheckOutTimesCard from "@/components/dashboard/CheckInCheckOutTimes";
import WebsiteTrafficCard from "@/components/dashboard/WebsiteTraffic";

import LogoNav from "@/assets/logo/logo-nav-dashboard.svg";
import Hamburger from "@/assets/icons/hamburger-dashboard.svg";

import Cart from "@/assets/icons/cart.svg";
import Booking from "@/assets/icons/booking.svg";
import Site from "@/assets/icons/site.svg";
import Wallet from "@/assets/icons/wallet.svg";

import { format, startOfDay, addDays, differenceInDays } from "date-fns";
import { MOCK_ORDERS } from "@/utils/DashboardMockData/order";
import { useTrafficRealtime } from "@/hooks/useTrafficRealtime";

function createSlug(title) {
  if (!title || typeof title !== "string") return "";
  return title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

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
const ROOM_AVAILABILITY_UI = {
    occupied: { color: "bg-orange-500", strokeColor: "var(--orange-500)", label: "Occupied" },
    booked: { color: "bg-green-700", strokeColor: "var(--green-700)", label: "Booked" },
    available: { color: "bg-gray-500", strokeColor: "var(--gray-500)", label: "Available" },
};

const ROOM_AVAILABILITY_MOCK = {
    month: {
        period: "month",
        total: 50,
        rooms: [
            { id: "occupied", count: 21 },
            { id: "booked", count: 14 },
            { id: "available", count: 15 },
        ],
    },
    week: {
        period: "week",
        total: 50,
        rooms: [
            { id: "occupied", count: 18 },
            { id: "booked", count: 20 },
            { id: "available", count: 12 },
        ],
    },
    day: {
        period: "day",
        total: 50,
        rooms: [
            { id: "occupied", count: 10 },
            { id: "booked", count: 5 },
            { id: "available", count: 35 },
        ],
    },
};

function transformRoomAvailability(apiResponse) {
    return apiResponse.rooms.map((room) => ({
        id: room.id,
        label: ROOM_AVAILABILITY_UI[room.id]?.label ?? room.id,
        count: room.count,
        percent: Math.round((room.count / apiResponse.total) * 100),
        ...ROOM_AVAILABILITY_UI[room.id],
    }));
}

function fetchRoomAvailability(period) {
    return new Promise((resolve) => {
        setTimeout(() => resolve(ROOM_AVAILABILITY_MOCK[period]), 500);
    });
}

// ── Booking Trends mock  transform ---------------------------------------------------------------
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const BOOKING_TRENDS_MOCK = {
    month: {
        period: "month",
        byDayOfWeek: [
            { dayOfWeek: 0, avgOccupancyPercent: 72, sampleCount: 3 },
            { dayOfWeek: 1, avgOccupancyPercent: 68, sampleCount: 2 },
            { dayOfWeek: 2, avgOccupancyPercent: 88, sampleCount: 2 },
            { dayOfWeek: 3, avgOccupancyPercent: 62, sampleCount: 2 },
            { dayOfWeek: 4, avgOccupancyPercent: 50, sampleCount: 2 },
            { dayOfWeek: 5, avgOccupancyPercent: 88, sampleCount: 2 },
            { dayOfWeek: 6, avgOccupancyPercent: 94, sampleCount: 2 },
        ],
    },
    last_month: {
        period: "last_month",
        byDayOfWeek: [
            { dayOfWeek: 0, avgOccupancyPercent: 62, sampleCount: 4 },
            { dayOfWeek: 1, avgOccupancyPercent: 53, sampleCount: 4 },
            { dayOfWeek: 2, avgOccupancyPercent: 79, sampleCount: 4 },
            { dayOfWeek: 3, avgOccupancyPercent: 82, sampleCount: 4 },
            { dayOfWeek: 4, avgOccupancyPercent: 65, sampleCount: 4 },
            { dayOfWeek: 5, avgOccupancyPercent: 91, sampleCount: 4 },
            { dayOfWeek: 6, avgOccupancyPercent: 97, sampleCount: 4 },
        ],
    },
    last_2_month: {
        period: "last_2_month",
        byDayOfWeek: [
            { dayOfWeek: 0, avgOccupancyPercent: 53, sampleCount: 4 },
            { dayOfWeek: 1, avgOccupancyPercent: 50, sampleCount: 5 },
            { dayOfWeek: 2, avgOccupancyPercent: 71, sampleCount: 4 },
            { dayOfWeek: 3, avgOccupancyPercent: 79, sampleCount: 5 },
            { dayOfWeek: 4, avgOccupancyPercent: 59, sampleCount: 4 },
            { dayOfWeek: 5, avgOccupancyPercent: 85, sampleCount: 5 },
            { dayOfWeek: 6, avgOccupancyPercent: 94, sampleCount: 4 },
        ],
    },
};

function transformBookingTrends(apiResponse) {
    return apiResponse.byDayOfWeek.map((item) => ({
        day: DAY_LABELS[item.dayOfWeek],
        percent: item.avgOccupancyPercent,
        sampleCount: item.sampleCount,
    }));
}

function fetchBookingTrends(period) {
    return new Promise((resolve) => {
        setTimeout(() => resolve(BOOKING_TRENDS_MOCK[period]), 500);
    });
}

// ── Revenue Trend mock ─────────────────────────────────────────
function getGranularity(dateFrom, dateTo) {
    const days = differenceInDays(dateTo, dateFrom);;
    if (days <= 14) return "day";
    if (days <= 31) return "week";
    return "month";
}

function fetchRevenueTrend(dateFrom, dateTo, mode = "booking_date") {
    return new Promise((resolve) => {
        setTimeout(() => {
            if (!dateFrom || !dateTo) {
                resolve({ data: [], granularity: "month" });
                return;
            }

            const granularity = getGranularity(dateFrom, dateTo);

            // เลือก field ตาม mode
            const dateField = mode === "stay_date" ? "check_in_date" : "created_at";

            // half-open [start, end): ใช้ date-fns ปัดเวลาให้ชัด
            const start = startOfDay(dateFrom);
            const end = addDays(startOfDay(dateTo), 1);

            // กรอง orders ตาม date range
            const filtered = MOCK_ORDERS.filter((o) => {
                const d = new Date(o[dateField]);
                return d >= start && d < end;
            });

            // group ตาม granularity
            // map: key -> { total, minDate, maxDate }
            const groupMap = new Map();

            filtered.forEach((o) => {
                const d = new Date(o[dateField]);
                let key;

                if (granularity === "day") {
                    key = format(d, "yyyy-MM-dd");
                } else if (granularity === "week") {
                    // จัด key เป็นวันจันทร์ต้นสัปดาห์ (ไว้ใช้ group เท่านั้น)
                    const day = d.getDay();
                    const monday = new Date(d);
                    monday.setDate(d.getDate() - ((day + 6) % 7));
                    key = format(monday, "yyyy-MM-dd");
                } else {
                    key = format(d, "yyyy-MM-01");
                }

                const prev = groupMap.get(key);
                const total = (prev?.total ?? 0) + Number(o.total_price);
                const minDate = prev ? (d < prev.minDate ? d : prev.minDate) : d;
                const maxDate = prev ? (d > prev.maxDate ? d : prev.maxDate) : d;

                groupMap.set(key, { total, minDate, maxDate });
            });

            // แปลง map → array เรียงตาม date
            const data = Array.from(groupMap.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([key, bucket]) => {
                    let labelDate;

                    if (granularity === "day") {
                        // ใช้วันที่เดียวกับ key
                        labelDate = new Date(key);
                    } else if (granularity === "week") {
                        // แสดงเป็นวันสุดท้ายที่มีออเดอร์ในสัปดาห์นั้น
                        labelDate = bucket.maxDate;
                    } else {
                        // month: ใช้วันแรกของเดือน
                        labelDate = new Date(key);
                    }

                    return {
                        label: format(labelDate, "yyyy-MM-dd"),
                        revenue: bucket.total,
                    };
                });

            resolve({ data, granularity });
        }, 500);
    });
}

function transformRevenueTrend(apiResponse) {
    return {
        data: (apiResponse?.data ?? []).map((item) => ({
            label: item.label,
            revenue: item.revenue,
        })),
        granularity: apiResponse?.granularity ?? "month",
    };
}

// ── Occupancy & Guest mock ─────────────────────────────────────
const OCCUPANCY_GUEST_MOCK = {
    // รวมทุกประเภทห้อง
    occupancy: {
        points: [
            { date: "2022-01-01", occupancyPercent: 32 },
            { date: "2022-02-01", occupancyPercent: 45 },
            { date: "2022-03-01", occupancyPercent: 68 },
            { date: "2022-04-01", occupancyPercent: 78 },
            { date: "2022-05-01", occupancyPercent: 54 },
            { date: "2022-06-01", occupancyPercent: 82 },
        ],
    },
    // แยกตามประเภทห้อง
    occupancyByRoomType: {
        roomTypes: [
            { id: "superior_garden_view", label: "Superior Garden View" },
            { id: "deluxe", label: "Deluxe" },
            { id: "superior", label: "Superior" },
            { id: "supreme", label: "Supreme" },
        ],
        monthly: [
            {
                month: "2022-01-01",
                occupancyPercentByRoomType: {
                    superior_garden_view: 40,
                    deluxe: 55,
                    superior: 30,
                    supreme: 25,
                },
            },
            {
                month: "2022-02-01",
                occupancyPercentByRoomType: {
                    superior_garden_view: 35,
                    deluxe: 48,
                    superior: 28,
                    supreme: 22,
                },
            },
            {
                month: "2022-03-01",
                occupancyPercentByRoomType: {
                    superior_garden_view: 60,
                    deluxe: 72,
                    superior: 50,
                    supreme: 45,
                },
            },
            {
                month: "2022-04-01",
                occupancyPercentByRoomType: {
                    superior_garden_view: 84,
                    deluxe: 78,
                    superior: 62,
                    supreme: 58,
                },
            },
            {
                month: "2022-05-01",
                occupancyPercentByRoomType: {
                    superior_garden_view: 52,
                    deluxe: 60,
                    superior: 46,
                    supreme: 40,
                },
            },
            {
                month: "2022-06-01",
                occupancyPercentByRoomType: {
                    superior_garden_view: 80,
                    deluxe: 70,
                    superior: 65,
                    supreme: 60,
                },
            },
        ],
    },
    guestVisit: {
        totalGuests: 985,
        segments: [
            { id: "new", label: "New guests", count: 867, percent: 88 },
            { id: "returning", label: "Returning guests", count: 118, percent: 12 },
        ],
    },
    paymentMethods: [
        { id: "credit_card", label: "Credit card", count: 699, percent: 71 },
        { id: "cash", label: "Cash", count: 286, percent: 29 },
    ],
};

// ── Check-in / Check-out averages mock ─────────────────────────
const CHECKIN_CHECKOUT_MOCK = {
    checkIn: {
        label: "Check-in",
        time: "4:03 PM",
        description: "Check-in time from 2:00 PM onwards",
    },
    checkOut: {
        label: "Check-out",
        time: "10:32 PM",
        description: "Check-out time by 12:00 PM",
    },
};

function fetchCheckInCheckOutAverages() {
    // ในโปรดักชันจะเป็นการเรียก API จริง เช่น:
    // return axios.get("/api/admin/analytics/checkin-checkout-averages");
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                data: CHECKIN_CHECKOUT_MOCK,
                meta: {
                    source: "mock",
                },
            });
        }, 500);
    });
}

// ── Website traffic (live via Supabase + API route) ─────────────

function transformOccupancyGuest(apiResponse) {
    // overall line
    const occupancySeries = (apiResponse?.occupancy?.points ?? []).map((p) => ({
        label: format(new Date(p.date), "MMM"),
        percent: p.occupancyPercent,
    }));

    // room type bar (หนึ่ง record ต่อเดือน, key = roomType.id)
    const roomTypes = apiResponse?.occupancyByRoomType?.roomTypes ?? [];
    const monthly = apiResponse?.occupancyByRoomType?.monthly ?? [];

    const occupancyByRoomTypeSeries = monthly.map((m) => {
        const base = { monthLabel: format(new Date(m.month), "MMMM") };
        const values = m.occupancyPercentByRoomType ?? {};

        roomTypes.forEach((rt) => {
            base[rt.id] = values[rt.id] ?? 0;
        });

        return base;
    });

    return {
        occupancySeries,
        occupancyByRoomTypeSeries,
        roomTypes,
        guestVisit: apiResponse?.guestVisit ?? { totalGuests: 0, segments: [] },
        paymentMethods: apiResponse?.paymentMethods ?? [],
    };
}

function fetchOccupancyGuest(dateFrom, dateTo, viewBy = "overall") {
    // ในโปรดักชัน ตรงนี้จะเป็นการเรียก API จริง เช่น:
    // return axios.get("/api/admin/analytics/occupancy-guest", { params: { from, to, viewBy }});
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                data: OCCUPANCY_GUEST_MOCK,
                meta: {
                    from: dateFrom?.toISOString().split("T")[0] ?? null,
                    to: dateTo?.toISOString().split("T")[0] ?? null,
                    viewBy,
                },
            });
        }, 500);
    });
}

function AnalyticDashboard() {
    const today = new Date();
    const currentYear = today.getFullYear();
    // ── Room Availability mock , transform -------------------------------------------------------
    const [roomPeriod, setRoomPeriod] = useState("month");
    const [roomData, setRoomData] = useState([]);
    const [roomLoading, setRoomLoading] = useState(true);
    // ── Booking Trends mock  transform ---------------------------------------------------------------
    const [bookingPeriod, setBookingPeriod] = useState("month");
    const [bookingData, setBookingData] = useState([]);
    const [bookingLoading, setBookingLoading] = useState(true);
    // ── Revenue Trend (date range, mock API) --------------------------------------------------------
    const [revenueDateFrom, setRevenueDateFrom] = useState(
        () => new Date(currentYear, 0, 1)
    );
    const [revenueDateTo, setRevenueDateTo] = useState(() => today);
    const [revenueMode, setRevenueMode] = useState("booking_date");
    const [revenueGranularity, setRevenueGranularity] = useState("month");
    const [revenueData, setRevenueData] = useState([]);
    const [revenueLoading, setRevenueLoading] = useState(true);
    // ── Occupancy & Guest ---------------------------------------------------------------------------
    const [occFrom, setOccFrom] = useState(() => new Date(2022, 0, 1));
    const [occTo, setOccTo] = useState(() => new Date(2022, 5, 28));
    const [occViewBy, setOccViewBy] = useState("overall");
    const [occData, setOccData] = useState({
        occupancySeries: [],
        occupancyByRoomTypeSeries: [],
        roomTypes: [],
        guestVisit: { totalGuests: 0, segments: [] },
        paymentMethods: [],
    });
    const [occLoading, setOccLoading] = useState(true);
    // ── Check-in / Check-out averages ----------------------------------------------------------------
    const [checkTimeData, setCheckTimeData] = useState(null);
    const [checkTimeLoading, setCheckTimeLoading] = useState(true);
    // ── Website traffic ------------------------------------------------------------------------------
    const [trafficPeriod, setTrafficPeriod] = useState("last_7_days");
    const [trafficPage, setTrafficPage] = useState("all");
    const [trafficData, setTrafficData] = useState([]);
    const [trafficLoading, setTrafficLoading] = useState(true);
    const [trafficRoomOptions, setTrafficRoomOptions] = useState([]);

    useEffect(() => {
        setRoomLoading(true);
        fetchRoomAvailability(roomPeriod)
            .then((res) => setRoomData(transformRoomAvailability(res)))
            .finally(() => setRoomLoading(false));
    }, [roomPeriod]);

    useEffect(() => {
        setBookingLoading(true);
        fetchBookingTrends(bookingPeriod)
            .then((res) => setBookingData(transformBookingTrends(res)))
            .finally(() => setBookingLoading(false));
    }, [bookingPeriod]);

    useEffect(() => {
        setRevenueLoading(true);
        fetchRevenueTrend(revenueDateFrom, revenueDateTo, revenueMode)
            .then((res) => {
                const { data, granularity } = transformRevenueTrend(res);
                setRevenueData(data);
                setRevenueGranularity(granularity);
            })
            .finally(() => setRevenueLoading(false));
    }, [revenueDateFrom, revenueDateTo, revenueMode]);

    useEffect(() => {
        setOccLoading(true);
        fetchOccupancyGuest(occFrom, occTo, occViewBy)
            .then((res) => setOccData(transformOccupancyGuest(res.data)))
            .finally(() => setOccLoading(false));
    }, [occFrom, occTo, occViewBy]);

    useEffect(() => {
        setCheckTimeLoading(true);
        fetchCheckInCheckOutAverages()
            .then((res) => setCheckTimeData(res.data))
            .finally(() => setCheckTimeLoading(false));
    }, []);

    const fetchTrafficData = useCallback(async () => {
        try {
            const token =
                typeof window !== "undefined"
                    ? window.localStorage.getItem("token")
                    : null;
console.log("tokenForTraffic", token)
            const res = await axios.get("/api/traffic", {
                params: { period: trafficPeriod, page: trafficPage },
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });

            const data = res.data;
            setTrafficData(Array.isArray(data) ? data : []);
        } catch {
            setTrafficData([]);
        } finally {
            setTrafficLoading(false);
        }
    }, [trafficPeriod, trafficPage]);

    useEffect(() => {
        setTrafficLoading(true);
        fetchTrafficData();
    }, [fetchTrafficData]);

    useTrafficRealtime(trafficPeriod, fetchTrafficData);
    

    useEffect(() => {
        fetch("/api/rooms/rooms-all")
            .then((res) => res.json())
            .then((json) => {
                const list = json?.data ?? [];
                const options = list
                    .map((r) => {
                        const name = r.name ?? r.title ?? "";
                        const slug = createSlug(name);
                        if (!slug) return null;
                        return { id: `room:${slug}`, label: name || "Room" };
                    })
                    .filter(Boolean);
                setTrafficRoomOptions(options);
            })
            .catch(() => setTrafficRoomOptions([]));
    }, []);

    return (
        <div className="flex flex-col xl:flex-row">
            <div className="hidden xl:block  sticky">
                <SideBarAdmin />
            </div>

            <nav className="flex flex-row xl:hidden justify-between bg-green-800 py-[11.5px] px-[16px]">
                <div className="flex flex-row items-end gap-[3px]">
                    <LogoNav className="h-fit w-fit" aria-hidden />
                    <span className="body-3 text-green-400">
                        Admin Panel Control
                    </span>
                </div>
                <Hamburger className="h-fit w-fit" aria-hidden />
            </nav>

            <div className="xl:flex xl:flex-col xl:w-full">
                <header className="flex bg-white border border-b border-gray-300 p-[16px]">
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
                        <section className="rounded-[8px] border border-gray-300 p-[16px] xl:pt-[32px] xl:pr-[40px] xl:pl-[40px] xl:pb-[10px] bg-white flex flex-col gap-[8px] relative">
                            <RoomAvailabilityCard
                                periodId={roomPeriod}
                                onPeriodChange={setRoomPeriod}
                                data={roomData}
                                loading={roomLoading}
                            />
                        </section>
                        {/*booking trend */}
                        <section className="rounded-[8px] border border-gray-300 p-[16px] xl:pt-[32px] xl:pr-[40px] xl:pl-[40px] xl:pb-[10px] bg-white flex flex-col gap-[8px] relative">
                            <BookingTrendsByDayCard
                                periodId={bookingPeriod}
                                onPeriodChange={setBookingPeriod}
                                data={bookingData}
                                loading={bookingLoading}
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
                            loading={revenueLoading}
                        />
                    </section>

                    <section className="rounded-[8px] border border-gray-300 p-[16px] bg-white flex flex-col gap-[8px] relative">
                        <OccupancyGuestCard
                            dateFrom={occFrom}
                            dateTo={occTo}
                            onDateFromChange={setOccFrom}
                            onDateToChange={setOccTo}
                            viewBy={occViewBy}
                            onViewByChange={setOccViewBy}
                            data={occData}
                            loading={occLoading}
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
