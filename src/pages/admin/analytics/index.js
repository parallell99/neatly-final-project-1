"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
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

import {
  format,
  parseISO,
  startOfDay,
  addDays,
  differenceInDays,
  startOfMonth,
  endOfMonth,
  addMonths,
  eachDayOfInterval,
  eachMonthOfInterval,
} from "date-fns";
import { MOCK_ORDERS, ROOM_TYPES } from "@/utils/DashboardMockData/order";
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
    const totalRooms = apiResponse?.totalRooms ?? 0;
    return apiResponse.byDayOfWeek.map((item) => {
        const percent = item.avgOccupancyPercent;
        const rooms =
            totalRooms > 0 ? Math.round((percent / 100) * totalRooms) : 0;
        return {
            day: DAY_LABELS[item.dayOfWeek],
            percent,
            sampleCount: item.sampleCount,
            rooms,
            totalRooms,
        };
    });
}

function fetchBookingTrends(period) {
    return new Promise((resolve) => {
        setTimeout(() => resolve(BOOKING_TRENDS_MOCK[period]), 500);
    });
}

async function fetchBookingTrendsLive(period) {
  const token =
    typeof window !== "undefined" ? window.localStorage.getItem("token") : null;

  const res = await axios.get("/api/admin/analytics/booking-trends", {
    params: { period },
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  return res.data;
}

// ── Revenue Trend mock ─────────────────────────────────────────
function getGranularity() {
    // mock ให้เหมือน backend: ส่งรายวันเสมอ
    return "day";
}

function fetchRevenueTrend(dateFrom, dateTo, mode = "booking_date") {
    return new Promise((resolve) => {
        setTimeout(() => {
            if (!dateFrom || !dateTo) {
                resolve({ data: [], granularity: "day" });
                return;
            }

            const granularity = getGranularity();

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

                key = format(d, "yyyy-MM-dd");

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

                    // ใช้วันที่เดียวกับ key (รายวัน)
                    labelDate = new Date(key);

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
        // backend ส่งรายวันเสมอ ตอนนี้ granularity จะเป็น "day"
        granularity: apiResponse?.granularity ?? "day",
    };
}

async function fetchRevenueTrendLive(dateFrom, dateTo, mode = "booking_date") {
    if (!dateFrom || !dateTo) {
        return { data: [], granularity: "day" };
    }

    const token =
        typeof window !== "undefined"
            ? window.localStorage.getItem("token")
            : null;

    const res = await axios.get("/api/admin/analytics/revenue-trend", {
        params: {
            from: format(dateFrom, "yyyy-MM-dd"),
            to: format(dateTo, "yyyy-MM-dd"),
            mode,
        },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    return res.data;
}

// ── Occupancy & Guest (computed from MOCK_ORDERS) ────────────────
// จำนวนห้องรวมจาก DB จริง (room_types.total_rooms)
const TOTAL_ROOMS = ROOM_TYPES.reduce((sum, rt) => sum + (rt.total_rooms ?? 0), 0);

function isOrderActiveOnDay(order, day) {
    const ci = parseISO(order.check_in_date);
    const co = parseISO(order.check_out_date);
    return day >= ci && day < co;
}

function computeOccupancyFromMockOrders(dateFrom, dateTo, granularity) {
    const fromStr = format(dateFrom, "yyyy-MM-dd");
    const toStr = format(dateTo, "yyyy-MM-dd");

    const ordersList = MOCK_ORDERS.filter((o) => {
        if (!o.check_in_date || !o.check_out_date) return false;
        return o.check_in_date < toStr && o.check_out_date > fromStr;
    });

    const roomTypesMeta = ROOM_TYPES.map((rt) => ({
        id: rt.id,
        label: rt.name ?? rt.id,
        totalRooms: rt.total_rooms ?? 0,
    }));

    const months = eachMonthOfInterval({ start: dateFrom, end: dateTo });

    const occupancyPoints =
        granularity === "day"
            ? (() => {
                  const allDays = eachDayOfInterval({ start: dateFrom, end: dateTo });
                  return allDays.map((day) => {
                      const raw = ordersList.filter((o) => isOrderActiveOnDay(o, day)).length;
                      const occupied = Math.min(raw, TOTAL_ROOMS);
                      return {
                          date: format(day, "yyyy-MM-dd"),
                          occupancyPercent:
                              TOTAL_ROOMS > 0 ? Math.min(100, Math.round((occupied / TOTAL_ROOMS) * 100)) : 0,
                      };
                  });
              })()
            : months.map((monthStart) => {
                  const monthEnd = endOfMonth(monthStart);
                  const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
                  let totalPercent = 0;
                  for (const day of allDays) {
                      const raw = ordersList.filter((o) => isOrderActiveOnDay(o, day)).length;
                      const occupied = Math.min(raw, TOTAL_ROOMS);
                      totalPercent += TOTAL_ROOMS > 0 ? (occupied / TOTAL_ROOMS) * 100 : 0;
                  }
                  return {
                      date: format(monthStart, "yyyy-MM-01"),
                      occupancyPercent: allDays.length > 0 ? Math.min(100, Math.round(totalPercent / allDays.length)) : 0,
                  };
              });

    const occupancyByRoomTypeMonthly = months.map((monthStart) => {
        const monthEnd = endOfMonth(monthStart);
        const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
        const occupancyPercentByRoomType = {};
        for (const rt of roomTypesMeta) {
            const rtOrders = ordersList.filter((o) => o.room_type_id === rt.id);
            let totalPercent = 0;
            for (const day of allDays) {
                const raw = rtOrders.filter((o) => isOrderActiveOnDay(o, day)).length;
                const occupied = Math.min(raw, rt.totalRooms);
                totalPercent += rt.totalRooms > 0 ? (occupied / rt.totalRooms) * 100 : 0;
            }
            occupancyPercentByRoomType[rt.id] =
                allDays.length > 0 ? Math.min(100, Math.round(totalPercent / allDays.length)) : 0;
        }
        return { month: format(monthStart, "yyyy-MM-01"), occupancyPercentByRoomType };
    });

    const ordersInRange = ordersList.filter((o) => {
        const ci = parseISO(o.check_in_date);
        return ci >= dateFrom && ci <= dateTo;
    });

    const returningCount = ordersInRange.filter((o) => o.is_returning_guest === true).length;
    const newCount = ordersInRange.length - returningCount;
    const totalGuests = ordersInRange.length;
    const guestVisit = {
        totalGuests,
        segments: [
            { id: "new", label: "New guests", count: newCount, percent: totalGuests > 0 ? Math.round((newCount / totalGuests) * 100) : 0 },
            { id: "returning", label: "Returning guests", count: returningCount, percent: totalGuests > 0 ? Math.round((returningCount / totalGuests) * 100) : 0 },
        ],
    };

    const cardCount = ordersInRange.filter((o) => o.payment_method === "card").length;
    const cashCount = ordersInRange.filter((o) => o.payment_method === "cash").length;
    const paidTotal = cardCount + cashCount;
    const paymentMethods = [
        { id: "credit_card", label: "Credit card", count: cardCount, percent: paidTotal > 0 ? Math.round((cardCount / paidTotal) * 100) : 0 },
        { id: "cash", label: "Cash", count: cashCount, percent: paidTotal > 0 ? Math.round((cashCount / paidTotal) * 100) : 0 },
    ];

    return {
        from: fromStr,
        to: toStr,
        occupancy: { points: occupancyPoints, totalRooms: TOTAL_ROOMS },
        occupancyByRoomType: {
            roomTypes: roomTypesMeta.map(({ id, label }) => ({ id, label })),
            monthly: occupancyByRoomTypeMonthly,
        },
        guestVisit,
        paymentMethods,
    };
}

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
    const totalRooms = apiResponse?.occupancy?.totalRooms ?? 0;
    const occupancySeries = (apiResponse?.occupancy?.points ?? []).map((p) => {
        const percent = p.occupancyPercent;
        const rooms = totalRooms > 0 ? Math.round((percent / 100) * totalRooms) : 0;
        return { date: p.date, percent, rooms, totalRooms };
    });

    // room type bar (หนึ่ง record ต่อเดือน, key = roomType.id)
    const roomTypes = apiResponse?.occupancyByRoomType?.roomTypes ?? [];
    const monthly = apiResponse?.occupancyByRoomType?.monthly ?? [];

    const occupancyByRoomTypeSeries = monthly.map((m) => {
        const base = { month: m.month, monthLabel: format(new Date(m.month), "MMM yyyy") };
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

function fetchOccupancyGuest(dateFrom, dateTo, viewBy, granularity = "month") {
    return new Promise((resolve) => {
        setTimeout(() => {
            if (!dateFrom || !dateTo) {
                resolve({
                    data: computeOccupancyFromMockOrders(
                        new Date(2025, 0, 1),
                        new Date(),
                        granularity
                    ),
                    meta: { from: null, to: null, viewBy, granularity },
                });
                return;
            }
            const days = differenceInDays(dateTo, dateFrom);
            const sameMonth = format(dateFrom, "yyyy-MM") === format(dateTo, "yyyy-MM");
            const effectiveGranularity =
                granularity === "day" || days <= 30 || sameMonth ? "day" : granularity;
            const data = computeOccupancyFromMockOrders(
                dateFrom,
                dateTo,
                effectiveGranularity
            );
            resolve({
                data,
                meta: {
                    from: format(dateFrom, "yyyy-MM-dd"),
                    to: format(dateTo, "yyyy-MM-dd"),
                    viewBy,
                    granularity: effectiveGranularity,
                },
            });
        }, 500);
    });
}

async function fetchOccupancyGuestLive(dateFrom, dateTo, granularity = "month") {
    if (!dateFrom || !dateTo) {
        const fallback = computeOccupancyFromMockOrders(
            new Date(2025, 0, 1),
            new Date(),
            "month"
        );
        return { data: fallback };
    }

    const token =
        typeof window !== "undefined"
            ? window.localStorage.getItem("token")
            : null;

    const res = await axios.get("/api/admin/analytics/occupancy-guest", {
        params: {
            from: format(dateFrom, "yyyy-MM-dd"),
            to: format(dateTo, "yyyy-MM-dd"),
            granularity,
        },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    return { data: res.data };
}

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
    const [roomData, setRoomData] = useState([]);
    const [roomLoading, setRoomLoading] = useState(true);
    // ── Booking Trends (mock + live) ---------------------------------------------------------------
    const [bookingPeriod, setBookingPeriod] = useState("month");
    const [bookingData, setBookingData] = useState([]);
    const [bookingLoading, setBookingLoading] = useState(true);
    const [bookingUseLive, setBookingUseLive] = useState(false);
    // ── Revenue Trend (date range, mock + live API) --------------------------------------------------------
    const [revenueDateFrom, setRevenueDateFrom] = useState(
        () => new Date(currentYear, 0, 1)
    );
    const [revenueDateTo, setRevenueDateTo] = useState(() => today);
    const [revenueMode, setRevenueMode] = useState("booking_date");
    const [revenueGranularity, setRevenueGranularity] = useState("month");
    const [revenueData, setRevenueData] = useState([]);
    const [revenueLoading, setRevenueLoading] = useState(true);
    const [revenueUseLive, setRevenueUseLive] = useState(false);
    // ── Occupancy & Guest ---------------------------------------------------------------------------
    const [occFrom, setOccFrom] = useState(() => new Date(2025, 0, 1));
    const [occTo, setOccTo] = useState(() => new Date());
    const [occViewBy, setOccViewBy] = useState("overall");
    const [occGranularity, setOccGranularity] = useState("month");
    const [occUseLive, setOccUseLive] = useState(false);
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
        let cancelled = false;

        async function loadBookingTrends() {
            try {
                setBookingLoading(true);

                const res = bookingUseLive
                    ? await fetchBookingTrendsLive(bookingPeriod)
                    : await fetchBookingTrends(bookingPeriod);

                if (cancelled || !res) return;
                setBookingData(transformBookingTrends(res));
            } catch {
                if (cancelled) return;
                setBookingData([]);
            } finally {
                if (cancelled) return;
                setBookingLoading(false);
            }
        }

        loadBookingTrends();

        return () => {
            cancelled = true;
        };
    }, [bookingPeriod, bookingUseLive]);

    useEffect(() => {
        let cancelled = false;

        async function loadRevenueTrend() {
            try {
                setRevenueLoading(true);

                const res = revenueUseLive
                    ? await fetchRevenueTrendLive(revenueDateFrom, revenueDateTo, revenueMode)
                    : await fetchRevenueTrend(revenueDateFrom, revenueDateTo, revenueMode);

                if (cancelled || !res) return;
                const { data } = transformRevenueTrend(res);
                setRevenueData(data);
            } catch {
                if (cancelled) return;
                setRevenueData([]);
            } finally {
                if (cancelled) return;
                setRevenueLoading(false);
            }
        }

        loadRevenueTrend();

        return () => {
            cancelled = true;
        };
    }, [revenueDateFrom, revenueDateTo, revenueMode, revenueUseLive]);

    useEffect(() => {
        let cancelled = false;

        async function loadOccupancyGuest() {
            try {
                setOccLoading(true);

                const days = occFrom && occTo ? differenceInDays(occTo, occFrom) : 0;
                const sameMonth =
                    occFrom &&
                    occTo &&
                    format(occFrom, "yyyy-MM") === format(occTo, "yyyy-MM");
                const effectiveGranularity =
                    days <= 30 || sameMonth ? "day" : occGranularity;

                const res = occUseLive
                    ? await fetchOccupancyGuestLive(
                          occFrom,
                          occTo,
                          effectiveGranularity
                      )
                    : await fetchOccupancyGuest(
                          occFrom,
                          occTo,
                          occViewBy,
                          effectiveGranularity
                      );

                if (cancelled || !res) return;
                setOccData(transformOccupancyGuest(res.data));
            } catch {
                if (cancelled) return;
                setOccData({
                    occupancySeries: [],
                    occupancyByRoomTypeSeries: [],
                    roomTypes: [],
                    guestVisit: { totalGuests: 0, segments: [] },
                    paymentMethods: [],
                });
            } finally {
                if (cancelled) return;
                setOccLoading(false);
            }
        }

        loadOccupancyGuest();
        return () => {
            cancelled = true;
        };
    }, [occFrom, occTo, occViewBy, occGranularity, occUseLive]);

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
            <div className="hidden xl:block">
                <SideBarAdmin />
            </div>

            <AdminMobileNav />

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
                                if (!date) { setOccFrom(date); return; }
                                const maxFrom = occTo ? addMonths(occTo, -6) : null;
                                setOccFrom(maxFrom && date < maxFrom ? maxFrom : date);
                            }}
                            onDateToChange={(date) => {
                                if (!date) { setOccTo(date); return; }
                                const maxTo = occFrom ? addMonths(occFrom, 6) : null;
                                setOccTo(maxTo && date > maxTo ? maxTo : date);
                            }}
                            viewBy={occViewBy}
                            onViewByChange={setOccViewBy}
                            granularity={occGranularity}
                            onGranularityChange={(v) => setOccGranularity(v)}
                            data={occData}
                            loading={occLoading}
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
