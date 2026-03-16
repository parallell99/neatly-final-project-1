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

