import axios from "axios";
import {
  format,
  startOfDay,
  addDays,
  differenceInDays,
  addMonths,
} from "date-fns";
import {
  ROOM_AVAILABILITY_MOCK,
  BOOKING_TRENDS_MOCK,
  CHECKIN_CHECKOUT_MOCK,
  computeOccupancyFromMockOrders,
} from "./mockData";
import { MOCK_ORDERS } from "@/utils/DashboardMockData/order";

// ── Room Availability -----------------------------------------------------
export function fetchRoomAvailability(period) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(ROOM_AVAILABILITY_MOCK[period]), 50);
  });
}

// ── Booking Trends --------------------------------------------------------
export function fetchBookingTrends(period) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(BOOKING_TRENDS_MOCK[period]), 50);
  });
}

export async function fetchBookingTrendsLive(period) {
  const token =
    typeof window !== "undefined" ? window.localStorage.getItem("token") : null;

  const res = await axios.get("/api/admin/analytics/booking-trends", {
    params: { period },
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  return res.data;
}

// ── Revenue Trend ---------------------------------------------------------
function getGranularity() {
  // mock ให้เหมือน backend: ส่งรายวันเสมอ
  return "day";
}

export function fetchRevenueTrend(dateFrom, dateTo, mode = "booking_date") {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!dateFrom || !dateTo) {
        resolve({ data: [], granularity: "day" });
        return;
      }

      const granularity = getGranularity();

      // half-open [start, end): ใช้ date-fns ปัดเวลาให้ชัด
      const start = startOfDay(dateFrom);
      const end = addDays(startOfDay(dateTo), 1);

      // stay_date: avg จำนวนวันของการเข้าพัก โดยกรองจากช่วงทับซ้อน check_in/check_out
      if (mode === "stay_date") {
        const groupMap = new Map(); // key -> { totalRevenue }

        const filtered = MOCK_ORDERS.filter((o) => {
          if (!o.check_in_date || !o.check_out_date) return false;
          const ci = new Date(o.check_in_date);
          const co = new Date(o.check_out_date);
          return ci < end && co > start; // overlap
        });

        for (const order of filtered) {
          if (!order.check_in_date || !order.check_out_date) continue;

          const stayStart = startOfDay(new Date(order.check_in_date));
          const stayEndBase = startOfDay(new Date(order.check_out_date));
          const stayDaysRaw = differenceInDays(stayEndBase, stayStart);
          const stayDays = stayDaysRaw > 0 ? stayDaysRaw : 1;
          const perDayRevenue =
            stayDays > 0 ? Number(order.total_price || 0) / stayDays : 0;

          const segmentStart = stayStart > start ? stayStart : start;
          const segmentEnd = stayEndBase < end ? stayEndBase : end;
          if (segmentEnd <= segmentStart) continue;

          let d = segmentStart;
          while (d < segmentEnd) {
            const key = format(d, "yyyy-MM-dd");
            const prev = groupMap.get(key) || { totalRevenue: 0 };
            groupMap.set(key, { totalRevenue: prev.totalRevenue + perDayRevenue });
            d = addDays(d, 1);
          }
        }

        const data = []; // รายวัน
        for (let d = start; d <= dateTo; d = addDays(d, 1)) {
          const key = format(d, "yyyy-MM-dd");
          const bucket = groupMap.get(key);
          const revenue = bucket?.totalRevenue ?? 0;
          data.push({ label: key, revenue });
        }

        resolve({ data, granularity });
        return;
      }

      // booking_date: รวม revenue ตาม created_at ตรงๆ
      const dateField = "created_at";
      const filtered = MOCK_ORDERS.filter((o) => {
        const d = new Date(o[dateField]);
        return d >= start && d < end;
      });

      const groupMap = new Map(); // key -> { total }
      filtered.forEach((o) => {
        const d = new Date(o[dateField]);
        const key = format(d, "yyyy-MM-dd");
        const prev = groupMap.get(key);
        const total = (prev?.total ?? 0) + Number(o.total_price);
        groupMap.set(key, { total });
      });

      const data = Array.from(groupMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, bucket]) => ({
          label: key,
          revenue: bucket.total,
        }));

      resolve({ data, granularity });
    }, 50);
  });
}

export async function fetchRevenueTrendLive(
  dateFrom,
  dateTo,
  mode = "booking_date"
) {
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

// ── Occupancy & Guest -----------------------------------------------------
export function fetchOccupancyGuest(
  dateFrom,
  dateTo,
  viewBy,
  granularity = "month"
) {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!dateFrom || !dateTo) {
        const today = new Date();
        resolve({
          data: computeOccupancyFromMockOrders(
            addMonths(today, -6),
            today,
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
    }, 50);
  });
}

export async function fetchOccupancyGuestLive(
  dateFrom,
  dateTo,
  granularity = "month"
) {
  if (!dateFrom || !dateTo) {
    const today = new Date();
    const fallback = computeOccupancyFromMockOrders(
      addMonths(today, -6),
      today,
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

// ── Check-in / Check-out averages ----------------------------------------
export function fetchCheckInCheckOutAverages() {
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
    }, 50);
  });
}

